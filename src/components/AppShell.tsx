import { Link } from "@tanstack/react-router";
import { Radar } from "lucide-react";
import type { ReactNode } from "react";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <Link to="/" className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/15 ring-1 ring-primary/30">
              <Radar className="h-4 w-4 text-primary" />
            </div>
            <div className="leading-tight">
              <div className="text-stencil text-[11px] text-primary">LM&nbsp;·&nbsp;MFC&nbsp;OA</div>
              <div className="font-display text-base font-semibold">Operations Analysis Assistant</div>
            </div>
          </Link>
          <nav className="hidden items-center gap-6 text-sm text-muted-foreground md:flex">
            <Link to="/" className="hover:text-foreground transition-colors">Projects</Link>
            <a href="#process" className="hover:text-foreground transition-colors">8-Step Process</a>
            <a href="#guided" className="hover:text-foreground transition-colors">Guided Mode</a>
          </nav>
          <div className="flex items-center gap-2">
            <span className="hidden rounded-full border border-border bg-surface px-3 py-1 text-xs text-muted-foreground md:inline">
              <span className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full bg-success" />
              SECURE WORKSPACE · UNCLASSIFIED
            </span>
          </div>
        </div>
      </header>
      {children}
      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-6 text-xs text-muted-foreground">
          <div>© Lockheed Martin — Operations Analysis Assistant</div>
          <div className="font-mono">v0.1 · OA-8 protocol</div>
        </div>
      </footer>
    </div>
  );
}
