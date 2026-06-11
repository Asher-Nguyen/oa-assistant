import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";

import { AppShell } from "@/components/AppShell";
import { StepBadge } from "@/components/StepBadge";
import { ExpertInputForm } from "@/components/ExpertInputForm";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { OA_STEPS, getStep } from "@/lib/oa-steps";
import {
  saveStepOutput,
  saveStepExpertOutput,
  saveStepNotes,
  saveFinalReport,
  useHydrated,
  useProject,
  type Project,
} from "@/lib/projects-store";
import { oaGenerateArtifact } from "@/lib/oa-ai.functions";
import { buildProjectReport, type ReportKind } from "@/lib/report-builder";
import {
  ArrowRight,
  Brain,
  Check,
  ChevronLeft,
  FileText,
  Loader2,
  Sparkles,
  Wand2,
} from "lucide-react";
import { toast } from "sonner";

function computeCompletionPercent(p: Project): number {
  let done = 0;
  for (const s of OA_STEPS) {
    const st = p.steps[s.id];
    if (!st) continue;
    if (s.id <= 5) {
      if (st.output || st.expertOutput) done += 1;
    } else if ((st.notes || "").trim()) {
      done += 1;
    }
  }
  return Math.round((done / 8) * 100);
}

export const Route = createFileRoute("/project/$projectId/guided")({
  head: () => ({ meta: [{ title: "OA Guided Mode" }] }),
  component: GuidedPage,
});

function GuidedPage() {
  const { projectId } = Route.useParams();
  const project = useProject(projectId);
  const hydrated = useHydrated();
  const [stepId, setStepId] = useState(1);

  if (!hydrated) {
    return (
      <AppShell>
        <div className="mx-auto max-w-7xl px-6 py-24 text-center text-muted-foreground">
          <Loader2 className="mx-auto h-6 w-6 animate-spin text-primary" />
        </div>
      </AppShell>
    );
  }
  if (!project) {
    return (
      <AppShell>
        <div className="mx-auto max-w-7xl px-6 py-24 text-center">
          <h1 className="font-display text-2xl">Project not found</h1>
          <Button asChild className="mt-6">
            <Link to="/">Back to Projects</Link>
          </Button>
        </div>
      </AppShell>
    );
  }

  const pct = computeCompletionPercent(project);
  const step = getStep(stepId)!;
  const stepState = project.steps[stepId];

  return (
    <AppShell>
      <div className="border-b border-border bg-surface/40">
        <div className="mx-auto max-w-7xl px-6 py-6">
          <Link
            to="/project/$projectId"
            params={{ projectId: project.id }}
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <ChevronLeft className="h-4 w-4" /> Back to workspace
          </Link>
          <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
            <div>
              <div className="font-mono text-[10px] uppercase tracking-wider text-primary">
                Guided Mode · Senior OA Analyst (MFC)
              </div>
              <h1 className="mt-1 font-display text-3xl font-semibold">{project.name}</h1>
              <p className="mt-1 max-w-2xl text-sm text-muted-foreground line-clamp-2">
                {project.problemStatement || "No problem statement provided."}
              </p>
            </div>
            <div className="min-w-[240px]">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>8-Step Completion</span>
                <span className="font-mono">{pct}%</span>
              </div>
              <Progress value={pct} className="mt-1 h-1.5" />
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto grid max-w-7xl gap-6 px-6 py-8 lg:grid-cols-[240px_1fr]">
        <aside className="lg:sticky lg:top-20 lg:self-start">
          <div className="ring-grid rounded-lg bg-card p-2">
            <div className="px-3 py-2 text-stencil text-[10px] text-muted-foreground">
              Protocol
            </div>
            <nav className="space-y-1">
              {OA_STEPS.map((s) => {
                const st = project.steps[s.id];
                const complete =
                  s.id <= 5
                    ? !!(st?.output || st?.expertOutput)
                    : !!(st?.notes && st.notes.trim());
                const state: "complete" | "active" | "todo" = complete
                  ? "complete"
                  : stepId === s.id
                    ? "active"
                    : "todo";
                return (
                  <button
                    key={s.id}
                    onClick={() => setStepId(s.id)}
                    className={
                      "flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm transition " +
                      (stepId === s.id
                        ? "bg-primary/10 text-foreground ring-1 ring-primary/30"
                        : "text-muted-foreground hover:bg-surface hover:text-foreground")
                    }
                  >
                    <StepBadge n={s.id} state={state} />
                    <div className="min-w-0">
                      <div className="truncate text-xs font-medium">{s.name}</div>
                    </div>
                  </button>
                );
              })}
            </nav>
          </div>
          <FinalReportCard project={project} />
        </aside>

        <main>
          <GuidedStep
            key={stepId}
            project={project}
            stepId={stepId}
            initialOutput={stepState?.output}
            initialExpertOutput={stepState?.expertOutput}
            initialNotes={stepState?.notes}
            onAdvance={() => setStepId((s) => Math.min(8, s + 1))}
          />

        </main>
      </div>
    </AppShell>
  );
}

