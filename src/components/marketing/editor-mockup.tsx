"use client";

import * as React from "react";
import {
  FileCode2,
  Folder,
  ChevronRight,
  Circle,
  CheckCircle2,
  Play,
  Rocket,
} from "lucide-react";
import { LogoMark } from "@/components/brand/logo";
import { cn } from "@/lib/utils";

const FILES = [
  { name: "KODEO-APP", type: "folder", depth: 0, open: true },
  { name: "src", type: "folder", depth: 1, open: true },
  { name: "app.tsx", type: "file", depth: 2, active: true },
  { name: "styles.css", type: "file", depth: 2 },
  { name: "components", type: "folder", depth: 2 },
  { name: "public", type: "folder", depth: 1 },
  { name: "package.json", type: "file", depth: 1 },
  { name: "README.md", type: "file", depth: 1 },
];

const CODE_LINES = [
  { n: 1, content: [{ t: "keyword", v: "import" }, { t: "text", v: " { useState } " }, { t: "keyword", v: "from" }, { t: "string", v: " 'react'" }] },
  { n: 2, content: [] },
  { n: 3, content: [{ t: "keyword", v: "export default function" }, { t: "fn", v: " App" }, { t: "text", v: "() {" }] },
  { n: 4, content: [{ t: "text", v: "  const [status, setStatus] = " }, { t: "fn", v: "useState" }, { t: "text", v: "(" }, { t: "string", v: "'ready'" }, { t: "text", v: ")" }] },
  { n: 5, content: [] },
  { n: 6, content: [{ t: "keyword", v: "  return" }, { t: "text", v: " (" }] },
  { n: 7, content: [{ t: "tag", v: "    <main " }, { t: "attr", v: "className" }, { t: "text", v: "=" }, { t: "string", v: '"app"' }, { t: "tag", v: ">" }] },
  { n: 8, content: [{ t: "tag", v: "      <h1>" }, { t: "text", v: "Build without limits." }, { t: "tag", v: "</h1>" }] },
  { n: 9, content: [{ t: "tag", v: "      <Button " }, { t: "attr", v: "onClick" }, { t: "text", v: "={() => " }, { t: "fn", v: "setStatus" }, { t: "text", v: "(" }, { t: "string", v: "'shipped'" }, { t: "text", v: ")}>" }] },
  { n: 10, content: [{ t: "text", v: "        Ship it " }, { t: "keyword", v: "→" }] },
  { n: 11, content: [{ t: "tag", v: "      </Button>" }] },
  { n: 12, content: [{ t: "tag", v: "    </main>" }] },
  { n: 13, content: [{ t: "text", v: "  );" }] },
  { n: 14, content: [{ t: "text", v: "}" }] },
];

const TOKEN_COLOR: Record<string, string> = {
  keyword: "text-[#C792EA]",
  fn: "text-[#82AAFF]",
  string: "text-accent",
  attr: "text-[#F78C6C]",
  tag: "text-[#89DDFF]",
  text: "text-[#D4D4D8]",
};

