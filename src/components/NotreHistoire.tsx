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
 * Colline bas-gauche : petits pins minimalistes, deux rochers, un chemin
 * qui s'estompe (dégradé de trait) plutôt que de s'arrêter net — pensé
 * pour disparaître derrière le texte, pas pour être suivi jusqu'au bout.
 * Couleurs volontairement proches du fond de section (`--brume-2`), avec
 * juste une touche de sauge et de sable — pas une illustration posée
 * dessus, un détail qui affleure.
 */
function HillDecor({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 320 170" aria-hidden className={className} fill="none">
      <path
        d="M0 170 L0 128 C 40 108 78 118 110 126 C 150 136 190 118 230 128 L 320 150 L 320 170 Z"
        fill="#EDE6D6"
        opacity="0.55"
      />
      <path
        d="M18 168 C 46 148 70 132 96 118 C 128 100 168 84 220 70"
        stroke="url(#pathFade)"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <g fill="#5B6E56" opacity="0.5">
        <path d="M46 118 L58 118 L52 96 Z" />
        <path d="M48 128 L56 128 L52 108 Z" />
        <path d="M82 122 L92 122 L87 102 Z" />
        <path d="M110 128 L118 128 L114 112 Z" />
      </g>
      <g fill="#8A7458" opacity="0.55">
        <rect x="50.5" y="128" width="3" height="8" />
        <rect x="85.5" y="122" width="3" height="7" />
        <rect x="112.5" y="128" width="2.5" height="6" />
      </g>
      <g fill="#DCD3BF" opacity="0.6">
        <ellipse cx="145" cy="152" rx="14" ry="7" />
        <ellipse cx="168" cy="158" rx="10" ry="5.5" />
      </g>
      <defs>
        <linearGradient
          id="pathFade"
          x1="18"
          y1="168"
          x2="220"
          y2="70"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#8A7458" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#8A7458" stopOpacity="0" />
        </linearGradient>
      </defs>
    </svg>
  );
}

/**
 * Petite rive bas-droite : eau calme (quelques lignes horizontales, pas
 * une surface pleine), reflet doré réduit à un simple trait dégradé —
 * "extrêmement discret", pas un soleil ni un grand miroir.
 */
function ShoreDecor({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 220 110" aria-hidden className={className} fill="none">
      <path
        d="M220 110 L220 70 C 196 58 176 62 158 74 L 140 110 Z"
        fill="#EDE6D6"
        opacity="0.5"
      />
      <g stroke="#8FA0AC" strokeWidth="1.2" strokeLinecap="round" opacity="0.35">
        <line x1="20" y1="88" x2="130" y2="88" />
        <line x1="40" y1="98" x2="150" y2="98" />
        <line x1="10" y1="106" x2="120" y2="106" />
      </g>
      <rect x="70" y="90" width="46" height="3" rx="1.5" fill="url(#goldReflect)" opacity="0.4" />
      <defs>
        <linearGradient id="goldReflect" x1="70" y1="0" x2="116" y2="0" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#AD8A55" stopOpacity="0" />
          <stop offset="50%" stopColor="#AD8A55" stopOpacity="0.7" />
          <stop offset="100%" stopColor="#AD8A55" stopOpacity="0" />
        </linearGradient>
      </defs>
    </svg>
  );
}

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
    <section className="relative overflow-hidden bg-brume-2 px-6 py-20 sm:py-24">
      {/* Décor low-poly minimal — pivot complet après retour client : plus
          aucune image de fond, une colline/pins/rochers/chemin dessinés à
          la main (même esprit que `PlantShadow` sur ThreePiliers) côté
          gauche, une petite rive à droite. Volontairement petit et
          discret (<20% de l'attention visuelle demandée) : le contenu
          reste le héros de la section, le décor n'apporte qu'un peu de
          profondeur. `z-0` sous le contenu (`z-10`). */}
      <div aria-hidden className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="absolute bottom-0 left-0 h-28 w-48 sm:h-36 sm:w-64 lg:h-40 lg:w-72"
        >
          <HillDecor className="h-full w-full" />
        </motion.div>
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 1, delay: 0.2, ease: "easeOut" }}
          className="absolute bottom-0 right-0 h-20 w-36 sm:h-24 sm:w-48 lg:h-28 lg:w-56"
        >
          <ShoreDecor className="h-full w-full" />
        </motion.div>
      </div>

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
                          : { type: "spring", stiffness: 260, damping: 34, mass: 0.9 }
                      }
                    >
                      <GlassPanel
                        rounded="rounded-[32px]"
                        className="figure-card w-[176px] px-7 py-8 text-center sm:w-[248px] sm:px-10 sm:py-10"
                      >
                        <motion.div
                          aria-hidden
                          className="figure-card-mouse-shine"
                          style={{ background: shineBackground }}
                        />
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
                  <span
                    className={`h-3 w-3 shrink-0 rounded-full border-2 transition-colors duration-300 ${
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
