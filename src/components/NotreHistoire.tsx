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

// Décalage de la lumière selon l'étape active — le seul élément conservé
// tel quel de la version précédente ("le seul élément que j'aime
// vraiment"). Ce n'est plus un soleil dans un paysage : c'est la source de
// lumière qui éclaire la carte elle-même, ce qui rend le lien beaucoup
// plus direct qu'avant (la carte captait la lumière d'une scène lointaine ;
// ici la lumière est juste derrière elle).
const LIGHT_OFFSETS = [
  { x: -20, y: 12 },
  { x: 4, y: -10 },
  { x: 24, y: 6 },
];

const EASE_PREMIUM = [0.16, 1, 0.3, 1] as const;

/**
 * Deuxième repartie complète de cette section (la première refonte
 * remplaçait un paysage low-poly par des volumes architecturaux abstraits
 * — jugés "posés là sans intention", "froids", ne dégageant "ni
 * architecture, ni luxe, ni élégance"). Sur demande explicite du client,
 * on repart d'une page blanche plutôt que d'itérer encore sur cette
 * direction : "je préfère une proposition radicalement différente qu'une
 * nouvelle amélioration de cette version". Toute forme géométrique
 * figurative (volumes, plans de sol, faîtages) est supprimée. Il ne reste
 * que de la lumière et une seule carte, la lumière et le verre étant les
 * deux points sur lesquels le client a explicitement demandé de pousser
 * ("pousse énormément le travail sur la lumière", "améliore encore la
 * qualité du Liquid Glass, qui reste le point le plus faible").
 */
function useLightPointer() {
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
 * `useLightPointer` mais mesuré contre la carte elle-même (repère
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
    sx: lightSx,
    sy: lightSy,
    handleMove: handleSectionMove,
    handleLeave: handleSectionLeave,
  } = useLightPointer();

  const shineX = useTransform(sx, [0, 1], ["0%", "100%"]);
  const shineY = useTransform(sy, [0, 1], ["0%", "100%"]);
  // Spéculaire à deux couches : un point chaud étroit (réflexion directe
  // d'une source de lumière sur une surface polie) superposé à un halo
  // large et doux (éclairage ambiant réfléchi).
  const shineBackground = useMotionTemplate`radial-gradient(64px circle at ${shineX} ${shineY}, rgba(255,255,255,0.6), transparent 45%), radial-gradient(240px circle at ${shineX} ${shineY}, rgba(255,255,255,0.22), transparent 65%)`;
  const rotateX = useTransform(sy, [0, 1], [4, -4]);
  const rotateY = useTransform(sx, [0, 1], [-4, 4]);

  const lightParallaxX = useTransform(lightSx, [0, 1], [-10, 10]);
  const lightParallaxY = useTransform(lightSy, [0, 1], [-7, 7]);

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
      onMouseMove={handleSectionMove}
      onMouseLeave={handleSectionLeave}
      className="relative overflow-hidden bg-ciel px-6 py-20 sm:py-24"
    >
      {/* Champ de lumière — plus aucune forme figurative, seulement une
          source de lumière chaude qui éclaire la carte depuis le
          haut-droite, se décale selon l'étape active, et respire très
          légèrement au mouvement de la souris sur toute la section. */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-0"
        style={{ x: lightParallaxX, y: lightParallaxY }}
      >
        <div className="hs-light-halo hidden sm:block" />
        <div className="hs-light-ground" />
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

        <div className="flex min-w-0 flex-col items-center">
          {/* Carte unique — plus de rotation entre trois emplacements, un
              seul objet fixe dont seul le contenu change. "Je préfère une
              seule carte absolument parfaite plutôt que plusieurs bonnes
              idées." */}
          <div className="relative mt-8">
            {/* Source de lumière — ancrée au conteneur de la carte (pas à
                la section) pour garantir qu'elle reste visuellement collée
                au coin haut-droit de l'objet qu'elle éclaire, quelle que
                soit la largeur d'écran. C'est elle qui porte le décalage
                entre étapes ("le seul élément que j'aime vraiment"). */}
            <motion.div
              aria-hidden
              className="hs-light-group pointer-events-none absolute -right-6 -top-10 sm:-right-10 sm:-top-14"
              animate={{ x: LIGHT_OFFSETS[active].x, y: LIGHT_OFFSETS[active].y }}
              transition={
                prefersReducedMotion
                  ? { duration: 0 }
                  : { type: "spring", stiffness: 45, damping: 16 }
              }
            >
              <div className="hs-light-bloom" />
              <div className="hs-light-core" />
            </motion.div>
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
                    pas en bande diagonale à travers le centre — c'est ce
                    detail qui manquait pour lire "épaisseur réelle" plutôt
                    que "reflet peint". L'intensité varie tout autour via
                    un conic-gradient dont le pic est orienté vers la
                    source de lumière (haut-droite), pas uniforme. */}
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

          {/* Rail de progression — deuxième refonte. La première version
              (piste plate + trois points gris + un marqueur qui glisse)
              restait un pattern de stepper très reconnaissable — "un
              composant de maquette Figma" au retour client. Ce qui rend un
              stepper immédiatement identifiable comme un composant d'UI,
              ce n'est pas la piste, ce sont les points : trois cercles
              discrets sont un vocabulaire d'interface universel. Ils
              disparaissent entièrement (les cibles de clic restent,
              invisibles). La piste elle-même devient une rainure gravée
              (ombre interne, pas un trait plat posé dessus) plutôt qu'une
              ligne dessinée, et le marqueur devient une bille de verre
              avec son propre reflet plutôt qu'un aplat radial — le seul
              repère visuel restant est une goutte de lumière qui glisse
              dans un creux, pas un point d'étape parmi d'autres. */}
          <div className="mt-10 flex w-full max-w-[240px] items-center gap-4 sm:mt-12">
            <div className="hs-rail-track relative h-2 flex-1 rounded-full">
              <motion.div
                className="hs-rail-marker absolute top-1/2"
                animate={{
                  left: `${(active / (FIGURES.length - 1)) * 100}%`,
                }}
                transition={
                  prefersReducedMotion
                    ? { duration: 0 }
                    : { type: "spring", stiffness: 260, damping: 28, mass: 0.7 }
                }
                style={{ translateX: "-50%", translateY: "-50%" }}
              >
                <span className="hs-rail-marker-shine" />
              </motion.div>
              {FIGURES.map((f, i) => (
                <button
                  key={f.label}
                  type="button"
                  onClick={() => setActive(i)}
                  aria-label={`${f.value} ${f.label}`}
                  aria-pressed={i === active}
                  className="absolute top-1/2 h-8 w-8 -translate-x-1/2 -translate-y-1/2"
                  style={{ left: `${(i / (FIGURES.length - 1)) * 100}%` }}
                />
              ))}
            </div>
            <p className="shrink-0 text-xs tabular-nums text-encre-douce">
              <span className="font-semibold text-laiton">
                {String(active + 1).padStart(2, "0")}
              </span>{" "}
              / {String(FIGURES.length).padStart(2, "0")}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
