import Link from "next/link";
import { Command, ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export function CtaSection() {
  return (
    <section className="relative overflow-hidden py-24 lg:py-32">
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-[420px] w-[720px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent/[0.07] blur-[130px]" />
      <div className="pointer-events-none absolute inset-0 bg-grid [mask-image:radial-gradient(ellipse_55%_60%_at_50%_50%,black_10%,transparent_75%)]" />

      <div className="relative mx-auto flex max-w-2xl flex-col items-center px-5 text-center lg:px-8">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-border bg-surface animate-float-slow">
          <Command className="h-5 w-5 text-accent" />
        </div>

        <div className="mt-6 text-xs font-bold uppercase tracking-[0.15em] text-tertiary">
          Your next line starts here
        </div>

        <h2 className="mt-4 text-4xl font-bold leading-[1.1] tracking-tight text-primary sm:text-5xl">
          Ready when
          <br />
          <span className="text-accent">you are.</span>
        </h2>

        <Link href="/register" className="mt-9">
          <Button
            variant="primary"
            size="lg"
            icon={<ArrowUpRight className="h-4 w-4" />}
          >
            Open your workspace
          </Button>
        </Link>
      </div>
    </section>
  );
}