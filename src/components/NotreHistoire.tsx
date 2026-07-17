"use client";

import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import GlassPanel from "./GlassPanel";

const AUTOPLAY_MS = 3000;

const FIGURES = [
  { value: "20 ans", label: "de garantie" },
  { value: "4–12 semaines", label: "de livraison" },
  { value: "100%", label: "fabriqué en France" },
];

export default function NotreHistoire() {
  const [active, setActive] = useState(0);
  const prefersReducedMotion = useReducedMotion();

  // La boucle repart de zéro à chaque changement d'actif — qu'il vienne de
  // l'autoplay ou d'un clic manuel — pour qu'un clic ne soit jamais suivi
  // d'un changement automatique presque immédiat.
  useEffect(() => {
    const id = setInterval(() => {
      setActive((i) => (i + 1) % FIGURES.length);
    }, AUTOPLAY_MS);
    return () => clearInterval(id);
  }, [active]);

  return (
    <section className="relative overflow-hidden bg-brume-2 px-6 py-28">
      <div className="relative mx-auto grid max-w-6xl gap-16 lg:grid-cols-[1fr_1.2fr] lg:items-center">
        <div className="min-w-0">
          <p className="eyebrow text-xs text-encre-douce">Notre histoire</p>
          <h2 className="mt-4 text-3xl font-semibold text-encre sm:text-4xl">
            Le modulaire bois, sans compromis.
          </h2>
          <p className="mt-6 text-base leading-relaxed text-encre-doux">
            Le modulaire bois traîne une réputation : préfabriqué bon marché,
            finitions médiocres, durée de vie courte.
          </p>
          <span aria-hidden className="mt-4 block h-px w-8 bg-laiton" />
          <p className="mt-4 text-base leading-relaxed text-encre-doux">
            <strong className="font-semibold text-encre">
              Nous construisons l&apos;inverse.
            </strong>{" "}
            Ossature Douglas certifiée, isolation conforme RE2020, bardage
            Cryptomeria — les matériaux et les gestes sont ceux d&apos;une
            maison construite sur place. Chaque maison est conçue et
            assemblée en atelier français par des charpentiers et menuisiers
            expérimentés.
          </p>
        </div>

        <div className="min-w-0">
          <p className="text-xs text-encre-douce">
            <span className="font-semibold text-encre">
              {String(active + 1).padStart(2, "0")}
            </span>{" "}
            / {String(FIGURES.length).padStart(2, "0")}
          </p>

          <div className="relative mt-16 flex items-end justify-between gap-1">
            <div className="absolute inset-x-0 bottom-[5px] h-px bg-encre/10" />
            <motion.div
              className="absolute bottom-[5px] left-0 h-px bg-laiton"
              animate={{
                width: `${(active / (FIGURES.length - 1)) * 100}%`,
              }}
              transition={
                prefersReducedMotion ? { duration: 0 } : { duration: 0.6, ease: "easeOut" }
              }
            />

            {FIGURES.map((figure, i) => {
              const isActive = i === active;
              return (
                <button
                  key={figure.label}
                  type="button"
                  onClick={() => setActive(i)}
                  aria-label={`${figure.value} ${figure.label}`}
                  aria-pressed={isActive}
                  className="relative z-10 flex min-w-0 flex-1 flex-col items-center gap-3 sm:gap-4"
                >
                  {isActive ? (
                    <motion.div
                      layoutId="figure-card"
                      transition={
                        prefersReducedMotion
                          ? { duration: 0 }
                          : { type: "spring", stiffness: 260, damping: 34, mass: 0.9 }
                      }
                    >
                      <GlassPanel
                        rounded="rounded-2xl"
                        className="figure-card w-[168px] px-6 py-7 text-center sm:w-[232px] sm:px-9 sm:py-9"
                      >
                        <p className="text-xl font-semibold leading-snug text-encre sm:text-3xl">
                          {figure.value}
                        </p>
                        <p className="eyebrow mt-2.5 text-[10px] text-encre-douce sm:text-xs">
                          {figure.label}
                        </p>
                      </GlassPanel>
                    </motion.div>
                  ) : (
                    <div className="px-1 text-center opacity-40 transition-opacity hover:opacity-70">
                      <p className="text-xs font-medium text-encre sm:text-lg">
                        {figure.value}
                      </p>
                      <p className="eyebrow mt-1 text-[7px] text-encre-douce sm:text-[9px]">
                        {figure.label}
                      </p>
                    </div>
                  )}
                  <span
                    className={`h-2.5 w-2.5 shrink-0 rounded-full border-2 transition-colors duration-300 ${
                      isActive
                        ? "border-laiton bg-laiton"
                        : "border-encre/25 bg-brume-2"
                    }`}
                  />
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
