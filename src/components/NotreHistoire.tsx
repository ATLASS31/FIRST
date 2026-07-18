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

const AUTOPLAY_MS = 3500;

const FIGURES = [
  { value: "20 ans", label: "de garantie" },
  { value: "4–12 semaines", label: "de livraison" },
  { value: "100%", label: "fabriqué en France" },
];

const EASE_PREMIUM = [0.16, 1, 0.3, 1] as const;

// Prisme triangulaire : trois faces à 120° les unes des autres. Largeur,
// hauteur et rayon (distance du centre à chaque face, R = W / (2 * tan(60°))
// pour un triangle équilatéral régulier) sont posés en CSS pur
// (`.hs-object-face:nth-child`, voir globals.css) plutôt que calculés ici :
// la valeur ne dépend que du breakpoint, une media query suffit, pas besoin
// de la recalculer en JS ni de la faire transiter par un style inline.
const FACE_MATERIALS = ["hs-face-glass", "hs-face-bronze", "hs-face-stone"] as const;

/**
 * Troisième repartie sur cette section. Le "soleil" du tour précédent —
 * seul élément que le client disait vouloir garder à l'origine — est
 * finalement retiré à son tour : en pratique, un halo chaud posé sur un
 * fond clair "attire l'œil mais n'apporte pas de valeur". Consigne
 * explicite : plus de halo lumineux, un véritable objet 3D qui
 * "raconte quelque chose" en changeant d'orientation à chaque étape.
 *
 * Construit en CSS 3D pur (`transform-style: preserve-3d`, pas de
 * WebGL/Three.js) : le projet n'a aucune dépendance 3D, et ajouter un
 * moteur WebGL pour un seul élément décoratif aurait été disproportionné
 * (poids, complexité SSR, risque) par rapport à ce qu'un prisme en CSS
 * peut déjà livrer honnêtement — un vrai volume à trois faces, profondeur
 * réelle, rotation réelle, pas une image qui simule la 3D.
 *
 * Trois couches de rotation superposées plutôt qu'une seule, chacune sur
 * son propre axe pour ne jamais entrer en conflit :
 * 1. Inclinaison au mouvement de la souris (`rotateX` piloté par une
 *    `MotionValue` externe via `style`) — Framer Motion ne peut pas à la
 *    fois recevoir une valeur externe et l'animer lui-même sur la même
 *    propriété du même élément, d'où la séparation en couches.
 * 2. Rotation d'étape (`rotateY`, `animate`, ressort) — un tiers de tour
 *    exact par étape (120°), pour qu'une face différente fasse
 *    précisément face à l'écran à chaque changement : "révéler une autre
 *    face" au sens propre, pas une métaphore.
 * 3. Rotation d'ambiance continue, très lente, en CSS pur
 *    (`@keyframes`) — l'objet ne s'arrête jamais complètement, comme un
 *    objet exposé sous une lumière qui tourne doucement. Coupée sous
 *    `prefers-reduced-motion` sans aucun risque d'hydratation puisqu'elle
 *    ne dépend que d'une media query, jamais de JS.
 */
function Object3D({
  active,
  prefersReducedMotion,
  sx,
  sy,
}: {
  active: number;
  prefersReducedMotion: boolean | null;
  sx: ReturnType<typeof useSpring>;
  sy: ReturnType<typeof useSpring>;
}) {
  const tiltX = useTransform(sy, [0, 1], [10, -10]);
  const parallaxX = useTransform(sx, [0, 1], [-6, 6]);

  return (
    <div className="hs-object-scene" aria-hidden>
      <motion.div
        className="hs-object-tilt"
        style={{ rotateX: tiltX, x: parallaxX }}
      >
        <motion.div
          className="hs-object-step"
          animate={{ rotateY: -active * 120 }}
          transition={
            prefersReducedMotion
              ? { duration: 0 }
              : { type: "spring", stiffness: 70, damping: 14, mass: 1 }
          }
        >
          <div className="hs-object-idle">
            {FACE_MATERIALS.map((materialClass) => (
              <div key={materialClass} className={`hs-object-face ${materialClass}`}>
                <span className="hs-object-face-edge" />
              </div>
            ))}
          </div>
        </motion.div>
      </motion.div>
      <div className="hs-object-shadow" />
    </div>
  );
}

/**
 * Pointeur souris sur toute la section — pilote l'inclinaison de l'objet
 * 3D (voir `Object3D`). Distinct du pointeur de la carte
 * (`useCardPointer`) : repères différents (section entière vs carte).
 */
