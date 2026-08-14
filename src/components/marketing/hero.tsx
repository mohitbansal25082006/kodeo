"use client";

import * as React from "react";
import Link from "next/link";
import { Sparkles, ArrowUpRight, Play, LayoutGrid } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EditorMockup } from "@/components/marketing/editor-mockup";
import { useSession } from "@/lib/auth-client";
import { cn } from "@/lib/utils";

const AVATARS = [
  { initials: "AL", color: "bg-[#7C6CF5]" },
  { initials: "NT", color: "bg-[#4ADE80]" },
  { initials: "SV", color: "bg-[#F87171]" },
];

export function Hero() {
  const { data: session, isPending } = useSession();
  const isLoggedIn = !isPending && !!session?.user;

  return (
    <section className="relative overflow-hidden pt-24 pb-12 xs:pt-28 sm:pb-16 lg:pt-40 lg:pb-24">
      {/* Background layers */}
      <div className="pointer-events-none absolute inset-0 bg-grid [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,black_20%,transparent_80%)]" />
      <div className="pointer-events-none absolute left-1/2 top-[-10%] h-[500px] w-[900px] -translate-x-1/2 rounded-full bg-accent/[0.08] blur-[120px]" />
      <div className="pointer-events-none absolute inset-0 bg-noise" />

      <div className="relative mx-auto max-w-7xl px-4 xs:px-5 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <div className="animate-fade-up flex justify-center">
            <Badge>
              <Sparkles className="h-3.5 w-3.5 text-accent" />
              The cloud IDE for what&apos;s next
            </Badge>
          </div>

          <h1 className="animate-fade-up animate-delay-1 mt-5 text-4xl font-bold leading-[1.08] tracking-tight text-primary xs:mt-6 xs:text-[2.75rem] xs:leading-[1.05] sm:text-6xl lg:text-[4.25rem]">
            Make the thing.
            <br />
            <span className="text-accent">Ship the idea.</span>
          </h1>

          <p className="animate-fade-up animate-delay-2 mx-auto mt-5 max-w-xl text-balance text-[15px] leading-relaxed text-secondary xs:mt-6 xs:text-base sm:text-lg">
            KODEO is the focused, collaborative workspace for developers who
            move from first line to final deploy without slowing down.
          </p>

          <div className="animate-fade-up animate-delay-3 mt-8 flex flex-col items-center justify-center gap-3 xs:mt-9 sm:flex-row">
            {isLoggedIn ? (
              <Link href="/dashboard" className="w-full sm:w-auto">
                <Button
                  variant="primary"
                  size="lg"
                  icon={<LayoutGrid className="h-4 w-4" />}
                  iconPosition="left"
                  className="w-full sm:w-auto"
                >
                  Go to dashboard
                </Button>
              </Link>
            ) : (
              <Link href="/register" className="w-full sm:w-auto">
                <Button
                  variant="primary"
                  size="lg"
                  icon={<ArrowUpRight className="h-4 w-4" />}
                  className="w-full group sm:w-auto"
                >
                  Start building free
                </Button>
              </Link>
            )}
            <a href="#workflow" className="w-full sm:w-auto">
              <Button
                variant="ghost"
                size="lg"
                icon={<Play className="h-3.5 w-3.5 fill-current" />}
                iconPosition="left"
                className="w-full sm:w-auto"
              >
                See how it works
              </Button>
            </a>
          </div>

          <div className="animate-fade-up animate-delay-4 mt-7 flex items-center justify-center gap-3 xs:mt-8">
            <div className="flex -space-x-2.5">
              {AVATARS.map((a, i) => (
                <div
                  key={i}
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-full border-2 border-bg text-[10px] font-bold text-white",
                    a.color
                  )}
                >
                  {a.initials}
                </div>
              ))}
            </div>
            <span className="text-[13px] text-secondary xs:text-sm">
              Join 12,000+ builders shipping faster
            </span>
          </div>
        </div>

        {/* Editor mockup */}
        <div className="animate-fade-up animate-delay-5 relative mx-auto mt-10 max-w-5xl xs:mt-14 lg:mt-20">
          <div className="pointer-events-none absolute -inset-x-10 -inset-y-10 bg-accent/[0.04] blur-[80px]" />
          <EditorMockup />
        </div>
      </div>
    </section>
  );
}