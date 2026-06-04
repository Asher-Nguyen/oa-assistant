import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export function StepBadge({
  n,
  state,
  className,
}: {
  n: number;
  state: "complete" | "active" | "todo";
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex h-8 w-8 items-center justify-center rounded-md font-mono text-xs ring-1",
        state === "complete" && "bg-success/15 text-success ring-success/40",
        state === "active" && "bg-primary/15 text-primary ring-primary/50",
        state === "todo" && "bg-surface text-muted-foreground ring-border",
        className,
      )}
    >
      {state === "complete" ? <Check className="h-4 w-4" /> : n.toString().padStart(2, "0")}
    </div>
  );
}
