import { OA_STEPS, getStep } from "./oa-steps";
import type { Project } from "./projects-store";

export type ReportKind = "user" | "user-expert";

function header(p: Project) {
  return [
    `# ${p.name}`,
    "",
    "## Problem Statement",
    p.problemStatement?.trim() || "_Not provided._",
    "",
  ].join("\n");
}

function renderInputs(p: Project, stepId: number): string {
  const step = getStep(stepId)!;
  const inputs = p.steps[stepId]?.inputs ?? {};
  const lines = step.inputs.map((f) => {
    const v = (inputs[f.key] || "").trim();
    return `- **${f.label}:** ${v || "_not provided_"}`;
  });
  return lines.join("\n");
}

function renderNotes(p: Project, stepId: number): string {
  const notes = (p.steps[stepId]?.notes || "").trim();
  return notes || "_No analyst notes recorded._";
}

export function buildProjectReport(p: Project, kind: ReportKind): string {
  const out: string[] = [header(p)];
  const isExpert = kind === "user-expert";
  out.push(
    isExpert
      ? "_Report Type: User Input + Expert AI_"
      : "_Report Type: User Input Only_",
    "",
    `_Generated: ${new Date().toLocaleString()}_`,
    "",
    "---",
  );

  for (const step of OA_STEPS) {
    out.push("", `## Step ${step.id} – ${step.name}`, `_${step.description}_`, "");
    if (step.id <= 5) {
      out.push("### Analyst Inputs", renderInputs(p, step.id));
      if (isExpert) {
        const expert = (p.steps[step.id]?.expertOutput || "").trim();
        out.push(
          "",
          "### Expert AI Analysis",
          expert || "_No saved Expert AI output for this step._",
        );
      }
    } else {
      out.push("### Analyst Notes", renderNotes(p, step.id));
    }
    out.push("", "---");
  }
  return out.join("\n");
}
