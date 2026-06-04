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

function read(): Project[] {
  if (!isBrowser) return [];
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]");
  } catch {
    return [];
  }
}

const listeners = new Set<() => void>();
function notify() {
  listeners.forEach((l) => l());
}

function write(projects: Project[]) {
  if (!isBrowser) return;
  localStorage.setItem(KEY, JSON.stringify(projects));
  notify();
}

export function useProjects() {
  const subscribe = (cb: () => void) => {
    listeners.add(cb);
    return () => listeners.delete(cb);
  };
  return useSyncExternalStore(subscribe, read, () => []);
}

export function useProject(id: string | undefined) {
  const [proj, setProj] = useState<Project | undefined>(undefined);
  useEffect(() => {
    const update = () => setProj(read().find((p) => p.id === id));
    update();
    listeners.add(update);
    return () => {
      listeners.delete(update);
    };
  }, [id]);
  return proj;
}

export function createProject(input: { name: string; problemStatement: string }): Project {
  const now = new Date().toISOString();
  const project: Project = {
    id: crypto.randomUUID(),
    name: input.name.trim() || "Untitled Analysis",
    problemStatement: input.problemStatement.trim(),
    createdAt: now,
    updatedAt: now,
    steps: {},
  };
  write([project, ...read()]);
  return project;
}

export function updateProject(id: string, mut: (p: Project) => Project) {
  const projects = read().map((p) => (p.id === id ? { ...mut(p), updatedAt: new Date().toISOString() } : p));
  write(projects);
}

export function deleteProject(id: string) {
  write(read().filter((p) => p.id !== id));
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
