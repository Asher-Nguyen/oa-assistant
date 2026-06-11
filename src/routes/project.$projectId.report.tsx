import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { useHydrated, useProject } from "@/lib/projects-store";
import { OA_STEPS } from "@/lib/oa-steps";
import {
  ChevronLeft,
  Copy,
  Download,
  FileDown,
  Loader2,
  Printer,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/project/$projectId/report")({
  head: () => ({ meta: [{ title: "Final Report" }] }),
  component: ReportViewerPage,
});

function ReportViewerPage() {
  const { projectId } = Route.useParams();
  const project = useProject(projectId);
  const hydrated = useHydrated();

  if (!hydrated) {
    return (
      <AppShell>
        <div className="mx-auto max-w-5xl px-6 py-24 text-center text-muted-foreground">
          <Loader2 className="mx-auto h-6 w-6 animate-spin text-primary" />
        </div>
      </AppShell>
    );
  }

  if (!project) {
    return (
      <AppShell>
        <div className="mx-auto max-w-5xl px-6 py-24 text-center">
          <h1 className="font-display text-2xl">Project not found</h1>
          <Button asChild className="mt-6">
            <Link to="/">Back to Projects</Link>
          </Button>
        </div>
      </AppShell>
    );
  }

  const report = project.finalReport;
  const kindLabel =
    project.finalReportKind === "user-expert"
      ? "User Input + Expert AI"
      : project.finalReportKind === "user"
        ? "User Input Only"
        : "—";
  const generatedAt = project.finalReportGeneratedAt
    ? new Date(project.finalReportGeneratedAt).toLocaleString()
    : "—";

  const filenameBase = (project.name || "oa-report")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  function downloadMarkdown() {
    if (!report) return;
    const blob = new Blob([report], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${filenameBase}.md`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function copyReport() {
    if (!report) return;
    navigator.clipboard.writeText(report);
    toast.success("Report copied to clipboard");
  }

  function printReport() {
    window.print();
  }

  if (!report) {
    return (
      <AppShell>
        <div className="mx-auto max-w-5xl px-6 py-16">
          <Link
            to="/project/$projectId/guided"
            params={{ projectId: project.id }}
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <ChevronLeft className="h-4 w-4" /> Back to Workspace
          </Link>
          <div className="ring-grid mt-8 rounded-lg bg-card p-12 text-center">
            <h1 className="font-display text-2xl">No report yet</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Generate a report from the workspace to view it here.
            </p>
            <Button asChild className="mt-6">
              <Link to="/project/$projectId/guided" params={{ projectId: project.id }}>
                Go to Workspace
              </Link>
            </Button>
          </div>
        </div>
      </AppShell>
    );
  }

  // Split the report into per-step sections so we can render them in a
  // structured viewer rather than dumping a single text blob.
  const sections = splitReportSections(report);

  return (
    <AppShell>
      <div className="print:hidden border-b border-border bg-surface/40">
        <div className="mx-auto max-w-6xl px-6 py-5">
          <Link
            to="/project/$projectId/guided"
            params={{ projectId: project.id }}
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <ChevronLeft className="h-4 w-4" /> Back to Workspace
          </Link>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="font-mono text-[10px] uppercase tracking-wider text-primary">
                Final Report
              </div>
              <h1 className="font-display text-2xl font-semibold">{project.name}</h1>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" className="gap-2" onClick={copyReport}>
                <Copy className="h-4 w-4" /> Copy Report
              </Button>
              <Button variant="outline" size="sm" className="gap-2" onClick={downloadMarkdown}>
                <Download className="h-4 w-4" /> Download Markdown
              </Button>
              <Button variant="outline" size="sm" className="gap-2" onClick={printReport}>
                <FileDown className="h-4 w-4" /> Download PDF
              </Button>
              <Button variant="ghost" size="sm" className="gap-2" onClick={printReport}>
                <Printer className="h-4 w-4" /> Print
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-6 py-10 print:max-w-none print:px-0 print:py-0">
        <article className="ring-grid rounded-lg bg-card p-8 print:rounded-none print:p-0 print:ring-0">
          <header className="mb-8 border-b border-border pb-6">
            <div className="font-mono text-[10px] uppercase tracking-wider text-primary">
              Operations Analysis · 8-Step OA Report
            </div>
            <h1 className="mt-2 font-display text-3xl font-semibold">{project.name}</h1>
            <dl className="mt-5 grid gap-3 text-sm sm:grid-cols-2">
              <div>
                <dt className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                  Project Name
                </dt>
                <dd className="mt-1 text-foreground">{project.name}</dd>
              </div>
              <div>
                <dt className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                  Date Generated
                </dt>
                <dd className="mt-1 text-foreground">{generatedAt}</dd>
              </div>
              <div>
                <dt className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                  Report Type
                </dt>
                <dd className="mt-1 text-foreground">{kindLabel}</dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                  Problem Statement
                </dt>
                <dd className="mt-1 whitespace-pre-wrap text-foreground">
                  {project.problemStatement || "—"}
                </dd>
              </div>
            </dl>
          </header>

          <div className="space-y-10">
            {OA_STEPS.map((s) => {
              const body = sections.get(s.id);
              return (
                <section key={s.id} className="break-inside-avoid">
                  <div className="font-mono text-[10px] uppercase tracking-wider text-accent">
                    Step {String(s.id).padStart(2, "0")} of 08
                  </div>
                  <h2 className="font-display text-xl font-semibold">
                    {s.name}
                  </h2>
                  <p className="mt-1 text-xs text-muted-foreground">{s.description}</p>
                  <div className="mt-4 whitespace-pre-wrap font-mono text-[13px] leading-6 text-foreground">
                    {body?.trim() || "_No content captured for this step._"}
                  </div>
                </section>
              );
            })}
          </div>
        </article>
      </div>
    </AppShell>
  );
}

// Pulls the per-step body out of the markdown the report builder produced.
function splitReportSections(report: string): Map<number, string> {
  const out = new Map<number, string>();
  const lines = report.split("\n");
  let currentStep: number | null = null;
  let buf: string[] = [];
  const flush = () => {
    if (currentStep != null) {
      out.set(currentStep, buf.join("\n"));
    }
    buf = [];
  };
  const headingRe = /^##\s+Step\s+(\d+)\b/;
  for (const line of lines) {
    const m = headingRe.exec(line);
    if (m) {
      flush();
      currentStep = parseInt(m[1], 10);
      continue;
    }
    if (currentStep != null) {
      if (line.trim() === "---") continue;
      buf.push(line);
    }
  }
  flush();
  // Ensure all 8 steps have entries even if missing in markdown.
  for (const s of getStepIds()) if (!out.has(s)) out.set(s, "");
  return out;
}

function getStepIds(): number[] {
  return OA_STEPS.map((s) => s.id);
}

