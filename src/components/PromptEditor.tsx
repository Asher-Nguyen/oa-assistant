import { useEffect, useMemo, useState } from "react";
import { Copy, Check, Info, RotateCcw, Save, Brain, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import {
  EXPERT_PROMPT_TEMPLATES,
  renderPromptText,
} from "@/lib/expert-prompt-templates";
import { saveStepExpertPrompt } from "@/lib/projects-store";
import { toast } from "sonner";

export function PromptEditor({
  projectId,
  stepId,
  values,
  savedPrompt,
  onRun,
  running,
}: {
  projectId: string;
  stepId: number;
  values: Record<string, string>;
  /** Persisted edited prompt for this project+step, if any. */
  savedPrompt?: string;
  /** Run Expert AI Analysis using the (possibly edited) prompt. */
  onRun: (prompt: string) => void;
  running: boolean;
}) {
  const tpl = EXPERT_PROMPT_TEMPLATES[stepId];
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const rendered = useMemo(() => renderPromptText(stepId, values), [stepId, values]);
  const [draft, setDraft] = useState<string>(savedPrompt ?? rendered);

  // Re-sync when step/project changes or saved prompt loads in.
  useEffect(() => {
    setDraft(savedPrompt ?? rendered);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId, stepId, savedPrompt]);

  if (!tpl) return null;

  async function copy() {
    try {
      await navigator.clipboard.writeText(draft);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* noop */
    }
  }

  function resetToOriginal() {
    setDraft(rendered);
    saveStepExpertPrompt(projectId, stepId, undefined);
    toast.success("Rendered prompt reset to original");
  }

  function saveEdit() {
    saveStepExpertPrompt(projectId, stepId, draft);
    toast.success("Edited prompt saved");
  }

  function runWithPrompt() {
    // Persist current edit before running so re-runs use the same prompt.
    if (draft !== rendered) saveStepExpertPrompt(projectId, stepId, draft);
    onRun(draft);
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="View and edit Expert AI prompt"
          title="View and edit the Expert AI prompt"
          className="h-9 w-9 text-muted-foreground hover:text-foreground"
        >
          <Info className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Expert AI Prompt</DialogTitle>
          <DialogDescription>
            Step {stepId} — {tpl.stepName}. The original template is read-only.
            Edit the rendered prompt below; the Expert AI Analysis will use your
            edited version. Edits are saved per project and per step.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="rendered" className="w-full">
          <div className="flex items-center justify-between gap-2">
            <TabsList>
              <TabsTrigger value="rendered">Rendered Prompt (editable)</TabsTrigger>
              <TabsTrigger value="template">Original Prompt Template</TabsTrigger>
            </TabsList>
            <Button type="button" variant="outline" size="sm" onClick={copy} className="gap-2">
              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? "Copied" : "Copy Prompt"}
            </Button>
          </div>

          <TabsContent value="rendered" className="mt-3">
            <Textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              className="h-[55vh] resize-none font-mono text-[12px] leading-relaxed"
              spellCheck={false}
            />
            {draft !== rendered && (
              <p className="mt-1 font-mono text-[10px] uppercase tracking-wider text-accent">
                Edited · differs from original rendered template
              </p>
            )}
          </TabsContent>

          <TabsContent value="template" className="mt-3">
            <ScrollArea className="h-[55vh] rounded-md border border-border bg-muted/30 p-4">
              <pre className="whitespace-pre-wrap break-words font-mono text-[12px] leading-relaxed text-foreground">
                {tpl.template.split(/(\{\{\w+\}\})/g).map((chunk, i) => {
                  const m = chunk.match(/^\{\{(\w+)\}\}$/);
                  if (!m) return <span key={i}>{chunk}</span>;
                  const label =
                    tpl.fields.find((f) => f.key === m[1])?.label ?? m[1];
                  return (
                    <mark
                      key={i}
                      className="rounded bg-primary/20 px-1 py-0.5 font-semibold text-primary ring-1 ring-primary/40"
                      title={`Placeholder for: ${label}`}
                    >
                      [{label}]
                    </mark>
                  );
                })}
              </pre>
            </ScrollArea>
          </TabsContent>
        </Tabs>

        <p className="mt-2 text-[11px] text-muted-foreground">
          These prompts are derived from the OA 8-Step Process. The original
          template is never overwritten — your edits are stored locally on this
          device per project and per step.
        </p>

        <div className="mt-3 flex flex-wrap items-center justify-end gap-2 border-t border-border pt-3">
          <Button type="button" variant="ghost" size="sm" onClick={resetToOriginal} className="gap-2">
            <RotateCcw className="h-3.5 w-3.5" />
            Reset to Original Prompt
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={copy} className="gap-2">
            {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            {copied ? "Copied" : "Copy Prompt"}
          </Button>
          <Button type="button" variant="secondary" size="sm" onClick={saveEdit} className="gap-2">
            <Save className="h-3.5 w-3.5" />
            Save Edited Prompt
          </Button>
          <Button type="button" size="sm" onClick={runWithPrompt} disabled={running} className="gap-2">
            {running ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Brain className="h-3.5 w-3.5" />}
            Run Expert AI Analysis
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
