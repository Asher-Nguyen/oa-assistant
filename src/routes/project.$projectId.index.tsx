import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import { AppShell } from "@/components/AppShell";
import { StepBadge } from "@/components/StepBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { OA_STEPS, getStep } from "@/lib/oa-steps";
import {
  getCompletionPercent,
  saveStepInputs,
  saveStepOutput,
  useHydrated,
  useProject,
  type Project,
} from "@/lib/projects-store";

import { generateStepOutput } from "@/lib/ai-generate";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronLeft,
  Copy,
  Download,
  FileText,
  Loader2,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/project/$projectId/")({
  head: ({ params }) => ({
    meta: [
      { title: "OA Workspace · " + params.projectId.slice(0, 8) },
      { name: "description", content: "Operations Analysis project workspace." },
    ],
  }),
  component: ProjectPage,
});

function ProjectPage() {
  const { projectId } = Route.useParams();
  const project = useProject(projectId);
  const hydrated = useHydrated();
  const [activeStep, setActiveStep] = useState(1);

  if (!hydrated) {
    return (
      <AppShell>
        <div className="mx-auto max-w-7xl px-6 py-24 text-center text-muted-foreground">
          <Loader2 className="mx-auto h-6 w-6 animate-spin text-primary" />
          <p className="mt-3 text-sm">Loading workspace…</p>
        </div>
      </AppShell>
    );
  }

  if (!project) {

    return (
      <AppShell>
        <div className="mx-auto max-w-7xl px-6 py-24 text-center">
          <h1 className="font-display text-2xl font-semibold">Project not found</h1>
          <p className="mt-2 text-muted-foreground">
            This analysis may have been deleted or is not on this device.
          </p>
          <Button asChild className="mt-6">
            <Link to="/">Back to Projects</Link>
          </Button>
        </div>
      </AppShell>
    );
  }

  const pct = getCompletionPercent(project);
  const step = getStep(activeStep)!;
  const stepState = project.steps[activeStep];

  return (
    <AppShell>
      {/* Workspace header */}
      <div className="border-b border-border bg-surface/40">
        <div className="mx-auto max-w-7xl px-6 py-6">
          <Link to="/" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
            <ChevronLeft className="h-4 w-4" /> All projects
          </Link>
          <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
            <div>
              <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                Project · {project.id.slice(0, 8)}
              </div>
              <h1 className="mt-1 font-display text-3xl font-semibold">{project.name}</h1>
              <p className="mt-1 max-w-2xl text-sm text-muted-foreground line-clamp-2">
                {project.problemStatement || "No problem statement provided."}
              </p>
            </div>
            <div className="min-w-[240px]">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Completion</span>
                <span className="font-mono">{pct}%</span>
              </div>
              <Progress value={pct} className="mt-1 h-1.5" />
              <div className="mt-3 flex gap-2">
                <Button size="sm" className="gap-2" asChild>
                  <Link to="/project/$projectId/guided" params={{ projectId: project.id }}>
                    <Sparkles className="h-3.5 w-3.5" /> Guided Mode
                  </Link>
                </Button>
                <Button size="sm" variant="outline" className="gap-2" onClick={() => exportReport(project)}>
                  <Download className="h-3.5 w-3.5" /> Export Report
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto grid max-w-7xl gap-6 px-6 py-8 lg:grid-cols-[260px_1fr]">
        {/* Sidebar — 8 steps */}
        <aside className="lg:sticky lg:top-20 lg:self-start">
          <div className="ring-grid rounded-lg bg-card p-2">
            <div className="px-3 py-2 text-stencil text-[10px] text-muted-foreground">8-Step Protocol</div>
            <nav className="space-y-1">
              {OA_STEPS.map((s) => {
                const state: "complete" | "active" | "todo" =
                  project.steps[s.id]?.output
                    ? "complete"
                    : activeStep === s.id
                      ? "active"
                      : "todo";
                return (
                  <button
                    key={s.id}
                    onClick={() => setActiveStep(s.id)}
                    className={
                      "flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm transition " +
                      (activeStep === s.id
                        ? "bg-primary/10 text-foreground ring-1 ring-primary/30"
                        : "text-muted-foreground hover:bg-surface hover:text-foreground")
                    }
                  >
                    <StepBadge n={s.id} state={state} />
                    <div className="min-w-0">
                      <div className="truncate font-medium">{s.name}</div>
                      <div className="truncate text-xs text-muted-foreground">{s.short}</div>
                    </div>
                  </button>
                );
              })}
            </nav>
          </div>
        </aside>

        {/* Main */}
        <main className="space-y-6">
          <StepWorkspace
            key={step.id}
            projectId={project.id}
            stepId={step.id}
            initialInputs={stepState?.inputs ?? {}}
            initialOutput={stepState?.output}
            project={project}
          />

          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              disabled={activeStep === 1}
              onClick={() => setActiveStep((s) => Math.max(1, s - 1))}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" /> Previous Step
            </Button>
            <Button
              variant="ghost"
              disabled={activeStep === 8}
              onClick={() => setActiveStep((s) => Math.min(8, s + 1))}
              className="gap-2"
            >
              Next Step <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </main>
      </div>
    </AppShell>
  );
}

