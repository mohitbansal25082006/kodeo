import { X, Check } from "lucide-react";

const PROBLEMS = [
  "Local setup",
  "Dependency conflicts",
  "Environment differences",
  "Sharing code",
  "Collaboration friction",
  "Deployment complexity",
];

export function ProblemSection() {
  return (
    <section id="product" className="relative py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-5 lg:px-8">
        <div className="grid grid-cols-1 gap-14 lg:grid-cols-2 lg:gap-20">
          {/* Problem list */}
          <div>
            <div className="text-xs font-bold uppercase tracking-[0.15em] text-tertiary">
              The old way
            </div>
            <h2 className="mt-3 text-3xl font-bold leading-tight tracking-tight text-primary sm:text-4xl">
              Development has too
              <br />
              much friction.
            </h2>
            <p className="mt-4 max-w-md text-secondary">
              Every new project starts with the same tax: installs, config
              drift, &quot;works on my machine,&quot; and a dozen tabs just to
              get one teammate unblocked.
            </p>

            <ul className="mt-8 space-y-3">
              {PROBLEMS.map((p) => (
                <li
                  key={p}
                  className="flex items-center gap-3 rounded-xl border border-border bg-surface/40 px-4 py-3 text-sm text-secondary"
                >
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-danger/10">
                    <X className="h-3 w-3 text-danger" />
                  </span>
                  {p}
                </li>
              ))}
            </ul>
          </div>

          {/* Solution */}
          <div className="relative flex flex-col justify-center rounded-2xl border border-accent/20 bg-gradient-to-br from-accent-dim/40 via-surface to-surface p-8 lg:p-10">
            <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-accent/10 blur-[80px]" />
            <div className="relative">
              <div className="text-xs font-bold uppercase tracking-[0.15em] text-accent">
                The KODEO way
              </div>
              <h3 className="mt-3 text-2xl font-bold leading-tight text-primary sm:text-[2rem]">
                One workspace.
                <br />
                One environment.
                <br />
                <span className="text-accent">One place to build.</span>
              </h3>
              <p className="mt-4 text-secondary">
                Everything your team needs lives in a single browser tab —
                already configured, already synced, already yours.
              </p>

              <ul className="mt-8 space-y-3">
                {[
                  "Zero local setup, ever",
                  "Consistent environments for every teammate",
                  "Share a link instead of a repo and a prayer",
                ].map((s) => (
                  <li
                    key={s}
                    className="flex items-center gap-3 text-sm text-primary"
                  >
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent/15">
                      <Check className="h-3 w-3 text-accent" />
                    </span>
                    {s}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}