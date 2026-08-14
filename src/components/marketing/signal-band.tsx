const STATS = [
  { value: "01", unit: "seconds", desc: "To a ready environment" },
  { value: "∞", unit: "possibilities", desc: "In one connected workspace" },
  { value: "24/7", unit: "availability", desc: "For your best ideas" },
];

export function SignalBand() {
  return (
    <section className="relative bg-accent py-12 text-[#08090a] xs:py-14 lg:py-16">
      <div className="mx-auto max-w-7xl px-4 xs:px-5 lg:px-8">
        <div className="grid grid-cols-1 gap-8 xs:gap-10 lg:grid-cols-[1fr_auto] lg:items-center lg:gap-16">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#08090a]/60">
              The KODEO signal
            </div>
            <h2 className="mt-2 text-2xl font-bold leading-tight tracking-tight xs:text-3xl sm:text-4xl">
              Less setup.
              <br />
              <span className="opacity-60">More momentum.</span>
            </h2>
          </div>

          <div className="grid grid-cols-2 gap-6 xs:gap-8 sm:grid-cols-3 lg:gap-14">
            {STATS.map((s) => (
              <div key={s.unit} className="min-w-0">
                <div className="font-mono-tech text-3xl font-bold leading-none xs:text-4xl">
                  {s.value}
                </div>
                <div className="mt-2 text-[10px] font-bold uppercase tracking-wider text-[#08090a]/60">
                  {s.unit}
                </div>
                <div className="mt-1 text-xs font-medium text-[#08090a]/75">
                  {s.desc}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}