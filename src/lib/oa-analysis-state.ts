import type { Project } from "./projects-store";

/**
 * Centralized OA Analysis State.
 * Reads from prior step inputs/outputs to provide auto-prefilled values
 * for downstream step input forms. Already persisted via projects-store
 * (localStorage `oa.projects.v1`).
 */

export type FieldSource = "user" | "auto" | "project";

export type ExpertField = {
  key: string;
  label: string;
  placeholder?: string;
  required?: boolean;
  /** Where the suggested value originates if the user has not yet edited it. */
  autoFrom?: string;
  /** Compute the auto-populated value from prior project state. */
  derive?: (p: Project) => string;
};

const get = (p: Project, stepId: number, key: string) =>
  (p.steps[stepId]?.inputs?.[key] || "").trim();
const out = (p: Project, stepId: number) => (p.steps[stepId]?.output || "").trim();

export const EXPERT_FORMS: Record<number, ExpertField[]> = {
  1: [
    {
      key: "problemStatement",
      label: "Problem Statement / Client Directive",
      placeholder:
        "Paste the initial directive or problem statement from the client...",
      required: true,
      autoFrom: "Project problem statement",
      derive: (p) => p.problemStatement,
    },
  ],
  2: [
    {
      key: "problemStatement",
      label: "Problem Statement",
      required: true,
      autoFrom: "Step 1",
      derive: (p) => get(p, 1, "problemStatement") || p.problemStatement,
    },
    {
      key: "stakeholders",
      label: "Stakeholders",
      placeholder: "Decision makers, users, customers, partners...",
      required: true,
    },
    {
      key: "missionContext",
      label: "Mission Context / Scenarios",
      placeholder: "Operational scenarios the system will face...",
      required: true,
    },
    {
      key: "constraints",
      label: "Constraints",
      placeholder: "Schedule, budget, classification, policy, technical...",
      required: true,
    },
    {
      key: "existingStudies",
      label: "Existing Studies",
      placeholder: "Prior unclassified studies, references, gaps...",
    },
  ],
  3: [
    {
      key: "problemStatement",
      label: "Problem Statement",
      required: true,
      autoFrom: "Step 1",
      derive: (p) => get(p, 2, "problemStatement") || get(p, 1, "problemStatement") || p.problemStatement,
    },
    {
      key: "primaryQuestion",
      label: "Primary Analytical Question",
      placeholder: "The single, precise analytical question...",
      required: true,
      autoFrom: "Step 1 output",
      derive: (p) => extractPrimaryQuestion(out(p, 1)),
    },
    {
      key: "subQuestions",
      label: "Sub-Questions",
      placeholder: "One per line — MECE, testable, data-driven",
      required: true,
      autoFrom: "Step 1 output",
      derive: (p) => extractSubQuestions(out(p, 1)),
    },
  ],
  4: [
    {
      key: "problemStatement",
      label: "Problem Statement",
      required: true,
      autoFrom: "Step 1",
      derive: (p) => get(p, 3, "problemStatement") || get(p, 1, "problemStatement") || p.problemStatement,
    },
    {
      key: "analyticalQuestion",
      label: "Primary Analytical Question",
      required: true,
      autoFrom: "Step 3",
      derive: (p) => get(p, 3, "primaryQuestion"),
    },
    {
      key: "moos",
      label: "MOOs — Measures of Outcome",
      required: true,
      autoFrom: "Step 3 output",
      derive: (p) => extractSection(out(p, 3), /MEASURES OF OUTCOME|MOOS/i),
    },
    {
      key: "moes",
      label: "MOEs — Measures of Effectiveness",
      required: true,
      autoFrom: "Step 3 output",
      derive: (p) => extractSection(out(p, 3), /MEASURES OF EFFECTIVENESS|MOES/i),
    },
    {
      key: "mops",
      label: "MOPs — Measures of Performance",
      required: true,
      autoFrom: "Step 3 output",
      derive: (p) => extractSection(out(p, 3), /MEASURES OF PERFORMANCE|MOPS/i),
    },
  ],
  5: [
    {
      key: "problemStatement",
      label: "Problem Statement",
      required: true,
      autoFrom: "Step 1",
      derive: (p) => get(p, 4, "problemStatement") || get(p, 1, "problemStatement") || p.problemStatement,
    },
    {
      key: "analysisObjective",
      label: "Analysis Objective",
      required: true,
      autoFrom: "Step 3 output",
      derive: (p) =>
        extractSection(out(p, 3), /ANALYSIS OBJECTIVE/i) || get(p, 3, "primaryQuestion"),
    },
    {
      key: "metrics",
      label: "Selected MOOs, MOEs, and MOPs",
      required: true,
      autoFrom: "Step 3 output",
      derive: (p) => {
        const moos = get(p, 4, "moos");
        const moes = get(p, 4, "moes");
        const mops = get(p, 4, "mops");
        if (moos || moes || mops) {
          return `MOOs:\n${moos}\n\nMOEs:\n${moes}\n\nMOPs:\n${mops}`.trim();
        }
        return out(p, 3);
      },
    },
    {
      key: "methodology",
      label: "Proposed Methodology",
      required: true,
      autoFrom: "Step 4 output",
      derive: (p) => out(p, 4),
    },
  ],
};

/** Extract a section from an AI-generated markdown artifact. */
function extractSection(text: string, header: RegExp): string {
  if (!text) return "";
  const lines = text.split("\n");
  let start = -1;
  for (let i = 0; i < lines.length; i++) {
    if (header.test(lines[i])) {
      start = i + 1;
      break;
    }
  }
  if (start === -1) return "";
  const out: string[] = [];
  for (let i = start; i < lines.length; i++) {
    const l = lines[i];
    if (/^\s*(#+\s|\d+\.\s+[A-Z])/.test(l) && out.length > 0) break;
    out.push(l);
  }
  return out.join("\n").trim();
}

function extractPrimaryQuestion(text: string): string {
  if (!text) return "";
  const m = text.match(/PRIMARY[^\n]*QUESTION[^\n]*\n+([^\n]+(?:\n[^\n]+){0,3})/i);
  return m ? m[1].trim() : "";
}

function extractSubQuestions(text: string): string {
  return extractSection(text, /SUB[\s-]?QUESTIONS/i);
}

/** Compute prefilled values for a step's expert form. */
export function computePrefill(
  project: Project,
  stepId: number,
): Record<string, string> {
  const fields = EXPERT_FORMS[stepId] || [];
  const result: Record<string, string> = {};
  for (const f of fields) {
    result[f.key] = f.derive ? f.derive(project) : "";
  }
  return result;
}

/** Identify required fields that are still empty for the current step. */
export function missingRequired(
  project: Project,
  stepId: number,
  values: Record<string, string>,
): string[] {
  const fields = EXPERT_FORMS[stepId] || [];
  return fields.filter((f) => f.required && !(values[f.key] || "").trim()).map((f) => f.label);
}
