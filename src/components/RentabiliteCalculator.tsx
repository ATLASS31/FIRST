"use client";

import { useMemo, useState } from "react";
import GlassPanel from "./GlassPanel";
import PremiumSlider from "./PremiumSlider";
import AnimatedNumber from "./AnimatedNumber";
import TiltCard from "./TiltCard";

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

function PillGroup<T extends string>({
  options,
  value,
  onChange,
}: {
  options: readonly { id: T; label: string }[];
  value: T;
  onChange: (id: T) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => (
        <button
          key={opt.id}
          type="button"
          onClick={() => onChange(opt.id)}
          className={`rounded-full border px-4 py-1.5 text-sm transition-colors duration-300 ${
            value === opt.id
              ? "border-laiton bg-laiton text-encre"
              : "border-brume/20 text-brume/75 hover:border-brume/45"
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

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
      <TiltCard strength={1.5} className="mx-auto max-w-4xl">
        <GlassPanel tone="graphite" sheen className="px-8 py-16 sm:px-14">
          <p className="eyebrow text-xs text-laiton/80">
            Votre projet, rentabilisé
          </p>
          <h2 className="mt-4 max-w-lg text-3xl font-semibold text-brume sm:text-4xl">
            Combien votre maison peut-elle vous rapporter ?
          </h2>

          <div className="mt-14 grid gap-10 sm:grid-cols-2">
            <div>
              <div className="flex items-baseline justify-between">
                <span className="eyebrow text-[10px] text-brume/55">
                  Surface du module
                </span>
                <AnimatedNumber
                  value={`${surface} m²`}
                  className="text-sm font-semibold text-laiton"
                />
              </div>
              <div className="mt-4">
                <PremiumSlider
                  min={20}
                  max={100}
                  step={5}
                  value={surface}
                  onChange={setSurface}
                />
              </div>
            </div>

            <div>
              <span className="eyebrow text-[10px] text-brume/55">
                Région
              </span>
              <div className="mt-4">
                <PillGroup
                  options={REGIONS}
                  value={regionId}
                  onChange={setRegionId}
                />
              </div>
            </div>

            <div className="sm:col-span-2">
              <span className="eyebrow text-[10px] text-brume/55">
                Type de location
              </span>
              <div className="mt-4">
                <PillGroup options={TYPES} value={typeId} onChange={setTypeId} />
              </div>
            </div>
          </div>

          <div className="mt-14 grid gap-8 border-t border-brume/10 pt-10 sm:grid-cols-3">
            <div>
              <AnimatedNumber
                value={formatEuro(monthly)}
                className="text-2xl font-semibold text-brume sm:text-3xl"
              />
              <p className="eyebrow mt-2 text-[10px] text-brume/55">
                Revenu mensuel estimé
              </p>
            </div>
            <div>
              <AnimatedNumber
                value={formatEuro(annual)}
                className="text-2xl font-semibold text-brume sm:text-3xl"
              />
              <p className="eyebrow mt-2 text-[10px] text-brume/55">
                Revenu annuel (70% d&apos;occupation)
              </p>
            </div>
            <div>
              <AnimatedNumber
                value={`${amortissement.toFixed(1)} ans`}
                className="text-2xl font-semibold text-laiton sm:text-3xl"
              />
              <p className="eyebrow mt-2 text-[10px] text-brume/55">
                Amortissement estimé
              </p>
            </div>
          </div>

          <p className="mt-10 text-xs leading-relaxed text-brume/45">
            Sur la base de moyennes sectorielles. Bellora n&apos;est pas un
            cabinet de gestion patrimoniale ; ces chiffres sont indicatifs et
            varient selon l&apos;emplacement, les prestations et la gestion.
          </p>
        </GlassPanel>
      </TiltCard>
    </section>
  );
}
