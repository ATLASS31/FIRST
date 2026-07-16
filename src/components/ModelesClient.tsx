"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import GlassPanel from "@/components/GlassPanel";
import TiltCard from "@/components/TiltCard";
import { GAMMES, type GammeSlug } from "@/lib/gammes";

const SURFACES = [40, 60, 80, 100] as const;

const ALL_CONFIGS = GAMMES.flatMap((gamme) =>
  gamme.configurations.map((config) => ({
    gammeSlug: gamme.slug,
    gammeName: gamme.name,
    gammeHref: gamme.href,
    ...config,
  }))
);

export default function ModelesClient() {
  const [gammeFilter, setGammeFilter] = useState<GammeSlug | "toutes">(
    "toutes"
  );
  const [surfaceFilter, setSurfaceFilter] = useState<
    (typeof SURFACES)[number] | "toutes"
  >("toutes");

  const configs = useMemo(
    () =>
      ALL_CONFIGS.filter(
        (c) =>
          (gammeFilter === "toutes" || c.gammeSlug === gammeFilter) &&
          (surfaceFilter === "toutes" || c.surface === surfaceFilter)
      ),
    [gammeFilter, surfaceFilter]
  );

  return (
    <>
      <section className="px-6 pb-16 pt-40 text-center">
        <p className="eyebrow text-xs text-encre-douce">Nos modèles</p>
        <h1 className="mx-auto mt-4 max-w-2xl text-4xl font-semibold text-encre sm:text-5xl">
          Dix maisons. La vôtre.
        </h1>
        <p className="mx-auto mt-4 max-w-md text-sm text-encre-doux">
          Trois gammes, dix configurations. Filtrez par gamme ou surface pour
          trouver votre maison.
        </p>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-28">
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => setGammeFilter("toutes")}
            className={`rounded-full border px-4 py-1.5 text-xs font-medium transition-colors ${
              gammeFilter === "toutes"
                ? "border-foret bg-foret text-brume"
                : "border-encre/20 text-encre-doux hover:border-foret"
            }`}
          >
            Toutes les gammes
          </button>
          {GAMMES.map((g) => (
            <button
              key={g.slug}
              type="button"
              onClick={() => setGammeFilter(g.slug)}
              className={`rounded-full border px-4 py-1.5 text-xs font-medium transition-colors ${
                gammeFilter === g.slug
                  ? "border-foret bg-foret text-brume"
                  : "border-encre/20 text-encre-doux hover:border-foret"
              }`}
            >
              {g.name}
            </button>
          ))}

          <span className="mx-2 hidden h-6 w-px bg-encre/10 sm:block" />

          <button
            type="button"
            onClick={() => setSurfaceFilter("toutes")}
            className={`rounded-full border px-4 py-1.5 text-xs font-medium transition-colors ${
              surfaceFilter === "toutes"
                ? "border-laiton bg-laiton text-encre"
                : "border-encre/20 text-encre-doux hover:border-laiton"
            }`}
          >
            Toutes surfaces
          </button>
          {SURFACES.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setSurfaceFilter(s)}
              className={`rounded-full border px-4 py-1.5 text-xs font-medium transition-colors ${
                surfaceFilter === s
                  ? "border-laiton bg-laiton text-encre"
                  : "border-encre/20 text-encre-doux hover:border-laiton"
              }`}
            >
              {s} m²
            </button>
          ))}
        </div>

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {configs.map((config) => (
            <TiltCard key={`${config.gammeSlug}-${config.surface}`} strength={2}>
              <Link href={config.gammeHref} className="group block">
                <GlassPanel
                  className="glass-sheen-hover flex h-56 flex-col justify-between p-6 transition-transform group-hover:-translate-y-1"
                >
                  <div>
                    <p className="eyebrow text-[10px] text-foret">
                      {config.gammeName} — {config.surface} m²
                    </p>
                    <h3 className="mt-2 text-base font-semibold text-encre">
                      {config.title}
                    </h3>
                    <p className="mt-2 text-sm text-encre-doux">
                      {config.body}
                    </p>
                  </div>
                  <p className="text-sm text-encre-douce">
                    {config.price ?? "Sur devis"}
                  </p>
                </GlassPanel>
              </Link>
            </TiltCard>
          ))}
        </div>

        {configs.length === 0 && (
          <p className="mt-16 text-center text-sm text-encre-douce">
            Aucune configuration ne correspond à ces filtres.
          </p>
        )}
      </section>

      <section className="px-6 pb-28 text-center">
        <h2 className="text-2xl font-semibold text-encre">
          Parlons de votre projet.
        </h2>
        <div className="mt-6 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Link
            href="/contact"
            className="rounded-full bg-foret px-8 py-3 text-sm font-medium text-brume transition-opacity hover:opacity-90"
          >
            Recevoir mon étude personnalisée
          </Link>
        </div>
      </section>
    </>
  );
}
