import Link from "next/link";
import GlassPanel from "./GlassPanel";

const GAMMES = [
  {
    href: "/gamme-primaire",
    name: "Primaire",
    tagline: "L'essentiel, à la main.",
    from: "à partir de 38 900 €",
  },
  {
    href: "/gamme-premium",
    name: "Premium",
    tagline: "Le confort, sans concession.",
    from: "à partir de 62 400 €",
  },
  {
    href: "/gamme-prestige",
    name: "Prestige",
    tagline: "L'art de la maison.",
    from: "à partir de 88 763 €",
  },
];

export default function GammesPreview() {
  return (
    <section className="bg-ciel px-6 py-28">
      <div className="mx-auto max-w-6xl">
        <p className="eyebrow text-xs text-encre-douce">Nos gammes</p>
        <h2 className="mt-4 max-w-2xl text-4xl font-semibold text-encre sm:text-5xl">
          Trois univers, une même exigence.
        </h2>

        <div className="mt-16 grid gap-6 md:grid-cols-3">
          {GAMMES.map((gamme) => (
            <Link key={gamme.href} href={gamme.href} className="group block">
              <GlassPanel
                sheen
                className="flex h-72 flex-col justify-between p-8 transition-transform group-hover:-translate-y-1"
              >
                <div>
                  <h3 className="text-2xl font-semibold text-encre">
                    {gamme.name}
                  </h3>
                  <p className="mt-2 text-sm text-encre-doux">
                    {gamme.tagline}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-encre-douce">{gamme.from}</p>
                  <p className="eyebrow mt-3 text-xs text-foret">
                    Découvrir →
                  </p>
                </div>
              </GlassPanel>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
