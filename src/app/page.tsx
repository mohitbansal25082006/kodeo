import { Navbar } from "@/components/marketing/navbar";
import { Hero } from "@/components/marketing/hero";
import { SignalBand } from "@/components/marketing/signal-band";
import { ProblemSection } from "@/components/marketing/problem-section";
import { FeaturesSection } from "@/components/marketing/features-section";
import { CtaSection } from "@/components/marketing/cta-section";
import { Footer } from "@/components/marketing/footer";

export default function HomePage() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <SignalBand />
        <ProblemSection />
        <FeaturesSection />
        <CtaSection />
      </main>
      <Footer />
    </>
  );
}