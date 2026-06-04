import { useEffect, useState, useSyncExternalStore } from "react";

export type StepState = {
  inputs: Record<string, string>;
  output?: string;
  generatedAt?: string;
};

export type Project = {
  id: string;
  name: string;
  problemStatement: string;
  createdAt: string;
  updatedAt: string;
  steps: Record<number, StepState>;
};

const KEY = "oa.projects.v1";
const isBrowser = typeof window !== "undefined";
const EMPTY: Project[] = [];

// Cached snapshot — required for useSyncExternalStore referential stability.
let cache: Project[] | null = null;

function load(): Project[] {
  if (!isBrowser) return EMPTY;
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Project[]) : [];
  } catch {
    return [];
  }
}

function getSnapshot(): Project[] {
  if (!isBrowser) return EMPTY;
  if (cache === null) cache = load();
  return cache;
}

function getServerSnapshot(): Project[] {
  return EMPTY;
}

const listeners = new Set<() => void>();
function notify() {
  listeners.forEach((l) => l());
}

function commit(projects: Project[]) {
  if (!isBrowser) return;
  cache = projects;
  try {
    localStorage.setItem(KEY, JSON.stringify(projects));
  } catch {
    // ignore quota errors
  }
  notify();
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

export function useProjects() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

export function useHydrated() {
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);
  return hydrated;
}

export function useProject(id: string | undefined): Project | undefined {
  const projects = useProjects();
  if (!id) return undefined;
  return projects.find((p) => p.id === id);
}


export function createProject(input: { name: string; problemStatement: string }): Project {
  const now = new Date().toISOString();
  const project: Project = {
    id:
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : Math.random().toString(36).slice(2) + Date.now().toString(36),
    name: input.name.trim() || "Untitled Analysis",
    problemStatement: input.problemStatement.trim(),
    createdAt: now,
    updatedAt: now,
    steps: {},
  };
  commit([project, ...getSnapshot()]);
  return project;
}

export function updateProject(id: string, mut: (p: Project) => Project) {
  const next = getSnapshot().map((p) =>
    p.id === id ? { ...mut(p), updatedAt: new Date().toISOString() } : p,
  );
  commit(next);
}

export function deleteProject(id: string) {
  commit(getSnapshot().filter((p) => p.id !== id));
}

export function saveStepInputs(projectId: string, stepId: number, inputs: Record<string, string>) {
  updateProject(projectId, (p) => ({
    ...p,
    steps: { ...p.steps, [stepId]: { ...(p.steps[stepId] || { inputs: {} }), inputs } },
  }));
}

export function saveStepOutput(projectId: string, stepId: number, output: string) {
  updateProject(projectId, (p) => ({
    ...p,
    steps: {
      ...p.steps,
      [stepId]: {
        ...(p.steps[stepId] || { inputs: {} }),
        output,
        generatedAt: new Date().toISOString(),
      },
    },
  }));
}

export function getCompletionPercent(p: Project | undefined) {
  if (!p) return 0;
  const done = Object.values(p.steps).filter((s) => s?.output).length;
  return Math.round((done / 8) * 100);
}
