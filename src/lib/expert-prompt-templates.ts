/**
 * Human-readable Expert AI prompt templates with explicit {{placeholders}}
 * for the Prompt Transparency preview. These mirror the prompts produced by
 * `buildExpertArtifactPrompt` in src/lib/oa-prompts.ts but are exposed in a
 * read-only, render-friendly form so analysts can see exactly how their
 * inputs are injected before the request is sent to the AI.
 */

export type PromptField = {
  key: string;
  label: string;
};

export type ExpertPromptTemplate = {
  stepName: string;
  fields: PromptField[];
  template: string;
};

export const EXPERT_PROMPT_TEMPLATES: Record<number, ExpertPromptTemplate> = {
  1: {
    stepName: "Critical Thinking",
    fields: [{ key: "problemStatement", label: "Problem Statement / Client Directive" }],
    template: `ACT AS A SENIOR LOCKHEED MARTIN OPERATIONS ANALYST AT MFC. I AM PROVIDING YOU WITH THE INITIAL DIRECTIVE/PROBLEM STATEMENT FROM THE CLIENT: {{problemStatement}}

YOUR GOAL IS TO HELP ME CRITICALLY ANALYZE THIS DIRECTIVE. TO PREVENT INFORMATION OVERLOAD, KEEP YOUR RESPONSE CONCISE, HIGHLY STRUCTURED, AND STRICTLY LIMITED TO THE FOLLOWING THREE SECTIONS:

1. CRITICAL ASSUMPTIONS: IDENTIFY THE 3 MOST CRITICAL IMPLICIT ASSUMPTIONS, BIASES, OR CONSTRAINTS EMBEDDED IN THIS STATEMENT. FOCUS ONLY ON ASSUMPTIONS THAT IF FALSE WOULD COMPLETELY INVALIDATE THE ANALYSIS. KEEP EACH TO ONE CONCISE SENTENCE.

2. PRIMARY OVERARCHING QUESTION: FORMULATE ONE SINGULAR, PRECISE ANALYTICAL QUESTION THAT CAPTURES THE CLIENT'S CORE INTENT.

3. SUB QUESTIONS: BREAK THE PRIMARY QUESTION DOWN IN 3-5 TESTABLE, DATA DRIVEN SUB QUESTIONS. ENSURE THESE SUB QUESTIONS FOLLOW THE MECE PRINCIPLE.

IF MORE INFORMATION IS NEEDED ABOUT THE PROBLEM FROM THE CLIENT IN ORDER TO IDENTIFY A CLEARER PROBLEM, PLEASE STATE IT ACUTELY. IF NOT, CONTINUE.`,
  },
  2: {
    stepName: "Establish Context",
    fields: [
      { key: "problemStatement", label: "Problem Statement" },
      { key: "stakeholders", label: "Stakeholders" },
      { key: "missionContext", label: "Mission Context / Scenarios" },
      { key: "constraints", label: "Constraints" },
      { key: "existingStudies", label: "Existing Studies" },
    ],
    template: `YOU ARE A SENIOR OPERATIONS-RESEARCH ANALYST TASKED WITH FRAMING A DEFENSIBLE ANALYSIS FOR THE CUSTOMER'S PROBLEM STATEMENT: {{problemStatement}}

ADDITIONAL CAPTURED CONTEXT:
- STAKEHOLDERS: {{stakeholders}}
- MISSION CONTEXT / SCENARIOS: {{missionContext}}
- CONSTRAINTS: {{constraints}}
- EXISTING STUDIES: {{existingStudies}}

STRUCTURE YOUR RESPONSE INTO SEVEN CONCISE SECTIONS:

1.) DECISION CONTEXT: WHAT DECISION IS BEING CONSIDERED? WHO DECIDES? WHAT IS THE PRIMARY OUTCOME? (≤3 BULLETS)

2.) OPERATIONAL SCENARIOS: IDENTIFY THE TWO MOST LIKELY SCENARIOS FROM THE MISSION CONTEXT ABOVE. FOR EACH GIVE A NAME AND A ONE-SENTENCE DESCRIPTION.

3.) ASSUMPTIONS & CONSTRAINTS:
    • CRITICAL ASSUMPTIONS: THREE MUST-BE-TRUE STATEMENTS.
    • HARD CONSTRAINTS: THREE LIMITING FACTORS FROM THE CONSTRAINTS ABOVE.

4.) RISKS & CHALLENGES: TWO EXTERNAL RISK FACTORS AND TWO PERFORMANCE/MISSION RISKS, EACH IN ONE SENTENCE.

5.) KEY VARIABLES & MEASURES: THREE TUNABLE VARIABLES AND TWO TOP MOES/MOPS FOR SUCCESS.

6.) REQUIRED BACKGROUND DATA: 3-5 DATA ITEMS IN A TABLE — DATA REQUIREMENT | WHY NEEDED | LIKELY SOURCE.

7.) OPEN-SOURCE BASELINE & GAPS: TABLE OF RECENT (≤5 YR) UNCLASSIFIED STUDIES — STUDY TITLE | YEAR | AUTHORS/ORG | PEER-REVIEWED | RELEVANCE | KEY FINDINGS | DATA SOURCES, then KNOWLEDGE GAPS, RESEARCH OBJECTIVES, and PRIMARY RESEARCH QUESTION.

KEEP EACH ITEM BRIEF, USE BULLETS OR SHORT TABLES, AND STAY STRICTLY WITHIN THE SEVEN SECTIONS.`,
  },
  3: {
    stepName: "Identify Metrics",
    fields: [
      { key: "problemStatement", label: "Problem Statement" },
      { key: "primaryQuestion", label: "Primary Analytical Question" },
      { key: "subQuestions", label: "Sub-Questions" },
    ],
    template: `YOU ARE A SENIOR LOCKHEED MARTIN MFC OPERATIONS ANALYST.

THE PROBLEM STATEMENT IS: {{problemStatement}}

THE PRIMARY ANALYTICAL QUESTION IS: {{primaryQuestion}}

THE SUB-QUESTIONS ARE: {{subQuestions}}

YOUR TASK IS TO IDENTIFY THE MOST DEFENSIBLE MEASURES OF MERIT FOR THIS ANALYSIS. STRUCTURE YOUR RESPONSE INTO THE FOLLOWING FIVE SECTIONS:

1. ANALYSIS OBJECTIVE: STATE THE SINGLE PRIMARY OBJECTIVE OF THE ANALYSIS IN ONE SENTENCE.

2. MEASURES OF OUTCOME (MOOS): 2-4 MISSION OUTCOMES, EACH WITH JUSTIFICATION.

3. MEASURES OF EFFECTIVENESS (MOES): 3-5 METRICS — NAME, WHY IT MATTERS, DESIRED DIRECTION.

4. MEASURES OF PERFORMANCE (MOPS): 3-5 METRICS — NAME, UNIT, LIKELY DATA SOURCE.

5. METRIC TRACEABILITY CHECK: TABLE — SUB-QUESTION | SUPPORTING MOO | SUPPORTING MOE | SUPPORTING MOP. IDENTIFY GAPS.

KEEP RESPONSES CONCISE, USE BULLETS OR TABLES, AND ONLY RECOMMEND METRICS THAT ARE QUANTIFIABLE AND DEFENSIBLE.`,
  },
  4: {
    stepName: "Establish Methodology",
    fields: [
      { key: "problemStatement", label: "Problem Statement" },
      { key: "analyticalQuestion", label: "Primary Analytical Question" },
      { key: "moos", label: "MOOs" },
      { key: "moes", label: "MOEs" },
      { key: "mops", label: "MOPs" },
    ],
    template: `YOU ARE A SENIOR LOCKHEED MARTIN MFC OPERATIONS ANALYST.

THE PROBLEM STATEMENT IS: {{problemStatement}}

THE PRIMARY ANALYTICAL QUESTION IS: {{analyticalQuestion}}

THE MOOS, MOES, AND MOPS ARE:
- MOOs: {{moos}}
- MOEs: {{moes}}
- MOPs: {{mops}}

YOUR TASK IS TO DEVELOP A DEFENSIBLE ANALYSIS METHODOLOGY THAT RELATES THE DECISION VARIABLES TO THE MEASURES OF MERIT. STRUCTURE YOUR RESPONSE INTO THE FOLLOWING FOUR SECTIONS:

1. DECISION VARIABLES: 3-5 VARIABLES THE DECISION-MAKER CAN CONTROL — NAME, WHY IT MATTERS.

2. ANALYSIS METHODOLOGY: METHOD NAME, WHY APPROPRIATE, WHICH VARIABLES & METRICS IT EVALUATES.

3. METRIC EVALUATION MATRIX: TABLE — METRIC (MOO/MOE/MOP) | DECISION VARIABLE(S) | EVALUATION METHOD.

4. TOOLS & DATA REQUIREMENTS: TABLE — TOOL/SOFTWARE | PURPOSE | REQUIRED DATA. IDENTIFY GAPS.

KEEP RESPONSES CONCISE, USE TABLES WHERE POSSIBLE, AND ONLY RECOMMEND METHODS THAT ARE OBJECTIVE AND DEFENSIBLE.`,
  },
  5: {
    stepName: "Prepare",
    fields: [
      { key: "problemStatement", label: "Problem Statement" },
      { key: "analysisObjective", label: "Analysis Objective" },
      { key: "metrics", label: "Selected MOOs, MOEs, and MOPs" },
      { key: "methodology", label: "Proposed Methodology" },
    ],
    template: `YOU ARE A SENIOR LOCKHEED MARTIN MFC OPERATIONS ANALYST.

THE PROBLEM STATEMENT IS: {{problemStatement}}

THE ANALYSIS OBJECTIVE IS: {{analysisObjective}}

THE SELECTED MOOS, MOES, AND MOPS ARE: {{metrics}}

THE PROPOSED METHODOLOGY IS: {{methodology}}

YOUR TASK IS TO ASSESS WHETHER THE ANALYSIS IS READY FOR EXECUTION AND IDENTIFY ANY PREPARATION GAPS THAT COULD IMPACT VALIDITY, CREDIBILITY, OR DEFENSIBILITY. STRUCTURE INTO FIVE SECTIONS:

1. DATA READINESS ASSESSMENT: 3-5 DATA REQUIREMENTS — SOURCE, REQUIRED QUALITY, POTENTIAL RISKS.

2. TOOL & MODEL VALIDATION CHECK: KEY TOOLS/MODELS — PURPOSE, VALIDATION REQUIREMENT, LIMITATIONS.

3. EXECUTION RISKS: TOP 3-5 RISKS — DESCRIPTION, LIKELIHOOD (LOW/MED/HIGH), MITIGATION.

4. ANALYSIS EXECUTION PLAN: TABLE — STEP ACTIVITY | INPUTS REQUIRED | OUTPUTS PRODUCED. 5-8 ROWS.

5. READINESS REVIEW: TABLE — CATEGORY | STATUS (READY/PARTIAL/NOT READY) | KEY GAP. COVER DATA, TOOLS, METHODOLOGY, METRICS, EXECUTION PLAN.

CONCLUDE WITH A SINGLE BOLD READINESS ASSESSMENT — "ANALYSIS READY FOR EXECUTION" OR "ADDITIONAL PREPARATION REQUIRED" — AND THE TOP THREE PRE-STEP-6 ACTIONS.`,
  },
};

