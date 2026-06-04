import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";

import { AppShell } from "@/components/AppShell";
import { StepBadge } from "@/components/StepBadge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { OA_STEPS, getStep } from "@/lib/oa-steps";
import {
  getCompletionPercent,
  mergeStepInputs,
  saveStepChat,
  saveStepOutput,
  saveFinalReport,
  useHydrated,
  useProject,
  type ChatMessage,
  type Project,
} from "@/lib/projects-store";
import {
  oaGuidedTurn,
  oaGenerateArtifact,
  oaFinalReport,
} from "@/lib/oa-ai.functions";
import {
  ArrowRight,
  Check,
  ChevronLeft,
  FileText,
  Loader2,
  Send,
  Sparkles,
  Wand2,
} from "lucide-react";
import { toast } from "sonner";

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

  const pct = getCompletionPercent(project);
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
                const state: "complete" | "active" | "todo" = project.steps[s.id]?.output
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
            initialChat={stepState?.chat ?? []}
            initialOutput={stepState?.output}
            initialComplete={!!stepState?.guidedComplete}
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
  initialChat,
  initialOutput,
  initialComplete,
  onAdvance,
}: {
  project: Project;
  stepId: number;
  initialChat: ChatMessage[];
  initialOutput?: string;
  initialComplete: boolean;
  onAdvance: () => void;
}) {
  const step = getStep(stepId)!;
  const guidedTurn = useServerFn(oaGuidedTurn);
  const generateArt = useServerFn(oaGenerateArtifact);

  const [chat, setChat] = useState<ChatMessage[]>(initialChat);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const [complete, setComplete] = useState(initialComplete);
  const [output, setOutput] = useState<string | undefined>(initialOutput);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const [generating, setGenerating] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const bootRef = useRef(false);

  // Auto-scroll
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [chat, thinking]);

  // Auto-kick first question if no chat yet
  useEffect(() => {
    if (bootRef.current) return;
    bootRef.current = true;
    if (chat.length === 0 && !complete) {
      void runTurn([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function runTurn(history: ChatMessage[]) {
    setThinking(true);
    try {
      const res = await guidedTurn({ data: { project, stepId, messages: history } });
      const assistantMsg: ChatMessage = { role: "assistant", content: res.text };
      const next = [...history, assistantMsg];
      setChat(next);
      saveStepChat(project.id, stepId, next, res.complete);
      if (res.complete) {
        setComplete(true);
        captureFieldsFromChat(project.id, stepId, next);
        toast.success("Intake complete — ready to generate artifact");
      } else {
        captureFieldsFromChat(project.id, stepId, next);
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "AI request failed";
      toast.error(msg.includes("402") ? "AI credits exhausted" : msg.includes("429") ? "Rate limit — try again" : "AI request failed");
    } finally {
      setThinking(false);
    }
  }

  async function handleSend() {
    if (!input.trim() || thinking) return;
    const userMsg: ChatMessage = { role: "user", content: input.trim() };
    const next = [...chat, userMsg];
    setChat(next);
    setInput("");
    saveStepChat(project.id, stepId, next);
    await runTurn(next);
  }

  async function handleGenerate() {
    setGenerating(true);
    try {
      const res = await generateArt({ data: { project, stepId } });
      setOutput(res.artifact);
      setDraft(res.artifact);
      setEditing(true);
      saveStepOutput(project.id, stepId, res.artifact);
      toast.success("Artifact generated — review and edit before advancing");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Generation failed";
      toast.error(msg);
    } finally {
      setGenerating(false);
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
          <Badge variant="outline" className="font-mono text-[10px]">
            {complete ? "INTAKE COMPLETE" : "INTAKE"}
          </Badge>
        </div>
      </div>

      {/* Chat */}
      <section className="ring-grid rounded-lg bg-card">
        <header className="border-b border-border p-4">
          <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            Senior Analyst · Q&A
          </div>
        </header>
        <div
          ref={scrollRef}
          className="max-h-[420px] min-h-[260px] space-y-4 overflow-y-auto p-5"
        >
          {chat.length === 0 && !thinking && (
            <div className="py-10 text-center text-sm text-muted-foreground">
              Senior analyst is preparing the first question…
            </div>
          )}
          {chat.map((m, i) => (
            <ChatBubble key={i} role={m.role} content={m.content} />
          ))}
          {thinking && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin text-primary" /> Analyst thinking…
            </div>
          )}
        </div>
        {!complete && (
          <div className="border-t border-border p-4">
            <div className="flex gap-2">
              <Textarea
                rows={2}
                placeholder="Type your answer…"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                    e.preventDefault();
                    void handleSend();
                  }
                }}
                disabled={thinking}
              />
              <Button onClick={handleSend} disabled={thinking || !input.trim()} className="self-end gap-1">
                <Send className="h-4 w-4" /> Send
              </Button>
            </div>
            <p className="mt-2 text-[11px] text-muted-foreground">
              ⌘/Ctrl + Enter to send.
            </p>
          </div>
        )}
      </section>

      {/* Artifact */}
      <section className="ring-grid rounded-lg bg-card">
        <header className="flex items-center justify-between border-b border-border p-5">
          <div>
            <div className="font-mono text-[11px] uppercase tracking-wider text-accent">Artifact</div>
            <h3 className="font-display text-xl font-semibold">Step {stepId} Output</h3>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleGenerate} disabled={generating || !complete} className="gap-2">
              {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
              {output ? "Regenerate" : "Generate Artifact"}
            </Button>
            {output && stepId < 8 && (
              <Button variant="outline" onClick={onAdvance} className="gap-2">
                Next Step <ArrowRight className="h-4 w-4" />
              </Button>
            )}
          </div>
        </header>
        <div className="p-5">
          {!output && !generating && (
            <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground">
              <FileText className="h-8 w-8" />
              <p className="mt-3 max-w-xs text-sm">
                {complete
                  ? "Intake captured. Generate the formal Step " + stepId + " artifact."
                  : "Complete the guided Q&A above, then generate the artifact."}
              </p>
            </div>
          )}
          {generating && (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <p className="mt-3 text-sm">Synthesizing artifact…</p>
            </div>
          )}
          {output && !editing && (
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
          {output && editing && (
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
    </div>
  );
}

function ChatBubble({ role, content }: { role: "user" | "assistant"; content: string }) {
  const isUser = role === "user";
  // Strip [field:xxx] markers from display
  const display = content.replace(/\[field:[a-zA-Z0-9_]+\]/g, "").trim();
  return (
    <div className={"flex " + (isUser ? "justify-end" : "justify-start")}>
      <div
        className={
          "max-w-[85%] rounded-lg px-3 py-2 text-sm leading-6 " +
          (isUser
            ? "bg-primary/15 text-foreground ring-1 ring-primary/30"
            : "bg-surface text-foreground ring-1 ring-border")
        }
      >
        {!isUser && (
          <div className="mb-1 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            Sr. Analyst
          </div>
        )}
        <div className="whitespace-pre-wrap">{display}</div>
      </div>
    </div>
  );
}

function FinalReportCard({ project }: { project: Project }) {
  const finalFn = useServerFn(oaFinalReport);
  const [loading, setLoading] = useState(false);
  const allDone = OA_STEPS.every((s) => project.steps[s.id]?.output);

  async function run() {
    setLoading(true);
    try {
      const res = await finalFn({ data: { project } });
      saveFinalReport(project.id, res.report);
      toast.success("Final report generated");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="ring-grid mt-4 rounded-lg bg-card p-4">
      <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
        Final Report
      </div>
      <p className="mt-2 text-xs text-muted-foreground">
        {allDone ? "All 8 steps complete — ready to synthesize." : "Complete all 8 steps to enable."}
      </p>
      <Button
        size="sm"
        disabled={!allDone || loading}
        onClick={run}
        className="mt-3 w-full gap-2"
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
        {project.finalReport ? "Regenerate" : "Generate Report"}
      </Button>
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

/**
 * Best-effort capture: when assistant marks [field:key] in its last question and
 * the user has answered, store the user's last answer under that key.
 */
function captureFieldsFromChat(projectId: string, stepId: number, chat: ChatMessage[]) {
  const updates: Record<string, string> = {};
  for (let i = 0; i < chat.length - 1; i++) {
    const a = chat[i];
    const u = chat[i + 1];
    if (a.role !== "assistant" || u.role !== "user") continue;
    const m = a.content.match(/\[field:([a-zA-Z0-9_]+)\]/);
    if (m) updates[m[1]] = u.content.trim();
  }
  if (Object.keys(updates).length) mergeStepInputs(projectId, stepId, updates);
}
