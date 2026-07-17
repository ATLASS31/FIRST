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
// explicitement la timeline à la scène (concept validé par le client,
// conservé tel quel à travers la refonte de la scène elle-même).
const SUN_OFFSETS = [-14, 0, 14];

/**
 * Scène architecturale abstraite en fond de section — plus une
 * illustration de paysage (colline/pins/rochers/rive), jugée "pas assez
 * premium" et trop "dessinée". Reconstruite comme une composition de
 * volumes low-poly épurés : un plan lointain à peine perceptible (`F`), un
 * plan de sol qui unifie la composition (`B`), et deux monolithes facettés
 * qui se détachent nettement (`A` à gauche, `C` à droite, près du soleil).
 * Trois à quatre volumes, pas plus — l'inspiration explicite (maquette
 * architecturale, keynote Apple) demande peu d'éléments très bien
 * composés plutôt qu'un décor chargé de petits détails. Chaque volume est
 * en aplat (pas de dégradé lissé) avec au plus deux facettes de teinte
 * différente : c'est le contraste plat entre deux tons, pas un flou, qui
 * suggère la lumière et le pli d'une surface minérale. `active` ne pilote
 * que le décalage du soleil (voir `SUN_OFFSETS`) ; les animations
 * d'ambiance (lueur solaire, respiration de la lumière) sont en CSS pur
 * (voir `.scene-sun-glow`/`.scene-light-wash` dans `globals.css`) — aucun
 * risque d'hydratation puisqu'elles ne dépendent que d'une media query
 * `prefers-reduced-motion`, jamais de JS.
 */
function AbstractScene({
  active,
  prefersReducedMotion,
  className,
}: {
  active: number;
  prefersReducedMotion: boolean | null;
  className?: string;
}) {
  return (
    // `preserveAspectRatio="none"` : le conteneur (pleine largeur de
    // section, quelques dizaines de pixels de haut) est beaucoup plus
    // large que le viewBox — le comportement par défaut ("meet") aurait
    // centré la scène en préservant son ratio, laissant des bandes vides
    // à gauche/droite. Invisible sur un fond uni, mais ça décale aussi
    // tout le contenu (dont le soleil) vers le centre horizontal,
    // indépendamment de la largeur réelle du conteneur — c'est ce qui
    // faisait dériver le soleil jusque sous la timeline à certaines
    // largeurs. Les volumes sont des aplats géométriques simples : une
    // légère mise à l'échelle non uniforme ne se voit pas, contrairement
    // à un défaut d'alignement avec le texte et la carte au-dessus.
    <svg
      viewBox="0 0 800 220"
      preserveAspectRatio="none"
      aria-hidden
      className={className}
      fill="none"
    >
      {/* Plan lointain — à peine visible, donne juste une sensation
          d'espace au-delà de la composition principale. */}
      <path
        d="M0 220 L0 176 L200 168 L420 172 L620 165 L800 171 L800 220 Z"
        fill="#F0ECE1"
        opacity="0.3"
      />
      {/* Plan de sol — unifie les deux monolithes, deuxième niveau de
          profondeur. */}
      <path
        d="M0 220 L0 199 L180 190 L400 195 L620 188 L800 196 L800 220 Z"
        fill="#E7E0D0"
        opacity="0.42"
      />
      {/* Reflets très discrets à la base des monolithes — lumière qui
          rebondit sur le plan de sol, pas une eau ni un lac. */}
      <ellipse cx="107" cy="211" rx="56" ry="9" fill="url(#reflectionPool)" opacity="0.45" />
      <ellipse cx="668" cy="211" rx="58" ry="9" fill="url(#reflectionPool)" opacity="0.55" />
      {/* Monolithe gauche — deux facettes (avant éclairée / côté ombré), un
          court faîtage plutôt qu'un pic unique : lit comme un bloc massif
          taillé, pas comme un sommet de montagne. */}
      <g stroke="rgba(26,22,20,0.07)" strokeWidth="1">
        <polygon points="65,220 65,145 92,98 128,108 148,220" fill="#EDE6D8" opacity="0.62" />
        <polygon points="128,108 168,135 150,220 148,220" fill="#C9BCA2" opacity="0.55" />
      </g>
      {/* Monolithe droit — plus court, teinte réchauffée par la proximité
          du soleil, même principe de faîtage court. */}
      <g stroke="rgba(26,22,20,0.07)" strokeWidth="1">
        <polygon points="620,220 620,175 652,128 688,138 698,220" fill="#F1DBB0" opacity="0.6" />
        <polygon points="688,138 712,158 700,220 698,220" fill="#D8B98C" opacity="0.5" />
      </g>
      {/* Lumière chaude qui traverse la scène — un voile large et très
          diffus plutôt qu'un rayon dessiné, qui respire très lentement. */}
      <rect
        className="scene-light-wash"
        x="260"
        y="0"
        width="540"
        height="220"
        fill="url(#ambientLight)"
      />
      {/* Soleil bas — se décale selon l'étape active de la timeline. Position
          verticale calée à dessein sur la même hauteur relative que dans la
          scène figurative précédente (cy proche de 148 plutôt que très haut
          dans le ciel) : avec `preserveAspectRatio="none"`, le conteneur
          très large et bas fait qu'un soleil placé haut dans le viewBox
          finit visuellement tout près de la timeline au-dessus — vérifié
          avec un script de mesure comparant le centre du soleil rendu à la
          position du dernier point de la timeline. */}
      <motion.g
        animate={{ x: SUN_OFFSETS[active] }}
        transition={
          prefersReducedMotion ? { duration: 0 } : { type: "spring", stiffness: 50, damping: 18 }
        }
      >
        <circle className="scene-sun-glow" cx="735" cy="146" r="40" fill="url(#sunGlow)" />
        <circle cx="735" cy="146" r="8" fill="#F0C48A" opacity="0.75" />
      </motion.g>
      <defs>
        <radialGradient id="sunGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#F3C892" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#F3C892" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="ambientLight" cx="86%" cy="55%" r="75%">
          <stop offset="0%" stopColor="#F6D9A6" stopOpacity="0.16" />
          <stop offset="100%" stopColor="#F6D9A6" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="reflectionPool" cx="50%" cy="0%" r="100%">
          <stop offset="0%" stopColor="#F0C48A" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#F0C48A" stopOpacity="0" />
        </radialGradient>
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
  // Deux couches de spéculaire plutôt qu'une seule tache diffuse : un point
  // chaud étroit (comme la réflexion directe d'une source de lumière sur
  // une surface polie) superposé à un halo large et doux (l'éclairage
  // ambiant réfléchi) — c'est la combinaison des deux qui lit comme un
  // vrai matériau physique plutôt qu'un simple dégradé qui suit la souris.
  const shineBackground = useMotionTemplate`radial-gradient(70px circle at ${shineX} ${shineY}, rgba(255,255,255,0.55), transparent 45%), radial-gradient(260px circle at ${shineX} ${shineY}, rgba(255,255,255,0.2), transparent 65%)`;
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
      {/* Scène architecturale abstraite — décor d'ambiance seulement
          (demande explicite : "ne pas prendre toute la place"), une bande
          basse et discrète, jamais l'élément principal. `z-0` sous le
          contenu. */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 z-0 h-32 sm:h-40 lg:h-48"
        style={{ x: parallaxX, y: parallaxY }}
      >
        <AbstractScene
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
                        rounded="rounded-[48px_26px_52px_20px]"
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