const PLACEHOLDER_RE = /\{\{(\w+)\}\}/g;

export type PromptSegment =
  | { type: "text"; value: string }
  | { type: "field"; key: string; label: string; value: string; filled: boolean };

/** Split a template into text + field segments using the current values. */
export function renderPromptSegments(
  stepId: number,
  values: Record<string, string>,
): PromptSegment[] {
  const tpl = EXPERT_PROMPT_TEMPLATES[stepId];
  if (!tpl) return [];
  const labelOf = (k: string) => tpl.fields.find((f) => f.key === k)?.label ?? k;
  const segments: PromptSegment[] = [];
  let last = 0;
  for (const m of tpl.template.matchAll(PLACEHOLDER_RE)) {
    const idx = m.index ?? 0;
    if (idx > last) segments.push({ type: "text", value: tpl.template.slice(last, idx) });
    const key = m[1];
    const raw = (values[key] ?? "").trim();
    segments.push({
      type: "field",
      key,
      label: labelOf(key),
      value: raw || "(not provided)",
      filled: raw.length > 0,
    });
    last = idx + m[0].length;
  }
  if (last < tpl.template.length) {
    segments.push({ type: "text", value: tpl.template.slice(last) });
  }
  return segments;
}

/** Render the fully substituted prompt as plain text (for Copy Prompt). */
export function renderPromptText(
  stepId: number,
  values: Record<string, string>,
): string {
  return renderPromptSegments(stepId, values)
    .map((s) => (s.type === "text" ? s.value : s.value))
    .join("");
}
