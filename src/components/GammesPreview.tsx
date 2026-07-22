"use client";

import Link from "next/link";
import Image from "next/image";
import {
  motion,
  useMotionTemplate,
  useReducedMotion,
  useScroll,
  useTransform,
} from "framer-motion";
import { useEffect, useRef, useState } from "react";
import TiltCard from "./TiltCard";
import GlassPanel from "./GlassPanel";
import { GAMMES } from "@/lib/gammes";

function SparkleIcon() {
  return (
    <span className="inline-flex w-0 shrink-0 items-center overflow-hidden transition-[width,margin-right] duration-300 group-hover:w-3 group-hover:mr-1.5 group-focus-within:w-3 group-focus-within:mr-1.5 group-active:w-3 group-active:mr-1.5">
      <svg
        viewBox="0 0 24 24"
        fill="currentColor"
        className="h-3 w-3 shrink-0 -rotate-45 transition-transform duration-300 group-hover:rotate-0"
      >
        <path d="M12 0 L14.2 9.8 L24 12 L14.2 14.2 L12 24 L9.8 14.2 L0 12 L9.8 9.8 Z" />
      </svg>
    </span>
  );
}

/**
 * Deuxième passe sur le rideau — le premier jet ("deux pointes fines
 * posées sur les bords") ne correspondait pas du tout au concept :
 * "je veux deux arbres complets, massifs et élégants [...] presque
 * collés l'un à l'autre au centre [...] qui masquent réellement les
 * trois cartes." Refonte complète de la silhouette et du positionnement,
 * la mécanique de scroll (useScroll non-pinné, palier de repos avant
 * l'ouverture) reste celle déjà validée.
 *
 * Silhouette large à feuillage (tronc visible + couronne composée de
 * plusieurs masses circulaires qui se recouvrent, jamais une pointe
 * unique façon conifère) plutôt que le "cyprès" mince du premier jet.
 * Chaque arbre occupe une moitié de la largeur du bloc titre+cartes, la
 * couronne poussée vers le bord intérieur (`justify-end`/`justify-start`)
 * pour que les deux se chevauchent largement au repos — "presque
 * collés" — et couvre toute la hauteur du bloc, du bas de la grille
 * jusqu'au-dessus du titre (`-top-16`).
 */
function BigTree({
  side,
  x,
  rotate,
}: {
  side: "left" | "right";
  x: ReturnType<typeof useTransform<number, string>>;
  rotate: ReturnType<typeof useTransform<number, number>>;
}) {
  const gradId = `gammes-bigtree-grad-${side}`;
  return (
    <div
      aria-hidden
      className={`pointer-events-none absolute -top-16 bottom-0 z-10 hidden w-[58%] md:flex ${
        side === "left" ? "left-0 justify-end" : "right-0 justify-start"
      }`}
    >
      <motion.div
        className="flex h-full items-end"
        style={{ x, rotate, transformOrigin: side === "left" ? "90% 100%" : "10% 100%" }}
      >
        <svg
          width="440"
          height="720"
          viewBox="0 0 520 800"
          className={side === "right" ? "-scale-x-100" : undefined}
        >
          <defs>
            <radialGradient id={gradId} cx="32%" cy="28%" r="75%">
              <stop offset="0%" stopColor="#7c8968" />
              <stop offset="55%" stopColor="#4c5a41" />
              <stop offset="100%" stopColor="#2e3a29" />
            </radialGradient>
          </defs>
          {/* Tronc */}
          <path d="M234,650 L286,650 L296,796 L224,796 Z" fill="#7a5c3e" />
          {/* Couronne : plusieurs masses organiques superposées, jamais une pointe unique */}
          <circle cx="260" cy="340" r="230" fill={`url(#${gradId})`} />
          <circle cx="120" cy="300" r="150" fill={`url(#${gradId})`} />
          <circle cx="400" cy="300" r="150" fill={`url(#${gradId})`} />
          <circle cx="160" cy="480" r="165" fill={`url(#${gradId})`} />
          <circle cx="360" cy="480" r="165" fill={`url(#${gradId})`} />
          <circle cx="260" cy="150" r="135" fill={`url(#${gradId})`} />
          <circle cx="260" cy="560" r="175" fill={`url(#${gradId})`} />
        </svg>
      </motion.div>
    </div>
  );
}

