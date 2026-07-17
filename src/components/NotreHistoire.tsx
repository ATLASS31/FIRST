"use client";

import { useEffect, useRef, useState } from "react";
import {
  motion,
  useMotionTemplate,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from "framer-motion";
import GlassPanel from "./GlassPanel";

const AUTOPLAY_MS = 3000;

const FIGURES = [
  { value: "20 ans", label: "de garantie" },
  { value: "4–12 semaines", label: "de livraison" },
  { value: "100%", label: "fabriqué en France" },
];

/**
 * Pointeur souris pour la carte active — un seul hook au niveau du
 * composant (jamais dans le `.map`, les hooks ne peuvent pas y être
 * appelés conditionnellement) puisqu'une seule carte est "active" à la
 * fois. Même technique de throttle qu'ailleurs sur le site
 * (`TiltCard.tsx`) : les coordonnées les plus récentes sont conservées
 * dans une ref, appliquées au plus une fois par frame via
 * `requestAnimationFrame`, pour ne pas multiplier les recalculs sur un
 * élément avec `backdrop-filter`.
 */
function useCardPointer() {
  const ref = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);
  const latestPoint = useRef({ x: 0, y: 0 });
  const px = useMotionValue(0.5);
  const py = useMotionValue(0.5);
  const springConfig = { stiffness: 220, damping: 28, mass: 0.4 };
  const sx = useSpring(px, springConfig);
  const sy = useSpring(py, springConfig);

  useEffect(() => {
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  const handleMove = (e: React.MouseEvent<HTMLDivElement>) => {
    latestPoint.current = { x: e.clientX, y: e.clientY };
    if (rafRef.current !== null) return;
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null;
      const rect = ref.current?.getBoundingClientRect();
      if (!rect) return;
      px.set((latestPoint.current.x - rect.left) / rect.width);
      py.set((latestPoint.current.y - rect.top) / rect.height);
    });
  };

  const handleLeave = () => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    px.set(0.5);
    py.set(0.5);
  };

  return { ref, sx, sy, handleMove, handleLeave };
}

export default function NotreHistoire() {
  const [active, setActive] = useState(0);
  const prefersReducedMotion = useReducedMotion();
  const { ref: cardRef, sx, sy, handleMove, handleLeave } = useCardPointer();

  const shineX = useTransform(sx, [0, 1], ["0%", "100%"]);
  const shineY = useTransform(sy, [0, 1], ["0%", "100%"]);
  const shineBackground = useMotionTemplate`radial-gradient(220px circle at ${shineX} ${shineY}, rgba(255,255,255,0.32), transparent 60%)`;
  const rotateX = useTransform(sy, [0, 1], [3.5, -3.5]);
  const rotateY = useTransform(sx, [0, 1], [-3.5, 3.5]);

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
    <section className="notre-histoire-surface relative overflow-hidden px-6 py-20 sm:py-24">
      <div className="relative z-10 mx-auto grid max-w-6xl gap-16 lg:grid-cols-[1fr_1.2fr] lg:items-center">
        <div className="min-w-0">
          <p className="eyebrow text-xs text-encre-douce">Notre histoire</p>
          <h2 className="mt-4 text-4xl font-semibold text-encre sm:text-5xl">
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
          <p className="text-sm text-encre-douce">
            <span className="font-semibold text-laiton">
              {String(active + 1).padStart(2, "0")}
            </span>{" "}
            / {String(FIGURES.length).padStart(2, "0")}
          </p>

          <div className="relative mt-16 flex items-end justify-between gap-1">
            <div className="absolute inset-x-0 bottom-[7px] h-px bg-encre/8" />
            <motion.div
              className="absolute bottom-[7px] left-0 h-px bg-laiton"
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
                  className="relative z-10 flex min-w-0 flex-1 flex-col items-center gap-3 sm:gap-5"
                >
                  {isActive ? (
                    <motion.div
                      ref={cardRef}
                      layoutId="figure-card"
                      onMouseMove={handleMove}
                      onMouseLeave={handleLeave}
                      style={{
                        rotateX,
                        rotateY,
                        transformPerspective: 800,
                      }}
                      transition={
                        prefersReducedMotion
                          ? { duration: 0 }
                          : { type: "spring", stiffness: 220, damping: 30, mass: 0.8 }
                      }
                    >
                      <GlassPanel
                        rounded="rounded-[42px_30px_46px_26px]"
                        className="figure-card w-[176px] px-7 py-8 text-center sm:w-[248px] sm:px-10 sm:py-10"
                      >
                        <motion.div
                          aria-hidden
                          className="figure-card-mouse-shine"
                          style={{ background: shineBackground }}
                        />
                        <motion.div
                          key={active}
                          initial={{ opacity: 0, y: 4 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={
                            prefersReducedMotion
                              ? { duration: 0 }
                              : { duration: 0.4, delay: 0.1, ease: "easeOut" }
                          }
                        >
                          <p className="text-2xl font-semibold leading-snug text-[#FAF8F3] sm:text-4xl">
                            {figure.value}
                          </p>
                          <p className="eyebrow mt-2.5 text-xs text-[#FAF8F3]/65 sm:text-sm">
                            {figure.label}
                          </p>
                          <span
                            aria-hidden
                            className="mx-auto mt-3 block h-px w-6 bg-laiton/70"
                          />
                        </motion.div>
                      </GlassPanel>
                    </motion.div>
                  ) : (
                    <div className="px-1 text-center opacity-55 transition-opacity hover:opacity-80">
                      <p className="text-sm font-medium text-encre sm:text-xl">
                        {figure.value}
                      </p>
                      <p className="eyebrow mt-1 text-[8px] text-encre-douce sm:text-[10px]">
                        {figure.label}
                      </p>
                    </div>
                  )}
                  <span className="relative flex h-4 w-4 shrink-0 items-center justify-center">
                    <span
                      className={`absolute inset-0 rounded-full border transition-colors duration-300 ${
                        isActive ? "border-laiton" : "border-encre/20"
                      }`}
                    />
                    <motion.span
                      className="h-1.5 w-1.5 rounded-full bg-laiton"
                      initial={false}
                      animate={{ scale: isActive ? 1 : 0, opacity: isActive ? 1 : 0 }}
                      transition={
                        prefersReducedMotion
                          ? { duration: 0 }
                          : { type: "spring", stiffness: 400, damping: 26 }
                      }
                    />
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
