import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import usnaLogo from "@/assets/usna-logo.png.asset.json";
import oaLogo from "@/assets/oa-logo.png.asset.json";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b border-primary/30 bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/65">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between gap-4 px-6">
          <Link to="/" className="flex items-center gap-4">
            <img
              src={usnaLogo.url}
              alt="U.S. Naval Academy"
              width={48}
              height={48}
              className="h-12 w-auto shrink-0 object-contain"
              style={{ aspectRatio: "auto" }}
            />
            <div className="hidden h-10 w-px bg-primary/40 sm:block" />
            <img
              src={oaLogo.url}
              alt="Operations Analysis"
              width={48}
              height={48}
              className="hidden h-9 w-auto shrink-0 object-contain sm:block"
              style={{ aspectRatio: "auto" }}
            />
            <div className="leading-tight">
              <div className="text-stencil text-[11px] text-primary">USNA&nbsp;·&nbsp;OA</div>
              <div className="font-display text-base font-semibold">Operations Analysis Assistant</div>
            </div>
          </Link>
          <nav className="hidden items-center gap-6 text-sm text-muted-foreground md:flex">
            <Link to="/" className="hover:text-foreground transition-colors">Projects</Link>
            <a href="#process" className="hover:text-foreground transition-colors">8-Step Process</a>
            <a href="#guided" className="hover:text-foreground transition-colors">Guided Mode</a>
          </nav>
          <div className="flex items-center gap-2">
            <span className="hidden rounded-full border border-primary/40 bg-surface px-3 py-1 text-xs text-muted-foreground md:inline">
              <span className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full bg-success" />
              SECURE WORKSPACE · UNCLASSIFIED
            </span>
          </div>
        </div>
      </header>
      {children}
      <footer className="border-t border-primary/30">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-6 text-xs text-muted-foreground">
          <div>© U.S. Naval Academy — Operations Analysis Assistant</div>
          <div className="font-mono">v0.1 · OA-8 protocol</div>
        </div>
      </footer>
    </div>
  );
}

