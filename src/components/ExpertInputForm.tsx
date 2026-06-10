import { useEffect, useMemo, useState } from "react";
import { Brain, Loader2, Sparkles, AlertTriangle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { mergeStepInputs, type Project } from "@/lib/projects-store";
import {
  EXPERT_FORMS,
  computePrefill,
  missingRequired,
} from "@/lib/oa-analysis-state";
import { PromptPreview } from "@/components/PromptPreview";

export function ExpertInputForm({
  project,
  stepId,
  onRun,
  running,
}: {
  project: Project;
  stepId: number;
  onRun: () => void;
  running: boolean;
}) {
  const fields = EXPERT_FORMS[stepId];
  const saved = project.steps[stepId]?.inputs ?? {};
  const prefill = useMemo(() => computePrefill(project, stepId), [project, stepId]);

  // Local form state, hydrated from saved inputs (user-entered) or auto-prefill.
  const initial: Record<string, string> = {};
  const sourceInit: Record<string, "user" | "auto" | "empty"> = {};
  for (const f of fields ?? []) {
    if (saved[f.key]?.trim()) {
      initial[f.key] = saved[f.key];
      sourceInit[f.key] = "user";
    } else if (prefill[f.key]?.trim()) {
      initial[f.key] = prefill[f.key];
      sourceInit[f.key] = "auto";
    } else {
      initial[f.key] = "";
      sourceInit[f.key] = "empty";
    }
  }
  const [values, setValues] = useState<Record<string, string>>(initial);
  const [sources, setSources] = useState<Record<string, "user" | "auto" | "empty">>(sourceInit);

  // Re-hydrate when stepId or project changes (e.g. prior step output updates)
  useEffect(() => {
    const next: Record<string, string> = {};
    const nextSrc: Record<string, "user" | "auto" | "empty"> = {};
    for (const f of fields ?? []) {
      if (saved[f.key]?.trim()) {
        next[f.key] = saved[f.key];
        nextSrc[f.key] = "user";
      } else if (prefill[f.key]?.trim()) {
        next[f.key] = prefill[f.key];
        nextSrc[f.key] = "auto";
      } else {
        next[f.key] = "";
        nextSrc[f.key] = "empty";
      }
    }
    setValues(next);
    setSources(nextSrc);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stepId, project.id, JSON.stringify(prefill)]);

  if (!fields) return null;

  function change(key: string, v: string) {
    setValues((s) => ({ ...s, [key]: v }));
    setSources((s) => ({ ...s, [key]: v.trim() ? "user" : "empty" }));
  }

  function persistAndRun() {
    // Persist all field values into the project's step inputs so the
    // server-side expert prompt has the exact required inputs.
    mergeStepInputs(project.id, stepId, values);
    // Defer to allow store commit before the server fn captures snapshot.
    setTimeout(onRun, 0);
  }

  function acceptAutoFills() {
    mergeStepInputs(project.id, stepId, values);
    setSources((s) => {
      const next = { ...s };
      for (const k of Object.keys(values)) {
        if (values[k].trim()) next[k] = "user";
      }
      return next;
    });
  }

  const missing = missingRequired(project, stepId, values);

  return (
    <section className="ring-grid rounded-lg bg-card">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border p-5">
        <div>
          <div className="font-mono text-[11px] uppercase tracking-wider text-accent">
            Expert Analysis Inputs
          </div>
          <h3 className="font-display text-xl font-semibold">
            Step {stepId} — Required Fields
          </h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Fields below are passed directly to the senior-analyst AI prompt.
            Outputs from prior steps auto-flow into this step and remain editable.
          </p>
        </div>
        <div className="flex items-center gap-1">
          <PromptPreview stepId={stepId} values={values} />
          <Button onClick={persistAndRun} disabled={running} className="gap-2">
            {running ? <Loader2 className="h-4 w-4 animate-spin" /> : <Brain className="h-4 w-4" />}
            Run Expert AI Analysis
          </Button>
        </div>
      </header>

      {missing.length > 0 && (
        <div className="border-b border-amber-500/30 bg-amber-500/10 px-5 py-3">
          <div className="flex items-start gap-2 text-xs text-amber-200">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <div>
              <span className="font-mono uppercase tracking-wider">
                Missing prerequisite information
              </span>
              <div className="mt-1">
                The following required fields are empty:{" "}
                <span className="font-medium">{missing.join(" · ")}</span>. The
                Expert AI Analysis can still run, but results will be less
                defensible without them.
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-5 p-5">
        {fields.map((f) => {
          const src = sources[f.key];
          return (
            <div key={f.key}>
              <div className="mb-1.5 flex items-center justify-between gap-2">
                <label className="font-mono text-[11px] uppercase tracking-wider text-foreground">
                  {f.label}
                  {f.required && <span className="ml-1 text-accent">*</span>}
                </label>
                <div className="flex items-center gap-1.5">
                  {src === "auto" && f.autoFrom && (
                    <Badge variant="outline" className="gap-1 font-mono text-[9px] uppercase tracking-wider text-accent">
                      <Sparkles className="h-3 w-3" />
                      AI · auto-filled from {f.autoFrom}
                    </Badge>
                  )}
                  {src === "user" && (
                    <Badge variant="outline" className="font-mono text-[9px] uppercase tracking-wider text-primary">
                      Analyst-entered
                    </Badge>
                  )}
                  {src === "empty" && f.required && (
                    <Badge variant="outline" className="font-mono text-[9px] uppercase tracking-wider text-amber-300">
                      Required · empty
                    </Badge>
                  )}
                </div>
              </div>
              <Textarea
                rows={f.key === "problemStatement" || f.key === "subQuestions" ? 4 : 3}
                value={values[f.key] ?? ""}
                placeholder={f.placeholder}
                onChange={(e) => change(f.key, e.target.value)}
                className={
                  src === "auto"
                    ? "border-accent/30 bg-accent/5 font-mono text-[12px]"
                    : "font-mono text-[12px]"
                }
              />
            </div>
          );
        })}

        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-4">
          <p className="text-[11px] text-muted-foreground">
            Auto-filled values populate from the centralized OA Analysis State
            and persist across refreshes via local storage.
          </p>
          <Button variant="outline" size="sm" onClick={acceptAutoFills}>
            Save Field Edits
          </Button>
        </div>
      </div>
    </section>
  );
}
