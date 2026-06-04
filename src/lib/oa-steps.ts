export type InputField = {
  key: string;
  label: string;
  placeholder?: string;
  multiline?: boolean;
  hint?: string;
};

export type OAStep = {
  id: number;
  slug: string;
  name: string;
  short: string;
  description: string;
  inputs: InputField[];
};

export const OA_STEPS: OAStep[] = [
  {
    id: 1,
    slug: "critical-thinking",
    name: "Critical Thinking",
    short: "Frame the problem",
    description:
      "Establish the underlying problem, customer directive, and surrounding context before analysis begins.",
    inputs: [
      { key: "problemStatement", label: "Problem Statement", multiline: true, placeholder: "What is the actual problem being analyzed?" },
      { key: "customerDirective", label: "Customer Directive", multiline: true, placeholder: "What did the customer specifically ask for?" },
      { key: "background", label: "Additional Background Information", multiline: true, placeholder: "History, prior efforts, related programs..." },
    ],
  },
  {
    id: 2,
    slug: "establish-context",
    name: "Establish Context",
    short: "Stakeholders & constraints",
    description: "Capture stakeholders, mission context, constraints, and prior studies that shape the analysis.",
    inputs: [
      { key: "problemStatement", label: "Problem Statement", multiline: true },
      { key: "stakeholders", label: "Stakeholders", multiline: true, placeholder: "Decision makers, users, customers, partners..." },
      { key: "missionContext", label: "Mission Context", multiline: true },
      { key: "constraints", label: "Constraints", multiline: true, placeholder: "Schedule, budget, classification, policy..." },
      { key: "existingStudies", label: "Existing Studies", multiline: true },
    ],
  },
  {
    id: 3,
    slug: "identify-metrics",
    name: "Identify Metrics",
    short: "Questions to answer",
    description: "Derive the primary analytical question and supporting sub-questions that scope the analysis.",
    inputs: [
      { key: "problemStatement", label: "Problem Statement", multiline: true },
      { key: "primaryQuestion", label: "Primary Question", multiline: true },
      { key: "subQuestions", label: "Sub Questions", multiline: true, placeholder: "One per line" },
    ],
  },
  {
    id: 4,
    slug: "establish-methodology",
    name: "Establish Methodology",
    short: "MOOs, MOEs, MOPs",
    description: "Define measures of outcome, effectiveness, and performance that drive the methodology.",
    inputs: [
      { key: "problemStatement", label: "Problem Statement", multiline: true },
      { key: "analyticalQuestion", label: "Analytical Question", multiline: true },
      { key: "moos", label: "MOOs — Measures of Outcome", multiline: true },
      { key: "moes", label: "MOEs — Measures of Effectiveness", multiline: true },
      { key: "mops", label: "MOPs — Measures of Performance", multiline: true },
    ],
  },
  {
    id: 5,
    slug: "prepare",
    name: "Prepare",
    short: "Plan the run",
    description: "Lock in objective, metrics, and methodology before execution begins.",
    inputs: [
      { key: "problemStatement", label: "Problem Statement", multiline: true },
      { key: "analysisObjective", label: "Analysis Objective", multiline: true },
      { key: "metrics", label: "Metrics", multiline: true },
      { key: "methodology", label: "Methodology", multiline: true },
    ],
  },
  {
    id: 6,
    slug: "execute",
    name: "Execute",
    short: "Run the analysis",
    description: "Document the execution plan, data sources, tools, and models used to produce results.",
    inputs: [
      { key: "executionPlan", label: "Execution Plan", multiline: true },
      { key: "dataSources", label: "Data Sources", multiline: true },
      { key: "tools", label: "Tools", multiline: true },
      { key: "models", label: "Models", multiline: true },
    ],
  },
  {
    id: 7,
    slug: "analyze-data",
    name: "Analyze Data",
    short: "Interpret results",
    description: "Convert raw results and data outputs into findings supported by evidence.",
    inputs: [
      { key: "results", label: "Results", multiline: true },
      { key: "dataOutputs", label: "Data Outputs", multiline: true },
      { key: "findings", label: "Findings", multiline: true },
    ],
  },
  {
    id: 8,
    slug: "reach-conclusions",
    name: "Reach Conclusions",
    short: "Recommendations",
    description: "Translate findings into recommendations tied to decision maker objectives.",
    inputs: [
      { key: "findings", label: "Findings", multiline: true },
      { key: "recommendations", label: "Recommendations", multiline: true },
      { key: "decisionMakerObjectives", label: "Decision Maker Objectives", multiline: true },
    ],
  },
];

export const getStep = (id: number) => OA_STEPS.find((s) => s.id === id);
