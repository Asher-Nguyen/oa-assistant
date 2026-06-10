import { useState } from "react";
import { Copy, Check, Info } from "lucide-react";

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
import {
  EXPERT_PROMPT_TEMPLATES,
  renderPromptSegments,
  renderPromptText,
} from "@/lib/expert-prompt-templates";

export function PromptPreview({
  stepId,
  values,
}: {
  stepId: number;
  values: Record<string, string>;
}) {
  const [copied, setCopied] = useState(false);
  const tpl = EXPERT_PROMPT_TEMPLATES[stepId];
  if (!tpl) return null;

  const segments = renderPromptSegments(stepId, values);

  async function copy() {
    try {
      await navigator.clipboard.writeText(renderPromptText(stepId, values));
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* noop */
    }
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="Preview Expert AI prompt"
          title="Preview the exact prompt sent to the Expert AI"
          className="h-9 w-9 text-muted-foreground hover:text-foreground"
        >
          <Info className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Expert AI Prompt Preview</DialogTitle>
          <DialogDescription>
            Step {stepId} — {tpl.stepName}. Read-only view of the prompt the
            Expert AI will receive. Highlighted spans show exactly where your
            inputs are injected.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="rendered" className="w-full">
          <div className="flex items-center justify-between gap-2">
            <TabsList>
              <TabsTrigger value="rendered">Rendered Prompt</TabsTrigger>
              <TabsTrigger value="template">Prompt Template</TabsTrigger>
            </TabsList>
            <Button type="button" variant="outline" size="sm" onClick={copy} className="gap-2">
              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? "Copied" : "Copy Prompt"}
            </Button>
          </div>

          <TabsContent value="rendered" className="mt-3">
            <ScrollArea className="h-[55vh] rounded-md border border-border bg-muted/30 p-4">
              <pre className="whitespace-pre-wrap break-words font-mono text-[12px] leading-relaxed text-foreground">
                {segments.map((seg, i) =>
                  seg.type === "text" ? (
                    <span key={i}>{seg.value}</span>
                  ) : (
                    <mark
                      key={i}
                      title={`Injected from: ${seg.label}`}
                      className={
                        seg.filled
                          ? "rounded bg-accent/25 px-1 py-0.5 font-semibold text-accent-foreground ring-1 ring-accent/40"
                          : "rounded bg-amber-500/20 px-1 py-0.5 font-semibold text-amber-200 ring-1 ring-amber-500/40"
                      }
                    >
                      {seg.value}
                    </mark>
                  ),
                )}
              </pre>
            </ScrollArea>
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
          These prompts are derived from the OA 8-Step Process and show how
          your inputs are transformed into the Expert AI analysis request.
        </p>
      </DialogContent>
    </Dialog>
  );
}
