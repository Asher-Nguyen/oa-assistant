import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { OA_STEPS } from "@/lib/oa-steps";
import { createProject, deleteProject, getCompletionPercent, useProjects } from "@/lib/projects-store";
import { ArrowRight, FileText, Plus, Radar, Sparkles, Trash2, ShieldCheck, Workflow } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "OA Analysis Assistant — Lockheed Martin MFC" },
      {
        name: "description",
        content:
          "AI-powered wrapper around the OA 8-Step Analysis Process. Run structured operations analyses, generate artifacts, and export reports.",
      },
    ],
  }),
  component: Index,
});

function Index() {
  const projects = useProjects();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [problem, setProblem] = useState("");

  const handleCreate = () => {
    if (!name.trim()) {
      toast.error("Project name is required");
      return;
    }
    const p = createProject({ name, problemStatement: problem });
    toast.success(`Project "${p.name}" created`);
    setOpen(false);
    setName("");
    setProblem("");
    navigate({ to: "/project/$projectId", params: { projectId: p.id } });
  };

  return (
    <AppShell>
      {/* HERO */}
      <section className="relative overflow-hidden border-b border-border">
        <div className="absolute inset-0 bg-grid opacity-60" />
        <div className="absolute inset-0 bg-radial-glow" />
        <div className="relative mx-auto max-w-7xl px-6 pt-20 pb-24">
          <div className="flex items-center gap-2">
            <span className="text-stencil text-xs text-primary">Operations Analysis · 8-Step Protocol</span>
            <span className="h-px flex-1 bg-border" />
          </div>
          <h1 className="mt-6 max-w-3xl font-display text-5xl font-semibold leading-[1.05] tracking-tight md:text-6xl">
            Run rigorous operations analyses,{" "}
            <span className="text-primary">guided end-to-end.</span>
          </h1>
          <p className="mt-5 max-w-2xl text-lg text-muted-foreground">
            A structured workspace for MFC analysts. Capture inputs, generate artifacts with AI,
            preserve traceability across all 8 OA steps, and export a complete final report.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <NewProjectDialog
              open={open}
              setOpen={setOpen}
              name={name}
              setName={setName}
              problem={problem}
              setProblem={setProblem}
              onCreate={handleCreate}
              trigger={
                <Button size="lg" className="gap-2">
                  <Plus className="h-4 w-4" /> New Analysis
                </Button>
              }
            />
            <Button variant="outline" size="lg" className="gap-2" asChild>
              <a href="#process">
                <Workflow className="h-4 w-4" /> View the 8-Step Process
              </a>
            </Button>
          </div>

          <div className="mt-14 grid grid-cols-2 gap-3 md:grid-cols-4">
            {[
              { icon: Radar, label: "Structured intake", value: "Per-step input forms" },
              { icon: Sparkles, label: "AI artifact gen", value: "Hidden prompt library" },
              { icon: Workflow, label: "Forward context", value: "Step N → Step N+1" },
              { icon: ShieldCheck, label: "Workspace", value: "Project memory · audit" },
            ].map((s) => (
              <div key={s.label} className="ring-grid rounded-lg bg-surface/60 p-4">
                <s.icon className="h-4 w-4 text-primary" />
                <div className="mt-3 text-xs uppercase tracking-wider text-muted-foreground">{s.label}</div>
                <div className="mt-1 font-display text-sm font-medium">{s.value}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PROJECTS */}
      <section className="mx-auto max-w-7xl px-6 py-16">
        <div className="flex items-end justify-between">
          <div>
            <h2 className="font-display text-2xl font-semibold">Your Analyses</h2>
            <p className="text-sm text-muted-foreground">
              Resume any in-progress workspace or start a new analysis.
            </p>
          </div>
          <NewProjectDialog
            open={open}
            setOpen={setOpen}
            name={name}
            setName={setName}
            problem={problem}
            setProblem={setProblem}
            onCreate={handleCreate}
            trigger={
              <Button variant="outline" className="gap-2">
                <Plus className="h-4 w-4" /> New
              </Button>
            }
          />
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {projects.length === 0 && (
            <div className="ring-grid col-span-full rounded-lg bg-surface/40 p-12 text-center">
              <FileText className="mx-auto h-8 w-8 text-muted-foreground" />
              <div className="mt-3 font-display text-lg">No analyses yet</div>
              <p className="mt-1 text-sm text-muted-foreground">
                Create your first OA project to begin the 8-step workflow.
              </p>
            </div>
          )}
          {projects.map((p) => {
            const pct = getCompletionPercent(p);
            return (
              <Card key={p.id} className="group relative overflow-hidden border-border bg-card transition hover:border-primary/40">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <CardTitle className="font-display text-lg leading-tight">{p.name}</CardTitle>
                      <div className="mt-1 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                        ID · {p.id.slice(0, 8)}
                      </div>
                    </div>
                    <Badge variant="outline" className="font-mono text-[10px]">
                      {pct}% complete
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="line-clamp-2 text-sm text-muted-foreground">
                    {p.problemStatement || "No problem statement yet."}
                  </p>
                  <Progress value={pct} className="h-1.5" />
                  <div className="flex items-center justify-between">
                    <Link
                      to="/project/$projectId"
                      params={{ projectId: p.id }}
                      className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
                    >
                      Open workspace <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-muted-foreground hover:text-destructive"
                      onClick={() => {
                        if (confirm(`Delete "${p.name}"?`)) {
                          deleteProject(p.id);
                          toast.success("Project deleted");
                        }
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      {/* 8-STEP PROCESS */}
      <section id="process" className="border-t border-border bg-surface/30">
        <div className="mx-auto max-w-7xl px-6 py-16">
          <div className="flex items-center gap-2">
            <span className="text-stencil text-xs text-primary">Protocol</span>
            <span className="h-px flex-1 bg-border" />
          </div>
          <h2 className="mt-4 font-display text-3xl font-semibold">The OA 8-Step Process</h2>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            Each step has dedicated intake fields and produces a structured artifact. Outputs flow
            forward as context to maintain traceability from problem statement to conclusions.
          </p>

          <div className="mt-10 grid gap-3 md:grid-cols-2 lg:grid-cols-4">
            {OA_STEPS.map((s) => (
              <div
                key={s.id}
                className="ring-grid relative overflow-hidden rounded-lg bg-card p-5 transition hover:-translate-y-0.5 hover:border-primary/40"
              >
                <div className="flex items-center justify-between">
                  <div className="font-mono text-xs text-primary">STEP {String(s.id).padStart(2, "0")}</div>
                  <div className="h-1 w-8 rounded-full bg-primary/60" />
                </div>
                <h3 className="mt-3 font-display text-lg font-semibold">{s.name}</h3>
                <p className="mt-1 text-xs uppercase tracking-wider text-muted-foreground">{s.short}</p>
                <p className="mt-3 text-sm text-muted-foreground">{s.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="guided" className="mx-auto max-w-7xl px-6 py-16">
        <div className="ring-grid relative overflow-hidden rounded-xl bg-card p-10">
          <div className="absolute inset-0 bg-radial-glow opacity-50" />
          <div className="relative grid items-center gap-8 md:grid-cols-[1.4fr_1fr]">
            <div>
              <span className="text-stencil text-xs text-primary">Bonus capability</span>
              <h2 className="mt-3 font-display text-3xl font-semibold">Guided OA Mode</h2>
              <p className="mt-3 max-w-xl text-muted-foreground">
                Have the assistant act as a Senior Operations Analyst — walking you through all 8
                steps one question at a time and generating every artifact along the way.
              </p>
              <Button className="mt-6 gap-2" onClick={() => toast.info("Guided mode unlocks once AI Gateway is connected.")}>
                <Sparkles className="h-4 w-4" /> Launch Guided Mode
              </Button>
            </div>
            <div className="ring-grid rounded-lg bg-surface/60 p-5 font-mono text-xs leading-6 text-muted-foreground">
              <div className="text-primary">analyst@oa-assistant ~ $</div>
              <div>› load problem-statement</div>
              <div>› extract stakeholders, constraints…</div>
              <div>› derive MOOs, MOEs, MOPs</div>
              <div>› propose methodology</div>
              <div className="text-success">✓ artifact ready — step 04/08</div>
            </div>
          </div>
        </div>
      </section>
    </AppShell>
  );
}

function NewProjectDialog({
  open,
  setOpen,
  name,
  setName,
  problem,
  setProblem,
  onCreate,
  trigger,
}: {
  open: boolean;
  setOpen: (v: boolean) => void;
  name: string;
  setName: (v: string) => void;
  problem: string;
  setProblem: (v: string) => void;
  onCreate: () => void;
  trigger: React.ReactNode;
}) {
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display">Start a new OA analysis</DialogTitle>
          <DialogDescription>
            Name the project and capture the initial problem statement. You can refine every input
            inside the workspace.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="proj-name">Project name</Label>
            <Input
              id="proj-name"
              placeholder="e.g. Hypersonic Intercept Trade Study"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="proj-problem">Problem statement</Label>
            <Textarea
              id="proj-problem"
              rows={5}
              placeholder="What problem is this analysis addressing?"
              value={problem}
              onChange={(e) => setProblem(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={onCreate}>Create Analysis</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
