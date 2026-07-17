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

// Décalage horizontal du soleil selon l'étape active — le seul fil qui relie
// explicitement la timeline à la scène (demande du client : "le soleil se
// décale imperceptiblement selon l'étape active").
const SUN_OFFSETS = [-16, 0, 16];

/**
 * Scène low-poly en fond de section — colline/pins/rochers à gauche, rive
 * et eau calme à droite, un seul dessin continu (pas deux fragments
 * séparés) pour que la lumière du soleil ait un sens sur toute la largeur.
 * Couleurs choisies proches de `--ciel` (le fond de la section) : c'est un
 * détail d'ambiance, pas une illustration qui se remarque en premier.
 * `active` ne pilote que le décalage du soleil (voir `SUN_OFFSETS`) ; les
 * animations d'ambiance (lueur, reflet) sont en CSS pure (voir
 * `.scene-sun-glow`/`.scene-water-shimmer` dans `globals.css`) — aucun
 * risque d'hydratation puisqu'elles ne dépendent que d'une media query
 * `prefers-reduced-motion`, jamais de JS.
 */
function LandscapeScene({
  active,
  prefersReducedMotion,
  className,
}: {
  active: number;
  prefersReducedMotion: boolean | null;
  className?: string;
}) {
  return (
    <svg viewBox="0 0 800 220" aria-hidden className={className} fill="none">
      {/* Colline */}
      <path
        d="M0 220 L0 150 C 50 125 100 138 140 148 C 190 160 240 138 290 150 L 340 175 L 340 220 Z"
        fill="#EDE6D6"
        opacity="0.55"
      />
      {/* Chemin qui s'estompe */}
      <path
        d="M20 214 C 55 188 85 168 118 150 C 155 128 205 108 270 90"
        stroke="url(#pathFade)"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      {/* Pins minimalistes */}
      <g fill="#5B6E56" opacity="0.5">
        <path d="M55 148 L70 148 L62.5 120 Z" />
        <path d="M58 158 L67 158 L62.5 136 Z" />
        <path d="M100 154 L112 154 L106 130 Z" />
        <path d="M133 160 L143 160 L138 142 Z" />
      </g>
      <g fill="#8A7458" opacity="0.55">
        <rect x="61" y="158" width="3" height="10" />
        <rect x="104.5" y="154" width="3" height="8" />
        <rect x="136.5" y="160" width="2.5" height="7" />
      </g>
      {/* Rochers facettés (deux tons par bloc pour suggérer une facette) */}
      <g opacity="0.55">
        <polygon points="170,220 200,220 194,198 178,196" fill="#DCD3BF" />
        <polygon points="194,198 178,196 184,182 198,186" fill="#EDE6D6" />
        <polygon points="232,220 264,220 255,198 240,196" fill="#DCD3BF" />
        <polygon points="255,198 240,196 246,182 261,186" fill="#EDE6D6" />
      </g>
      {/* Brume légère sur la ligne d'horizon, pour la profondeur */}
      <rect x="0" y="140" width="800" height="30" fill="url(#mist)" opacity="0.5" />
      {/* Rive et eau calme */}
      <path
        d="M800 220 L800 150 C 740 130 680 140 620 158 L 560 220 Z"
        fill="#EDE6D6"
        opacity="0.45"
      />
      <g stroke="#8FA0AC" strokeWidth="1.2" strokeLinecap="round" opacity="0.3">
        <line x1="420" y1="185" x2="700" y2="185" />
        <line x1="450" y1="198" x2="730" y2="198" />
        <line x1="400" y1="210" x2="680" y2="210" />
      </g>
      {/* Soleil bas + reflet — se décale selon l'étape active */}
      <motion.g
        animate={{ x: SUN_OFFSETS[active] }}
        transition={
          prefersReducedMotion ? { duration: 0 } : { type: "spring", stiffness: 50, damping: 18 }
        }
      >
        <circle className="scene-sun-glow" cx="640" cy="148" r="46" fill="url(#sunGlow)" />
        <circle cx="640" cy="148" r="12" fill="#F0C48A" opacity="0.75" />
        <rect
          className="scene-water-shimmer"
          x="598"
          y="160"
          width="84"
          height="50"
          fill="url(#sunReflect)"
        />
      </motion.g>
      <defs>
        <linearGradient id="pathFade" x1="20" y1="214" x2="270" y2="90" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#8A7458" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#8A7458" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="mist" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#F6F2EA" stopOpacity="0" />
          <stop offset="55%" stopColor="#F6F2EA" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#F6F2EA" stopOpacity="0" />
        </linearGradient>
        <radialGradient id="sunGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#F3C892" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#F3C892" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="sunReflect" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#E8B978" stopOpacity="0.45" />
          <stop offset="100%" stopColor="#E8B978" stopOpacity="0" />
        </linearGradient>
      </defs>
    </svg>
  );
}

