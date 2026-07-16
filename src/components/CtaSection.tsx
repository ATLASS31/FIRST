import Link from "next/link";
import GlassPanel from "@/components/GlassPanel";

export default function CtaSection() {
  return (
    <section className="px-6 py-28">
      <GlassPanel
        tone="dark"
        sheen
        className="mx-auto flex max-w-6xl flex-col items-center gap-8 px-8 py-20 text-center"
      >
        <p className="eyebrow text-xs text-brume/70">Simulateur de rentabilité</p>
        <h2 className="max-w-2xl text-3xl font-semibold text-brume sm:text-4xl">
          Estimez le potentiel de votre projet en quelques minutes.
        </h2>
        <p className="max-w-xl text-sm text-brume/80">
          Terrain, gamme, budget : notre simulateur vous donne une première
          estimation avant d&apos;échanger avec notre équipe.
        </p>
        <Link
          href="/contact"
          className="rounded-full bg-laiton px-8 py-3 text-sm font-medium text-encre transition-opacity hover:opacity-90"
        >
          Lancer le simulateur
        </Link>
      </GlassPanel>
    </section>
  );
}