function StepWorkspace({
  projectId,
  stepId,
  initialInputs,
  initialOutput,
  project,
}: {
  projectId: string;
  stepId: number;
  initialInputs: Record<string, string>;
  initialOutput?: string;
  project: Project;
}) {
  const step = getStep(stepId)!;
  const [inputs, setInputs] = useState<Record<string, string>>(initialInputs);
  const [output, setOutput] = useState<string | undefined>(initialOutput);
  const [loading, setLoading] = useState(false);

  // Auto-prefill: forward previous step's relevant fields where keys overlap
  useEffect(() => {
    if (Object.keys(initialInputs).length > 0 || !project) return;
    const merged: Record<string, string> = {};
    step.inputs.forEach((f) => {
      if (f.key === "problemStatement" && project.problemStatement) {
        merged[f.key] = project.problemStatement;
        return;
      }
      for (let s = stepId - 1; s >= 1; s--) {
        const prior = project.steps[s]?.inputs?.[f.key];
        if (prior) {
          merged[f.key] = prior;
          break;
        }
      }
    });
    if (Object.keys(merged).length) setInputs(merged);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stepId]);

  const onChange = (key: string, value: string) => {
    setInputs((p) => ({ ...p, [key]: value }));
  };

  const handleSave = () => {
    saveStepInputs(projectId, stepId, inputs);
    toast.success("Inputs saved");
  };

  const handleGenerate = async () => {
    saveStepInputs(projectId, stepId, inputs);
    setLoading(true);
    try {
      const fresh: Project = { ...project, steps: { ...project.steps, [stepId]: { inputs } } };
      const result = await generateStepOutput(fresh, stepId);
      setOutput(result);
      saveStepOutput(projectId, stepId, result);
      toast.success(`Step ${stepId} artifact generated`);
    } catch (e) {
      toast.error("Generation failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_1.1fr]">
      {/* Input panel */}
      <section className="ring-grid rounded-lg bg-card">
        <header className="flex items-center justify-between border-b border-border p-5">
          <div>
            <div className="font-mono text-[11px] uppercase tracking-wider text-primary">
              Step {String(step.id).padStart(2, "0")}
            </div>
            <h2 className="font-display text-xl font-semibold">{step.name}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{step.description}</p>
          </div>
          <Badge variant="outline" className="font-mono text-[10px]">INTAKE</Badge>
        </header>
        <div className="space-y-5 p-5">
          {step.inputs.map((f) => (
            <div key={f.key} className="space-y-2">
              <Label htmlFor={f.key} className="text-sm">
                {f.label}
              </Label>
              {f.multiline ? (
                <Textarea
                  id={f.key}
                  rows={4}
                  placeholder={f.placeholder}
                  value={inputs[f.key] ?? ""}
                  onChange={(e) => onChange(f.key, e.target.value)}
                />
              ) : (
                <Input
                  id={f.key}
                  placeholder={f.placeholder}
                  value={inputs[f.key] ?? ""}
                  onChange={(e) => onChange(f.key, e.target.value)}
                />
              )}
              {f.hint && <p className="text-xs text-muted-foreground">{f.hint}</p>}
            </div>
          ))}

          <Separator />

          <div className="flex flex-wrap gap-2">
            <Button onClick={handleGenerate} disabled={loading} className="gap-2">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              {output ? "Regenerate Artifact" : "Generate Artifact"}
            </Button>
            <Button variant="outline" onClick={handleSave} className="gap-2">
              <Check className="h-4 w-4" /> Save Inputs
            </Button>
          </div>
        </div>
      </section>

      {/* Output panel */}
      <section className="ring-grid rounded-lg bg-card">
        <header className="flex items-center justify-between border-b border-border p-5">
          <div>
            <div className="font-mono text-[11px] uppercase tracking-wider text-accent">Artifact</div>
            <h2 className="font-display text-xl font-semibold">Generated Output</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Structured report with summary, findings, risks, and recommendations.
            </p>
          </div>
          <div className="flex gap-1">
            <Button
              size="icon"
              variant="ghost"
              disabled={!output}
              onClick={() => {
                navigator.clipboard.writeText(output || "");
                toast.success("Copied to clipboard");
              }}
              title="Copy"
            >
              <Copy className="h-4 w-4" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              disabled={!output}
              onClick={() => downloadText(`${step.name}.md`, output || "")}
              title="Download"
            >
              <Download className="h-4 w-4" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              disabled={!output || loading}
              onClick={handleGenerate}
              title="Regenerate"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </header>
        <div className="p-5">
          {loading && (
            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <p className="mt-3 text-sm">Synthesizing artifact…</p>
            </div>
          )}
          {!loading && !output && (
            <div className="flex flex-col items-center justify-center py-20 text-center text-muted-foreground">
              <FileText className="h-8 w-8" />
              <p className="mt-3 max-w-xs text-sm">
                Fill in the intake fields and generate to produce the Step {step.id} artifact.
              </p>
            </div>
          )}
          {!loading && output && (
            <article className="prose-oa max-w-none whitespace-pre-wrap font-mono text-[13px] leading-6 text-foreground">
              {output}
            </article>
          )}
        </div>
      </section>
    </div>
  );
}

function downloadText(filename: string, content: string) {
  const blob = new Blob([content], { type: "text/markdown" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function exportReport(project: Project) {
  const parts = [
    `# OA Analysis Report — ${project.name}`,
    `_Generated ${new Date().toLocaleString()}_`,
    "",
    `## Problem Statement`,
    project.problemStatement || "_not provided_",
    "",
  ];
  OA_STEPS.forEach((s) => {
    const out = project.steps[s.id]?.output;
    parts.push(`---`, `\n# Step ${s.id} — ${s.name}\n`);
    parts.push(out || `_Step ${s.id} artifact has not been generated yet._`);
  });
  downloadText(`${project.name.replace(/\s+/g, "_")}_OA_Report.md`, parts.join("\n"));
  toast.success("Report downloaded");
}
