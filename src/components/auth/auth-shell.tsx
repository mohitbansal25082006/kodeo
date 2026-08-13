// src/components/auth/auth-shell.tsx
import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { Sparkles } from "lucide-react";

interface AuthShellProps {
  children: React.ReactNode;
  eyebrow?: string;
  title: string;
  subtitle?: string;
}

const BRAND_POINTS = [
  "One workspace for your whole team",
  "Cloud environments ready in seconds",
  "Real-time collaboration, built in",
];

export function AuthShell({ children, eyebrow, title, subtitle }: AuthShellProps) {
  return (
    <div className="relative flex min-h-screen bg-bg">
      {/* Left branding panel — hidden on mobile */}
      <div className="relative hidden w-[42%] flex-col justify-between overflow-hidden border-r border-border bg-bg-elevated p-10 lg:flex xl:w-[38%] xl:p-14">
        <div className="pointer-events-none absolute inset-0 bg-grid opacity-40 [mask-image:radial-gradient(ellipse_70%_60%_at_30%_20%,black_10%,transparent_75%)]" />
        <div className="pointer-events-none absolute -left-24 top-1/3 h-72 w-72 rounded-full bg-accent/[0.08] blur-[100px]" />

        <Link href="/" className="relative z-10">
          <Logo markSize={30} />
        </Link>

        <div className="relative z-10">
          <div className="animate-fade-up inline-flex items-center gap-2 rounded-full border border-border bg-surface/80 px-3.5 py-1.5 text-xs font-medium text-secondary backdrop-blur-sm">
            <Sparkles className="h-3.5 w-3.5 text-accent" />
            The cloud IDE for what&apos;s next
          </div>
          <h2 className="animate-fade-up animate-delay-1 mt-6 text-3xl font-bold leading-tight tracking-tight text-primary xl:text-4xl">
            Build together.
            <br />
            <span className="text-accent">Code anywhere.</span>
          </h2>
          <ul className="animate-fade-up animate-delay-2 mt-8 space-y-3">
            {BRAND_POINTS.map((point) => (
              <li key={point} className="flex items-center gap-3 text-sm text-secondary">
                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                {point}
              </li>
            ))}
          </ul>
        </div>

        <p className="relative z-10 text-xs text-tertiary">
          © 2026 KODEO Systems
        </p>
      </div>

      {/* Right form panel */}
      <div className="flex flex-1 flex-col">
        {/* Mobile header */}
        <div className="flex items-center justify-between border-b border-border px-5 py-4 lg:hidden">
          <Link href="/">
            <Logo markSize={24} />
          </Link>
        </div>

        <div className="flex flex-1 items-center justify-center px-5 py-10 sm:px-8 lg:px-12">
          <div className="w-full max-w-[400px]">
            <div className="animate-fade-up mb-8">
              {eyebrow && (
                <div className="mb-2 text-xs font-bold uppercase tracking-wider text-accent">
                  {eyebrow}
                </div>
              )}
              <h1 className="text-2xl font-bold tracking-tight text-primary sm:text-[1.75rem]">
                {title}
              </h1>
              {subtitle && (
                <p className="mt-2 text-sm text-secondary">{subtitle}</p>
              )}
            </div>
            <div className="animate-fade-up animate-delay-1">{children}</div>
          </div>
        </div>
      </div>
    </div>
  );
}