export default function GammesPreview() {
  const prefersReducedMotion = useReducedMotion();
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    setIsDesktop(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  /**
   * Le rideau (arbres + lueur + révélation du titre et des cartes au
   * scroll) n'est activé qu'en desktop, sans `prefers-reduced-motion` —
   * sur mobile ou en accessibilité réduite, on retombe sur l'ancienne
   * animation `whileInView` (déjà éprouvée, plus simple et moins
   * coûteuse) plutôt qu'une version amoindrie du nouveau mécanisme.
   */
  const canAnimateCurtain = isDesktop && !prefersReducedMotion;

  const sectionRef = useRef<HTMLDivElement>(null);
  /* Ancrage sur le CENTRE du bloc (titre + arbres + cartes), pas sur son
     bord "start" : le bloc est devenu bien plus haut avec les arbres
     massifs qui remontent jusqu'au-dessus du titre, donc un ancrage
     "start" le laissait presque entièrement hors-écran pendant tout le
     palier de repos (le "fermé" n'était jamais réellement visible). En
     suivant le centre, une bonne partie du bloc est déjà visible dès
     progress=0, ce qui donne enfin un vrai état "fermé" à l'écran avant
     l'ouverture. */
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["center 0.85", "center 0.2"],
  });

  /* Palier de repos (0 → HOLD) : rien ne bouge le temps que le bloc
     finisse d'entrer dans le viewport, pour que l'état "arbres fermés"
     soit réellement vu avant de commencer à s'ouvrir. */
  const HOLD = 0.12;
  const TREE_END = 0.85;

  // Arbres : rideau de théâtre — écart large vers l'extérieur, légère
  // rotation pour éviter l'effet "élément d'interface". `x` est un
  // pourcentage de la largeur propre de l'arbre (donc une distance en
  // pixels bien plus grande maintenant qu'il est massif).
  const leftX = useTransform(scrollYProgress, [0, HOLD, TREE_END], ["0%", "0%", "-115%"]);
  const leftRotate = useTransform(scrollYProgress, [0, HOLD, TREE_END], [0, 0, -4]);

  const rightX = useTransform(scrollYProgress, [0, HOLD, TREE_END], ["0%", "0%", "115%"]);
  const rightRotate = useTransform(scrollYProgress, [0, HOLD, TREE_END], [0, 0, 4]);

  // Lueur centrale très discrète, révélée dans l'entrebâillement — le
  // dégradé lui-même reste à faible alpha (voir plus bas).
  const glowOpacity = useTransform(scrollYProgress, [HOLD, HOLD + 0.35], [0, 1]);

  // Titre : révélé tôt dans l'ouverture, avant les cartes.
  const titleOpacity = useTransform(scrollYProgress, [HOLD, HOLD + 0.22], [0, 1]);
  const titleY = useTransform(scrollYProgress, [HOLD, HOLD + 0.22], [16, 0]);

  // Cartes : révélées une fois les arbres bien engagés dans leur
  // ouverture, écart de stagger volontairement faible (0.03 de
  // progression entre chaque), flou court et léger.
  const card0Opacity = useTransform(scrollYProgress, [0.49, 0.71], [0, 1]);
  const card0Y = useTransform(scrollYProgress, [0.49, 0.71], [26, 0]);
  const card0BlurPx = useTransform(scrollYProgress, [0.49, 0.57], [6, 0]);
  const card0Filter = useMotionTemplate`blur(${card0BlurPx}px)`;

  const card1Opacity = useTransform(scrollYProgress, [0.52, 0.74], [0, 1]);
  const card1Y = useTransform(scrollYProgress, [0.52, 0.74], [26, 0]);
  const card1BlurPx = useTransform(scrollYProgress, [0.52, 0.6], [6, 0]);
  const card1Filter = useMotionTemplate`blur(${card1BlurPx}px)`;

  const card2Opacity = useTransform(scrollYProgress, [0.55, 0.77], [0, 1]);
  const card2Y = useTransform(scrollYProgress, [0.55, 0.77], [26, 0]);
  const card2BlurPx = useTransform(scrollYProgress, [0.55, 0.63], [6, 0]);
  const card2Filter = useMotionTemplate`blur(${card2BlurPx}px)`;

  const curtainCardStyle = [
    { opacity: card0Opacity, y: card0Y, filter: card0Filter },
    { opacity: card1Opacity, y: card1Y, filter: card1Filter },
    { opacity: card2Opacity, y: card2Y, filter: card2Filter },
  ];

  return (
    <section id="gammes" className="relative overflow-hidden bg-ciel px-6 py-28">
      <div className="relative mx-auto max-w-6xl">
        <div ref={sectionRef} className="relative">
          <motion.div style={canAnimateCurtain ? { opacity: titleOpacity, y: titleY } : undefined}>
            <p className="eyebrow text-xs text-encre-douce">Nos gammes</p>
            <h2 className="mt-4 max-w-2xl text-4xl font-semibold text-encre sm:text-5xl">
              Trois gammes pour trois exigences.
            </h2>
          </motion.div>

          <div className="relative mt-16">
            {canAnimateCurtain && (
              <>
                <motion.div
                  aria-hidden
                  className="pointer-events-none absolute inset-0 z-0 flex items-center justify-center"
                  style={{ opacity: glowOpacity }}
                >
                  <div
                    className="h-[70%] w-[55%] rounded-full"
                    style={{
                      background:
                        "radial-gradient(closest-side, rgba(173,138,85,0.12) 0%, rgba(173,138,85,0.05) 55%, transparent 75%)",
                    }}
                  />
                </motion.div>

                <div className="pointer-events-none absolute -top-16 bottom-0 left-0 right-0 z-10">
                  <div className="relative mx-auto h-full max-w-6xl">
                    <BigTree side="left" x={leftX} rotate={leftRotate} />
                    <BigTree side="right" x={rightX} rotate={rightRotate} />
                  </div>
                </div>
              </>
            )}

            <div className="relative z-[1] grid gap-6 md:grid-cols-3">
              {GAMMES.map((gamme, i) => (
                <motion.div
                  key={gamme.href}
                  {...(canAnimateCurtain
                    ? { style: curtainCardStyle[i] }
                    : {
                        initial: { opacity: 0, y: 32 },
                        whileInView: { opacity: 1, y: 0 },
                        viewport: { once: true, margin: "-80px" },
                        transition: { duration: 0.6, delay: i * 0.12, ease: "easeOut" },
                      })}
                >
                  <TiltCard strength={2.5}>
                    <Link href={gamme.href} className="group relative block">
                      <div className="relative h-96 overflow-hidden rounded-2xl shadow-[0_20px_40px_-12px_rgba(26,22,20,0.25)] transition-transform duration-500 group-hover:-translate-y-1">
                        <Image
                          src={gamme.imageUrl}
                          alt={`Maison Bellora, gamme ${gamme.name}`}
                          fill
                          sizes="(min-width: 768px) 33vw, 100vw"
                          className="object-cover transition-transform duration-700 ease-out group-hover:scale-110"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-encre/85 via-encre/20 to-transparent" />

                        <span className="glass gamme-badge absolute left-5 top-5 flex items-center overflow-hidden rounded-full px-4 py-1.5 text-xs font-semibold text-laiton">
                          <SparkleIcon />
                          {gamme.name}
                        </span>

                        <div className="absolute inset-x-0 bottom-0 p-6">
                          {/* Fiche technique réelle plutôt qu'un décor abstrait
                              (ombres de plantes jugées gratuites, sans intérêt) :
                              les deux équipements qui distinguent le plus
                              concrètement cette gamme des deux autres, révélés
                              au survol — une vraie plus-value informative, pas
                              juste une animation. */}
                          <div className="mb-3 flex max-h-0 flex-wrap gap-1.5 overflow-hidden opacity-0 transition-all duration-500 ease-out group-hover:max-h-16 group-hover:opacity-100 group-focus-within:max-h-16 group-focus-within:opacity-100">
                            {gamme.highlights.map((highlight) => (
                              <GlassPanel
                                key={highlight}
                                tone="dark"
                                rounded="rounded-full"
                                className="px-2.5 py-1 text-[11px] font-medium text-brume"
                              >
                                {highlight}
                              </GlassPanel>
                            ))}
                          </div>
                          <p className="text-sm text-brume/85">
                            {gamme.cardTagline}
                          </p>
                          <p className="mt-2 text-sm font-medium text-brume">
                            {gamme.fromPrice}
                          </p>
                          <p className="eyebrow mt-3 text-xs text-laiton">
                            Découvrir →
                          </p>
                        </div>
                      </div>
                    </Link>
                  </TiltCard>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