function GuidedStep({
  project,
  stepId,
  initialOutput,
  initialExpertOutput,
  initialNotes,
  onAdvance,
}: {
  project: Project;
  stepId: number;
  initialOutput?: string;
  initialExpertOutput?: string;
  initialNotes?: string;
  onAdvance: () => void;
}) {
  const step = getStep(stepId)!;
  const generateArt = useServerFn(oaGenerateArtifact);

  const [output, setOutput] = useState<string | undefined>(initialOutput);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const [generating, setGenerating] = useState(false);
  const [expertOutput, setExpertOutput] = useState<string | undefined>(initialExpertOutput);
  const [expertSaved, setExpertSaved] = useState<boolean>(!!initialExpertOutput);
  const [generatingExpert, setGeneratingExpert] = useState(false);
  const [view, setView] = useState<"standard" | "expert">(initialExpertOutput ? "expert" : "standard");
  const [notesDraft, setNotesDraft] = useState<string>(initialNotes ?? "");
  const expertAvailable = stepId >= 1 && stepId <= 5;
  const notesAvailable = stepId >= 6 && stepId <= 8;


  async function handleGenerate() {
    setGenerating(true);
    try {
      const res = await generateArt({ data: { project, stepId, mode: "standard" } });
      setOutput(res.artifact);
      setDraft(res.artifact);
      setEditing(true);
      setView("standard");
      saveStepOutput(project.id, stepId, res.artifact);
      toast.success("Artifact generated — review and edit before advancing");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Generation failed";
      toast.error(msg);
    } finally {
      setGenerating(false);
    }
  }

  async function handleGenerateExpert(customPrompt?: string) {
    setGeneratingExpert(true);
    try {
      const res = await generateArt({
        data: { project, stepId, mode: "expert", ...(customPrompt ? { customPrompt } : {}) },
      });
      setExpertOutput(res.artifact);
      setExpertSaved(false);
      setView("expert");
      toast.success("Expert AI Analysis ready");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Expert analysis failed";
      toast.error(msg);
    } finally {
      setGeneratingExpert(false);
    }
  }

  function saveEdits() {
    saveStepOutput(project.id, stepId, draft);
    setOutput(draft);
    setEditing(false);
    toast.success("Artifact saved");
  }

  return (
    <div className="space-y-6">
      {/* Step header */}
      <div className="ring-grid rounded-lg bg-card p-5">
        <div className="flex items-center justify-between">
          <div>
            <div className="font-mono text-[11px] uppercase tracking-wider text-primary">
              Step {String(step.id).padStart(2, "0")} of 08
            </div>
            <h2 className="font-display text-2xl font-semibold">{step.name}</h2>
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{step.description}</p>
          </div>
          <Badge variant="outline" className="font-mono text-[10px]">INTAKE</Badge>
        </div>
      </div>

      {/* Expert Input Form (Steps 1–5) — fields match AI prompt inputs exactly */}
      {expertAvailable && (
        <ExpertInputForm
          project={project}
          stepId={stepId}
          running={generatingExpert}
          onRun={(prompt) => handleGenerateExpert(prompt)}
        />
      )}

      {/* Artifact — Steps 1–5 only */}
      {expertAvailable && (
      <section className="ring-grid rounded-lg bg-card">
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border p-5">
          <div>
            <div className="font-mono text-[11px] uppercase tracking-wider text-accent">Artifact</div>
            <h3 className="font-display text-xl font-semibold">Step {stepId} Output</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button onClick={handleGenerate} disabled={generating} className="gap-2">
              {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
              {output ? "Regenerate" : "Generate Artifact"}
            </Button>
            <Button
              onClick={() => handleGenerateExpert(project.steps[stepId]?.expertPrompt)}
              disabled={generatingExpert}
              variant="secondary"
              className="gap-2"
            >
              {generatingExpert ? <Loader2 className="h-4 w-4 animate-spin" /> : <Brain className="h-4 w-4" />}
              {expertOutput ? "Re-run Expert AI Analysis" : "Run Expert AI Analysis"}
            </Button>
            {output && stepId < 8 && (
              <Button variant="outline" onClick={onAdvance} className="gap-2">
                Next Step <ArrowRight className="h-4 w-4" />
              </Button>
            )}
          </div>
        </header>

        {/* View toggle */}
        <div className="flex gap-1 border-b border-border bg-surface/40 p-2">
          <button
            onClick={() => setView("standard")}
            className={
              "rounded-md px-3 py-1.5 font-mono text-[10px] uppercase tracking-wider transition " +
              (view === "standard"
                ? "bg-primary/15 text-foreground ring-1 ring-primary/30"
                : "text-muted-foreground hover:text-foreground")
            }
          >
            Structured Input Summary
          </button>
          <button
            onClick={() => setView("expert")}
            className={
              "rounded-md px-3 py-1.5 font-mono text-[10px] uppercase tracking-wider transition " +
              (view === "expert"
                ? "bg-accent/20 text-foreground ring-1 ring-accent/40"
                : "text-muted-foreground hover:text-foreground")
            }
          >
            Expert AI Analysis
          </button>
        </div>

        <div className="p-5">
          {!output && !expertOutput && !generating && !generatingExpert && (
            <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground">
              <FileText className="h-8 w-8" />
              <p className="mt-3 max-w-xs text-sm">
                Fill in the Expert Analysis Inputs above, then run the Expert AI Analysis
                or generate the standard Step {stepId} artifact.
              </p>
            </div>
          )}
          {(generating || generatingExpert) && (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <p className="mt-3 text-sm">
                {generatingExpert ? "Running expert analyst framework…" : "Synthesizing artifact…"}
              </p>
            </div>
          )}

          {view === "expert" && expertOutput && !generating && !generatingExpert && (
            <>
              <div className="mb-3 flex items-center justify-between">
                <div className="font-mono text-[10px] uppercase tracking-wider text-accent">
                  Expert AI Analysis · Senior MFC Analyst Framework
                </div>
                <div className="flex items-center gap-2">
                  {expertSaved ? (
                    <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                      Saved
                    </span>
                  ) : (
                    <span className="font-mono text-[10px] uppercase tracking-wider text-amber-500">
                      Unsaved
                    </span>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-2"
                    onClick={() => {
                      saveStepExpertOutput(project.id, stepId, expertOutput);
                      setExpertSaved(true);
                      toast.success("Expert output saved");
                    }}
                  >
                    <Check className="h-4 w-4" /> Save Expert Output
                  </Button>
                </div>
              </div>
              <article className="prose-oa max-w-none whitespace-pre-wrap font-mono text-[13px] leading-6 text-foreground">
                {expertOutput}
              </article>
            </>
          )}

          {view === "standard" && output && !editing && !generating && (
            <>
              <article className="prose-oa max-w-none whitespace-pre-wrap font-mono text-[13px] leading-6 text-foreground">
                {output}
              </article>
              <div className="mt-4 flex gap-2">
                <Button variant="outline" size="sm" onClick={() => { setDraft(output); setEditing(true); }} className="gap-2">
                  Edit
                </Button>
              </div>
            </>
          )}
          {view === "standard" && output && editing && (
            <>
              <Textarea
                rows={18}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                className="font-mono text-xs"
              />
              <div className="mt-3 flex gap-2">
                <Button onClick={saveEdits} className="gap-2">
                  <Check className="h-4 w-4" /> Save Edits
                </Button>
                <Button variant="ghost" onClick={() => setEditing(false)}>
                  Cancel
                </Button>
              </div>
            </>
          )}
        </div>
      </section>
      )}

      {/* Analyst Notes — Steps 6–8 */}
      {notesAvailable && (
        <section className="ring-grid rounded-lg bg-card p-5">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <div className="font-mono text-[11px] uppercase tracking-wider text-accent">
                Analyst Notes
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                Capture observations, decisions, and follow-ups for Step {stepId}.
              </p>
            </div>
            <Button
              size="sm"
              className="gap-2"
              onClick={() => {
                saveStepNotes(project.id, stepId, notesDraft);
                toast.success("Notes saved");
              }}
            >
              <Check className="h-4 w-4" /> Save Notes
            </Button>
          </div>
          <Textarea
            rows={10}
            value={notesDraft}
            onChange={(e) => setNotesDraft(e.target.value)}
            placeholder="Analyst notes…"
            className="font-mono text-xs"
          />
        </section>
      )}
    </div>
  );
}



function FinalReportCard({ project }: { project: Project }) {
  const [open, setOpen] = useState(false);

  function generate(kind: ReportKind) {
    try {
      const report = buildProjectReport(project, kind);
      saveFinalReport(project.id, report);
      toast.success(
        kind === "user"
          ? "User Input report generated"
          : "User Input + Expert AI report generated",
      );
      setOpen(false);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to build report");
    }
  }

  return (
    <div className="ring-grid mt-4 rounded-lg bg-card p-4">
      <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
        Final Report
      </div>
      <p className="mt-2 text-xs text-muted-foreground">
        Compile analyst inputs, notes, and optional Expert AI outputs into a single report.
      </p>
      <Button
        size="sm"
        onClick={() => setOpen(true)}
        className="mt-3 w-full gap-2"
      >
        <Sparkles className="h-4 w-4" />
        {project.finalReport ? "Regenerate Report" : "Generate Report"}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Select Report Type</DialogTitle>
            <DialogDescription>
              Choose which sources to include in the generated report.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="ring-grid rounded-md bg-surface/40 p-3">
              <div className="font-display text-sm font-semibold">User Input Report</div>
              <p className="mt-1 text-xs text-muted-foreground">
                Generate a report using only analyst-provided inputs and notes.
              </p>
              <Button
                size="sm"
                className="mt-3 w-full"
                onClick={() => generate("user")}
              >
                Generate User Input Report
              </Button>
            </div>
            <div className="ring-grid rounded-md bg-surface/40 p-3">
              <div className="font-display text-sm font-semibold">
                User Input + Expert AI Report
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                Generate a report using analyst inputs, notes, and any saved Expert AI
                outputs from Steps 1–5.
              </p>
              <Button
                size="sm"
                variant="secondary"
                className="mt-3 w-full"
                onClick={() => generate("user-expert")}
              >
                Generate User Input + Expert AI Report
              </Button>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {project.finalReport && (
        <details className="mt-3 text-xs">
          <summary className="cursor-pointer text-muted-foreground">Preview</summary>
          <pre className="mt-2 max-h-64 overflow-auto whitespace-pre-wrap font-mono text-[11px] text-foreground">
            {project.finalReport}
          </pre>
        </details>
      )}
    </div>
  );
}