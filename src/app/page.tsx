import Hero from "@/components/Hero";
import ThreePiliers from "@/components/ThreePiliers";
import NotreHistoire from "@/components/NotreHistoire";
import GammesPreview from "@/components/GammesPreview";
import Procede from "@/components/Procede";
import RentabiliteCalculator from "@/components/RentabiliteCalculator";
import CtaSection from "@/components/CtaSection";

export default function Home() {
  return (
    <>
      <Hero />
      <ThreePiliers />
      <NotreHistoire />
      <GammesPreview />
      <Procede />
      <RentabiliteCalculator />
      <CtaSection />
    </>
  );
}