export function EditorMockup() {
  // Start fully revealed by default (used for the very first server-
  // rendered paint, for prefers-reduced-motion, and as the permanent
  // state on mobile). Only opts INTO the sequential typewriter effect
  // once we've confirmed, client-side, that we're on a wide-enough
  // screen where it doesn't cost anything perceptible.
  const [visibleLines, setVisibleLines] = React.useState(CODE_LINES.length);
  const containerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    // Below this width the code panel is the ONLY visible column (the
    // file explorer and preview panel are hidden — see the lg:grid-cols
    // layout below), so a slow line-by-line typewriter effect there
    // was the most visible source of "the mockup takes too long" and
    // directly contradicts writing everything in parallel on mobile.
    // On these screens, skip straight to the fully-typed state.
    const isNarrowViewport = window.matchMedia("(max-width: 1023px)").matches;

    if (prefersReducedMotion || isNarrowViewport) {
      setVisibleLines(CODE_LINES.length);
      return;
    }

    // Desktop only, and only once actually scrolled into view — no
    // point spending render cycles animating something off-screen
    // above the fold on a tall monitor, or before the hero has even
    // finished its own entrance animation.
    let intervalId: ReturnType<typeof setInterval> | null = null;

    const runTypewriter = () => {
      setVisibleLines(0);
      const BATCH_SIZE = 3;
      const BATCH_INTERVAL_MS = 55;
      let current = 0;
      intervalId = setInterval(() => {
        current = Math.min(current + BATCH_SIZE, CODE_LINES.length);
        setVisibleLines(current);
        if (current >= CODE_LINES.length && intervalId) {
          clearInterval(intervalId);
        }
      }, BATCH_INTERVAL_MS);
    };

    const node = containerRef.current;
    if (!node || typeof IntersectionObserver === "undefined") {
      runTypewriter();
      return () => {
        if (intervalId) clearInterval(intervalId);
      };
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          runTypewriter();
          observer.disconnect();
        }
      },
      { threshold: 0.2 }
    );
    observer.observe(node);

    return () => {
      observer.disconnect();
      if (intervalId) clearInterval(intervalId);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="overflow-hidden rounded-2xl border border-border bg-bg-elevated shadow-elevated"
    >
      {/* Browser chrome bar */}
      <div className="flex items-center gap-3 border-b border-border bg-surface px-4 py-3">
        <div className="flex gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-[#3a3a3a]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#3a3a3a]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#3a3a3a]" />
        </div>
        <div className="ml-2 hidden flex-1 items-center justify-center sm:flex">
          <div className="flex items-center gap-2 rounded-md bg-bg px-3 py-1 text-xs text-tertiary">
            <Circle className="h-2 w-2 fill-accent text-accent" />
            kodeo.dev/workspace
          </div>
        </div>
        <div className="ml-auto flex items-center gap-1.5 rounded-md bg-accent px-2.5 py-1 text-[11px] font-semibold text-[#08090a]">
          <Rocket className="h-3 w-3" />
          Publish
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[180px_1fr_220px]">
        {/* File explorer - hidden on small mobile, shown from sm up */}
        <div className="hidden border-b border-border bg-bg-elevated p-3 sm:block lg:border-b-0 lg:border-r">
          <div className="mb-2 px-1 text-[10px] font-semibold uppercase tracking-wider text-tertiary">
            Explorer
          </div>
          <div className="space-y-0.5">
            {FILES.map((f, i) => (
              <div
                key={i}
                style={{ paddingLeft: `${f.depth * 12}px` }}
                className={cn(
                  "flex items-center gap-1.5 rounded-md px-1.5 py-1 text-xs",
                  f.active
                    ? "bg-accent-dim text-accent"
                    : "text-secondary hover:text-primary"
                )}
              >
                {f.type === "folder" ? (
                  <>
                    <ChevronRight
                      className={cn(
                        "h-3 w-3 shrink-0 transition-transform",
                        f.open && "rotate-90"
                      )}
                    />
                    <Folder className="h-3 w-3 shrink-0" />
                  </>
                ) : (
                  <FileCode2 className="ml-[14px] h-3 w-3 shrink-0" />
                )}
                <span className="truncate">{f.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Code editor */}
        <div className="flex flex-col border-b border-border bg-bg lg:border-b-0 lg:border-r">
          <div className="flex items-center justify-between border-b border-border px-4 py-2">
            <div className="flex items-center gap-2 text-xs text-secondary">
              <FileCode2 className="h-3.5 w-3.5 text-accent" />
              app.tsx
            </div>
            <div className="flex items-center gap-1 text-[10px] text-tertiary">
              <CheckCircle2 className="h-3 w-3 text-success" />
              saved
            </div>
          </div>
          <div className="flex-1 overflow-x-auto overflow-y-hidden p-3 font-mono-tech text-[11px] leading-[1.6] xs:p-4 xs:text-[12.5px] xs:leading-[1.65]">
            {CODE_LINES.slice(0, visibleLines).map((line) => (
              <div key={line.n} className="flex w-max min-w-full">
                <span className="w-6 shrink-0 select-none text-right pr-3 text-tertiary/60">
                  {line.n}
                </span>
                <span className="whitespace-pre">
                  {line.content.map((tok, ti) => (
                    <span key={ti} className={TOKEN_COLOR[tok.t]}>
                      {tok.v}
                    </span>
                  ))}
                  {line.n === CODE_LINES[visibleLines - 1]?.n && (
                    <span className="ml-0.5 inline-block h-[14px] w-[7px] translate-y-[2px] animate-blink-caret bg-accent align-middle" />
                  )}
                </span>
              </div>
            ))}
          </div>
          <div className="overflow-x-auto border-t border-border bg-bg-elevated px-4 py-2.5 font-mono-tech text-[11px] text-secondary">
            <div className="flex items-center gap-1.5 whitespace-nowrap text-tertiary">
              <span className="text-accent">❯</span> kodeo ~/kodeo-app{" "}
              <span className="text-primary">$ pnpm dev</span>
            </div>
            <div className="mt-1 flex items-center gap-1.5 whitespace-nowrap text-success">
              ✓ Ready in 412ms
            </div>
            <div className="whitespace-nowrap text-tertiary">○ Local: http://localhost:3000</div>
          </div>
        </div>

        {/* Preview panel */}
        <div className="bg-bg-elevated p-3">
          <div className="mb-2 flex items-center justify-between px-1">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-tertiary">
              Preview
            </span>
            <Play className="h-3 w-3 text-tertiary" />
          </div>
          <div className="overflow-hidden rounded-lg border border-border bg-bg">
            <div className="bg-grid relative flex flex-col gap-3 p-4">
              <div className="flex items-center gap-1.5">
                <LogoMark size={14} />
                <span className="text-[10px] font-bold tracking-wide text-primary">
                  KODEO
                </span>
              </div>
              <div className="text-[9px] font-medium uppercase tracking-wider text-accent">
                Your next idea
              </div>
              <div className="text-sm font-bold leading-tight text-primary">
                Build without
                <br />
                limits.
              </div>
              <p className="text-[10px] leading-snug text-secondary">
                From thought to shipped. In one focused workspace.
              </p>
              <div className="inline-flex w-fit items-center gap-1 rounded-md bg-accent px-2.5 py-1.5 text-[10px] font-semibold text-[#08090a]">
                <Play className="h-2.5 w-2.5 fill-current" />
                Preview live
              </div>
            </div>
          </div>
          <div className="mt-3 flex items-center gap-1.5 px-1 text-[10px] text-tertiary">
            <span className="flex h-4 w-4 items-center justify-center rounded-full bg-[#7C6CF5] text-[7px] font-bold text-white">
              A
            </span>
            <span className="flex h-4 w-4 items-center justify-center rounded-full bg-[#4ADE80] text-[7px] font-bold text-white">
              N
            </span>
            2 collaborators online
          </div>
        </div>
      </div>

      {/* Status bar */}
      <div className="flex items-center justify-between border-t border-border bg-surface px-4 py-2 text-[10px] text-tertiary">
        <div className="flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-success" />
          All systems operational
        </div>
        <div className="hidden items-center gap-4 sm:flex">
          <span>main · 4 files changed</span>
          <span className="flex items-center gap-1 text-accent">
            <Rocket className="h-3 w-3" /> Deploy
          </span>
        </div>
      </div>
    </div>
  );
}