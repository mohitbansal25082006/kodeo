import {
  Users2,
  Cloud,
  TerminalSquare,
  GitBranch,
  Box,
  Rocket,
} from "lucide-react";
import { Card } from "@/components/ui/card";

const FEATURES = [
  {
    icon: Users2,
    tag: "Collaboration",
    title: "Real-time collaboration",
    desc: "Pair, review, and ship from the same live canvas without context switching.",
  },
  {
    icon: Cloud,
    tag: "Infrastructure",
    title: "Cloud workspaces",
    desc: "Spin up a complete, isolated dev environment in seconds. No local setup.",
  },
  {
    icon: TerminalSquare,
    tag: "Development",
    title: "Integrated terminal",
    desc: "A full shell in your browser — run, debug, and script exactly like local.",
  },
  {
    icon: GitBranch,
    tag: "Version control",
    title: "Git integration",
    desc: "Clone, branch, commit, and push without leaving your workspace.",
  },
  {
    icon: Box,
    tag: "Isolation",
    title: "Isolated environments",
    desc: "Every workspace runs sandboxed, so nothing you run touches anything else.",
  },
  {
    icon: Rocket,
    tag: "Shipping",
    title: "Instant deployment",
    desc: "Move from branch to production without infrastructure slowing you down.",
  },
];

export function FeaturesSection() {
  return (
    <section id="workflow" className="relative py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-4 xs:px-5 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <div className="text-xs font-bold uppercase tracking-[0.15em] text-tertiary">
            Why KODEO
          </div>
          <h2 className="mt-3 text-3xl font-bold leading-tight tracking-tight text-primary sm:text-4xl">
            Built for the
            <br />
            <span className="text-accent">flow state.</span>
          </h2>
          <p className="mt-4 text-secondary">
            Every detail is designed to keep your attention on the work that
            matters — not the machinery behind it.
          </p>
        </div>

        <div className="mt-14 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f, i) => (
            <Card
              key={f.title}
              hover
              className="group animate-fade-up p-6 lg:p-7"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <div className="flex items-center justify-between">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-border bg-bg-elevated text-accent transition-colors group-hover:border-accent/30 group-hover:bg-accent-dim/50">
                  <f.icon className="h-5 w-5" />
                </div>
                <span className="font-mono-tech text-[10px] text-tertiary">
                  0{i + 1}
                </span>
              </div>
              <div className="mt-5 text-[10px] font-bold uppercase tracking-wider text-accent">
                {f.tag}
              </div>
              <h3 className="mt-1.5 text-lg font-semibold text-primary">
                {f.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-secondary">
                {f.desc}
              </p>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}