/**
 * Pointeur souris sur toute la section — pilote un très léger parallaxe de
 * la scène ("la caméra respire"). Distinct du pointeur de la carte
 * (`useCardPointer`) : le parallaxe se calcule par rapport à la section
 * entière, le reflet de la carte par rapport à la carte elle-même — deux
 * repères différents, deux hooks. Même throttle `requestAnimationFrame`
 * que partout ailleurs sur le site.
 */
function useScenePointer() {
  const ref = useRef<HTMLElement>(null);
  const rafRef = useRef<number | null>(null);
  const latestPoint = useRef({ x: 0, y: 0 });
  const px = useMotionValue(0.5);
  const py = useMotionValue(0.5);
  const springConfig = { stiffness: 55, damping: 20, mass: 0.6 };
  const sx = useSpring(px, springConfig);
  const sy = useSpring(py, springConfig);

  useEffect(() => {
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  const handleMove = (e: React.MouseEvent<HTMLElement>) => {
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
  const {
    ref: sceneRef,
    sx: sceneSx,
    sy: sceneSy,
    handleMove: handleSceneMove,
    handleLeave: handleSceneLeave,
  } = useScenePointer();

  const shineX = useTransform(sx, [0, 1], ["0%", "100%"]);
  const shineY = useTransform(sy, [0, 1], ["0%", "100%"]);
  const shineBackground = useMotionTemplate`radial-gradient(220px circle at ${shineX} ${shineY}, rgba(255,255,255,0.32), transparent 60%)`;
  const rotateX = useTransform(sy, [0, 1], [3.5, -3.5]);
  const rotateY = useTransform(sx, [0, 1], [-3.5, 3.5]);

  const parallaxX = useTransform(sceneSx, [0, 1], [-6, 6]);
  const parallaxY = useTransform(sceneSy, [0, 1], [-4, 4]);

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
    <section
      ref={sceneRef}
      onMouseMove={handleSceneMove}
      onMouseLeave={handleSceneLeave}
      className="relative overflow-hidden bg-ciel px-6 py-20 sm:py-24"
    >
      {/* Scène 3D minimaliste — décor d'ambiance seulement (demande
          explicite : "ne pas prendre toute la place"), une bande basse et
          discrète, jamais l'élément principal. `z-0` sous le contenu. */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 z-0 h-32 sm:h-40 lg:h-48"
        style={{ x: parallaxX, y: parallaxY }}
      >
        <LandscapeScene
          active={active}
          prefersReducedMotion={prefersReducedMotion}
          className="h-full w-full"
        />
      </motion.div>

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
                          <p className="text-2xl font-semibold leading-snug text-encre sm:text-4xl">
                            {figure.value}
                          </p>
                          <p className="eyebrow mt-2.5 text-xs text-encre-douce sm:text-sm">
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
                    <span aria-hidden className="block h-3" />
                  )}
                  <span className="relative flex h-4 w-4 shrink-0 items-center justify-center">
                    {isActive && (
                      <span className="scene-dot-glow absolute inset-[-6px] rounded-full" />
                    )}
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
