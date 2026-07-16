"use client";

import { useMemo, useState } from "react";
import GlassPanel from "./GlassPanel";

const REGIONS = [
  { id: "cote", label: "Côte", mult: 1 },
  { id: "idf", label: "Île-de-France", mult: 0.95 },
  { id: "montagne", label: "Montagne", mult: 0.85 },
  { id: "campagne", label: "Campagne", mult: 0.6 },
] as const;

const TYPES = [
  { id: "airbnb", label: "Airbnb", mult: 1 },
  { id: "saisonnier", label: "Saisonnier", mult: 0.7 },
  { id: "annuel", label: "Annuel", mult: 0.4 },
] as const;

const BASE_RATE_PER_M2 = 71.67; // €/m²/mois, Côte + Airbnb
const OCCUPATION = 0.7;
const COUT_CONSTRUCTION_PAR_M2 = 1445; // € — estimation moyenne toutes gammes confondues

const formatEuro = (value: number) =>
  new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(value);

export default function RentabiliteCalculator() {
  const [surface, setSurface] = useState(60);
  const [regionId, setRegionId] =
    useState<(typeof REGIONS)[number]["id"]>("cote");
  const [typeId, setTypeId] = useState<(typeof TYPES)[number]["id"]>("airbnb");

  const { monthly, annual, amortissement } = useMemo(() => {
    const region = REGIONS.find((r) => r.id === regionId)!;
    const type = TYPES.find((t) => t.id === typeId)!;
    const rate = BASE_RATE_PER_M2 * region.mult * type.mult;
    const monthlyValue = rate * surface;
    const annualValue = monthlyValue * 12 * OCCUPATION;
    const houseCost = surface * COUT_CONSTRUCTION_PAR_M2;
    return {
      monthly: monthlyValue,
      annual: annualValue,
      amortissement: houseCost / annualValue,
    };
  }, [surface, regionId, typeId]);

  return (
    <section className="px-6 py-28">
      <GlassPanel
        tone="dark"
        sheen
        className="mx-auto max-w-4xl px-8 py-16 sm:px-14"
      >
        <p className="eyebrow text-xs text-brume/70">Votre projet, rentabilisé</p>
        <h2 className="mt-4 max-w-lg text-3xl font-semibold text-brume sm:text-4xl">
          Combien votre maison peut-elle vous rapporter ?
        </h2>

        <div className="mt-12 grid gap-8 sm:grid-cols-2">
          <label className="block">
            <span className="eyebrow text-[10px] text-brume/60">
              Surface du module — {surface} m²
            </span>
            <input
              type="range"
              min={20}
              max={100}
              step={5}
              value={surface}
              onChange={(e) => setSurface(Number(e.target.value))}
              className="mt-3 w-full accent-laiton"
            />
          </label>

          <label className="block">
            <span className="eyebrow text-[10px] text-brume/60">Région</span>
            <select
              value={regionId}
              onChange={(e) =>
                setRegionId(e.target.value as typeof regionId)
              }
              className="mt-3 w-full rounded-lg border border-brume/20 bg-transparent px-3 py-2 text-sm text-brume [&>option]:text-encre"
            >
              {REGIONS.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.label}
                </option>
              ))}
            </select>
          </label>

          <label className="block sm:col-span-2">
            <span className="eyebrow text-[10px] text-brume/60">
              Type de location
            </span>
            <div className="mt-3 flex flex-wrap gap-2">
              {TYPES.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTypeId(t.id)}
                  className={`rounded-full border px-4 py-1.5 text-sm transition-colors ${
                    typeId === t.id
                      ? "border-laiton bg-laiton text-encre"
                      : "border-brume/25 text-brume/80 hover:border-brume/50"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </label>
        </div>

        <div className="mt-14 grid gap-8 border-t border-brume/15 pt-10 sm:grid-cols-3">
          <div>
            <p className="text-2xl font-semibold text-brume sm:text-3xl">
              {formatEuro(monthly)}
            </p>
            <p className="eyebrow mt-2 text-[10px] text-brume/60">
              Revenu mensuel estimé
            </p>
          </div>
          <div>
            <p className="text-2xl font-semibold text-brume sm:text-3xl">
              {formatEuro(annual)}
            </p>
            <p className="eyebrow mt-2 text-[10px] text-brume/60">
              Revenu annuel (70% d&apos;occupation)
            </p>
          </div>
          <div>
            <p className="text-2xl font-semibold text-laiton sm:text-3xl">
              {amortissement.toFixed(1)} ans
            </p>
            <p className="eyebrow mt-2 text-[10px] text-brume/60">
              Amortissement estimé
            </p>
          </div>
        </div>

        <p className="mt-10 text-xs leading-relaxed text-brume/50">
          Sur la base de moyennes sectorielles. Bellora n&apos;est pas un
          cabinet de gestion patrimoniale ; ces chiffres sont indicatifs et
          varient selon l&apos;emplacement, les prestations et la gestion.
        </p>
      </GlassPanel>
    </section>
  );
}
