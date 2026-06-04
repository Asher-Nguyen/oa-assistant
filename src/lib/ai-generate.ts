import { OA_STEPS, getStep } from "./oa-steps";
import type { Project } from "./projects-store";

/**
 * Placeholder AI generator. Produces a structured, professional-looking OA
 * artifact for each step based on user inputs and prior step outputs.
 *
 * Replace with a server function that calls the Lovable AI Gateway (or OpenAI)
 * once Lovable Cloud is enabled.
 */
export async function generateStepOutput(
  project: Project,
  stepId: number,
): Promise<string> {
  await new Promise((r) => setTimeout(r, 900));
  const step = getStep(stepId)!;
  const inputs = project.steps[stepId]?.inputs ?? {};
  const priorContext = OA_STEPS.filter((s) => s.id < stepId)
    .map((s) => {
      const o = project.steps[s.id]?.output;
      return o ? `### From Step ${s.id} — ${s.name}\n${truncate(o, 320)}` : null;
    })
    .filter(Boolean)
    .join("\n\n");

  const inputBlock = step.inputs
    .map((f) => {
      const v = (inputs[f.key] || "").trim();
      return `- **${f.label}:** ${v || "_not provided_"}`;
    })
    .join("\n");

  return [
    `# Step ${step.id} — ${step.name}`,
    `_${step.description}_`,
    "",
    "## Executive Summary",
    summarize(step, inputs, project),
    "",
    "## Key Findings",
    bulletize(step, inputs),
    "",
    "## Captured Inputs",
    inputBlock,
    "",
    "## Assumptions",
    "- AI-readiness scoring is generated heuristically until the OpenAI integration is enabled.",
    "- Traceability is preserved by forwarding prior step outputs as context.",
    "",
    "## Risks",
    "- Inputs flagged as _not provided_ may weaken downstream analysis.",
    "- Cross-check stakeholder alignment before progressing to the next step.",
    "",
    "## Recommendations",
    "1. Review the captured inputs with your stakeholders.",
    "2. Lock the artifact when complete and proceed to the next OA step.",
    "3. Iterate by regenerating after material changes.",
    priorContext ? `\n## Forwarded Context\n${priorContext}` : "",
  ].join("\n");
}

function truncate(s: string, n: number) {
  return s.length > n ? s.slice(0, n) + "…" : s;
}

function summarize(step: { name: string }, inputs: Record<string, string>, project: Project) {
  const first = Object.values(inputs).find((v) => v && v.trim().length > 0);
  const base = first ? truncate(first.trim(), 280) : project.problemStatement;
  return `For **${project.name}**, the ${step.name} artifact synthesizes the supplied inputs into a structured working draft. ${base}`;
}

function bulletize(step: { inputs: { key: string; label: string }[] }, inputs: Record<string, string>) {
  return step.inputs
    .map((f) => {
      const v = (inputs[f.key] || "").trim();
      if (!v) return `- ${f.label}: _pending_`;
      const head = v.split(/\n|\.\s/)[0];
      return `- ${f.label}: ${truncate(head, 160)}`;
    })
    .join("\n");
}
