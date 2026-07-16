import Link from "next/link";
import Image from "next/image";
import GlassPanel from "./GlassPanel";
import { getGamme, type GammeSlug } from "@/lib/gammes";

export default function GammeDetail({ slug }: { slug: GammeSlug }) {
  const gamme = getGamme(slug);

  return (
    <>
      <section className="px-6 pb-20 pt-40 text-center">
        <p className="eyebrow text-xs text-encre-douce">Gamme {gamme.name}</p>
        <h1 className="mx-auto mt-4 max-w-3xl text-4xl font-semibold text-encre sm:text-5xl">
          {gamme.heroTagline}
        </h1>
        <p className="mx-auto mt-6 max-w-xl text-base text-encre-doux">
          {gamme.heroBody}
        </p>
        <p className="mt-6 text-lg font-semibold text-foret">
          {gamme.fromPrice}
        </p>
      </section>

      <section className="px-6">
        <div className="relative mx-auto h-[50vh] max-w-6xl overflow-hidden rounded-3xl">
          <Image
            src={gamme.imageUrl}
            alt={`Maison Bellora, gamme ${gamme.name}`}
            fill
            priority
            sizes="(min-width: 1280px) 1152px, 100vw"
            className="object-cover"
          />
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-6 py-16">
        <p className="text-lg font-semibold text-encre">
          {gamme.pourquoi.lead}
        </p>
        <div className="mt-6 space-y-6">
          {gamme.pourquoi.paragraphs.map((p, i) => (
            <p key={i} className="text-sm leading-relaxed text-encre-doux">
              {p}
            </p>
          ))}
        </div>
      </section>

      <section className="bg-ciel px-6 py-20">
        <div className="mx-auto max-w-6xl">
          <p className="eyebrow text-xs text-encre-douce">
            Inclus dans la gamme
          </p>
          <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {gamme.inclus.map((item) => (
              <li
                key={item}
                className="border-t border-encre/10 pt-4 text-sm text-encre-doux"
              >
                {item}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-20">
        <p className="eyebrow text-xs text-encre-douce">Configurations</p>
        <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {gamme.configurations.map((config) => (
            <GlassPanel
              key={config.surface}
              className="flex flex-col gap-3 p-6"
            >
              <p className="text-2xl font-semibold text-encre">
                {config.surface} m²
              </p>
              <h3 className="text-sm font-semibold text-encre">
                {config.title}
              </h3>
              <p className="flex-1 text-sm text-encre-doux">{config.body}</p>
              <p className="eyebrow text-[10px] text-foret">
                {config.price ?? "Sur devis"}
              </p>
            </GlassPanel>
          ))}
        </div>
      </section>

      <section className="px-6 py-20">
        <GlassPanel className="mx-auto max-w-2xl px-8 py-12 text-center">
          <p className="text-lg italic text-encre">
            « {gamme.temoignage.quote} »
          </p>
          <p className="eyebrow mt-4 text-xs text-encre-douce">
            {gamme.temoignage.author}
          </p>
        </GlassPanel>
      </section>

      <section className="px-6 pb-28 text-center">
        <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Link
            href="/contact"
            className="rounded-full bg-foret px-8 py-3 text-sm font-medium text-brume transition-opacity hover:opacity-90"
          >
            Demander un devis {gamme.name}
          </Link>
          <Link
            href="/modeles"
            className="rounded-full border border-encre/20 px-8 py-3 text-sm font-medium text-encre transition-colors hover:border-foret hover:text-foret"
          >
            Voir tous les modèles
          </Link>
        </div>
      </section>
    </>
  );
}
