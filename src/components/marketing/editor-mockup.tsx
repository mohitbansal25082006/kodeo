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
  const [visibleLines, setVisibleLines] = React.useState(0);

  React.useEffect(() => {
    if (visibleLines >= CODE_LINES.length) return;
    const t = setTimeout(() => setVisibleLines((v) => v + 1), 90);
    return () => clearTimeout(t);
  }, [visibleLines]);

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-bg-elevated shadow-elevated">
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
          <div className="flex-1 overflow-hidden p-4 font-mono-tech text-[12.5px] leading-[1.65]">
            {CODE_LINES.slice(0, visibleLines).map((line) => (
              <div key={line.n} className="flex">
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
          <div className="border-t border-border bg-bg-elevated px-4 py-2.5 font-mono-tech text-[11px] text-secondary">
            <div className="flex items-center gap-1.5 text-tertiary">
              <span className="text-accent">❯</span> kodeo ~/kodeo-app{" "}
              <span className="text-primary">$ pnpm dev</span>
            </div>
            <div className="mt-1 flex items-center gap-1.5 text-success">
              ✓ Ready in 412ms
            </div>
            <div className="text-tertiary">○ Local: http://localhost:3000</div>
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