function useScenePointer() {
  const ref = useRef<HTMLElement>(null);
  const rafRef = useRef<number | null>(null);
  const latestPoint = useRef({ x: 0, y: 0 });
  const px = useMotionValue(0.5);
  const py = useMotionValue(0.5);
  const springConfig = { stiffness: 45, damping: 20, mass: 0.7 };
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
 * Pointeur souris pour la carte — identique en structure à
 * `useScenePointer` mais mesuré contre la carte elle-même (repère
 * différent), throttlé à une mise à jour par frame comme partout ailleurs
 * sur le site (`TiltCard.tsx`).
 */
function useCardPointer() {
  const ref = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);
  const latestPoint = useRef({ x: 0, y: 0 });
  const px = useMotionValue(0.5);
  const py = useMotionValue(0.5);
  const springConfig = { stiffness: 200, damping: 26, mass: 0.4 };
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
    ref: sectionRef,
    sx: sceneSx,
    sy: sceneSy,
    handleMove: handleSceneMove,
    handleLeave: handleSceneLeave,
  } = useScenePointer();

  const shineX = useTransform(sx, [0, 1], ["0%", "100%"]);
  const shineY = useTransform(sy, [0, 1], ["0%", "100%"]);
  // Spéculaire à deux couches : un point chaud étroit (réflexion directe
  // d'une source de lumière sur une surface polie) superposé à un halo
  // large et doux (éclairage ambiant réfléchi).
  const shineBackground = useMotionTemplate`radial-gradient(64px circle at ${shineX} ${shineY}, rgba(255,255,255,0.6), transparent 45%), radial-gradient(240px circle at ${shineX} ${shineY}, rgba(255,255,255,0.22), transparent 65%)`;
  const rotateX = useTransform(sy, [0, 1], [4, -4]);
  const rotateY = useTransform(sx, [0, 1], [-4, 4]);

  useEffect(() => {
    const id = setInterval(() => {
      setActive((i) => (i + 1) % FIGURES.length);
    }, AUTOPLAY_MS);
    return () => clearInterval(id);
  }, [active]);

  const figure = FIGURES[active];

  return (
    <section
      ref={sectionRef}
      onMouseMove={handleSceneMove}
      onMouseLeave={handleSceneLeave}
      className="relative overflow-hidden bg-ciel px-6 py-20 sm:py-24"
    >
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

        <div className="flex min-w-0 flex-col items-center">
          {/* Objet 3D — accompagne les transitions entre étapes en
              révélant une face différente à chaque changement, plutôt
              qu'un halo lumineux qui se contentait de se décaler. */}
          <Object3D
            active={active}
            prefersReducedMotion={prefersReducedMotion}
            sx={sceneSx}
            sy={sceneSy}
          />

          {/* Carte unique — un seul objet fixe dont seul le contenu
              change. "Je préfère une seule carte absolument parfaite
              plutôt que plusieurs bonnes idées." */}
          <div className="relative mt-6">
            <div aria-hidden className="hs-card-base" />
            <motion.div
              ref={cardRef}
              onMouseMove={handleMove}
              onMouseLeave={handleLeave}
              style={{ rotateX, rotateY, transformPerspective: 900 }}
              initial={{ opacity: 0, y: 26, scale: 0.94, filter: "blur(14px)" }}
              whileInView={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
              viewport={{ once: true, amount: 0.6 }}
              transition={
                prefersReducedMotion
                  ? { duration: 0 }
                  : { duration: 1, ease: EASE_PREMIUM }
              }
            >
              <GlassPanel
                rounded="rounded-[52px_28px_56px_22px]"
                className="hs-card w-[204px] px-8 py-10 text-center sm:w-[280px] sm:px-11 sm:py-12"
              >
                {/* Anneau de bord — trace le contour exact de la carte
                    (technique du "gradient border" : `mask-composite:
                    exclude` entre la boîte pleine et la boîte réduite du
                    padding) plutôt qu'un reflet diagonal posé sur toute la
                    face. Un vrai bord de verre s'éclaire sur son pourtour,
                    pas en bande diagonale à travers le centre. */}
                <div aria-hidden className="hs-card-rim" />
                <motion.div
                  aria-hidden
                  className="hs-card-shine"
                  style={{ background: shineBackground }}
                />
                <motion.div
                  key={active}
                  initial={{ opacity: 0, y: 6, scale: 0.985 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={
                    prefersReducedMotion
                      ? { duration: 0 }
                      : {
                          opacity: { duration: 0.5, delay: 0.08, ease: EASE_PREMIUM },
                          y: { duration: 0.5, delay: 0.08, ease: EASE_PREMIUM },
                          scale: { type: "spring", stiffness: 300, damping: 14, delay: 0.08 },
                        }
                  }
                >
                  <p className="text-3xl font-semibold leading-snug text-encre sm:text-5xl">
                    {figure.value}
                  </p>
                  <p className="eyebrow mt-3 text-xs text-encre-douce sm:text-sm">
                    {figure.label}
                  </p>
                  <span
                    aria-hidden
                    className="mx-auto mt-4 block h-px w-7 bg-laiton/70"
                  />
                </motion.div>
              </GlassPanel>
            </motion.div>
          </div>

          {/* Navigation par étapes numérotées — remplace le rail à bille
              de verre du tour précédent, jugé illisible ("on ne comprend
              pas immédiatement combien il y a d'étapes, où l'on se
              situe"). Trois segments numérotés visibles en permanence
              répondent directement aux trois questions posées par le
              client : le nombre total (trois segments, un coup d'œil), la
              position actuelle (le segment actif se détache nettement,
              fond et halo dorés), la progression (fin liseré qui se
              remplit sous le segment actif, calé sur la durée réelle de
              l'autoplay — remis à zéro à chaque changement, qu'il vienne
              du clic ou de l'autoplay). */}
          <div className="mt-8 flex items-center gap-2.5 sm:mt-10">
            {FIGURES.map((f, i) => {
              const isActive = i === active;
              return (
                <button
                  key={f.label}
                  type="button"
                  onClick={() => setActive(i)}
                  aria-label={`Étape ${i + 1} sur ${FIGURES.length} : ${f.value} ${f.label}`}
                  aria-pressed={isActive}
                  className={`hs-step relative flex h-11 w-11 items-center justify-center rounded-2xl text-sm font-semibold sm:h-12 sm:w-12 ${
                    isActive ? "hs-step-active text-encre" : "text-encre-douce"
                  }`}
                >
                  {isActive && (
                    <motion.span
                      key={active}
                      className="hs-step-progress"
                      initial={{ width: "0%" }}
                      animate={{ width: "100%" }}
                      transition={
                        prefersReducedMotion
                          ? { duration: 0 }
                          : { duration: AUTOPLAY_MS / 1000, ease: "linear" }
                      }
                    />
                  )}
                  <span className="relative z-10">{String(i + 1).padStart(2, "0")}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
