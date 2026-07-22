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
 * Rideau d'arbres — silhouette unique en SVG (un seul path, dégradé
 * bicolore pour une suggestion de volume "presque sculptural"), tracée
 * une fois et reprise en miroir (`-scale-x-100`) pour le côté droit
 * plutôt que dessinée deux fois. `x`/`y`/`rotate` sont des `MotionValue`
 * partagées avec la progression de scroll de la section — jamais de
 * `useState` ni de re-render React par pixel scrollé.
 */
function CurtainTree({
  side,
  x,
  y,
  rotate,
}: {
  side: "left" | "right";
  x: ReturnType<typeof useTransform<number, string>>;
  y: ReturnType<typeof useTransform<number, number>>;
  rotate: ReturnType<typeof useTransform<number, number>>;
}) {
  return (
    <motion.div
      aria-hidden
      className={`pointer-events-none absolute inset-y-0 z-10 hidden items-center md:flex ${
        side === "left" ? "left-[-70px] origin-bottom-left" : "right-[-70px] origin-bottom-right"
      }`}
      style={{ x, y, rotate }}
    >
      <svg
        width="150"
        height="600"
        viewBox="0 0 160 640"
        className={side === "right" ? "-scale-x-100" : undefined}
      >
        <defs>
          <linearGradient id={`gammes-tree-grad-${side}`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#33402c" />
            <stop offset="100%" stopColor="#7c8968" />
          </linearGradient>
        </defs>
        <path
          d="M80,0 C90,140 98,280 102,420 C106,480 108,540 106,600 C104,620 96,630 90,638 L70,638 C64,630 56,620 54,600 C52,540 54,480 58,420 C62,280 70,140 80,0 Z"
          fill={`url(#gammes-tree-grad-${side})`}
        />
      </svg>
    </motion.div>
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
   * Le rideau (arbres + lueur + révélation des cartes au scroll) n'est
   * activé qu'en desktop, sans `prefers-reduced-motion` — sur mobile ou
   * en accessibilité réduite, on retombe sur l'ancienne animation
   * `whileInView` (déjà éprouvée, plus simple et moins coûteuse) plutôt
   * qu'une version amoindrie du nouveau mécanisme : "préfère une version
   * simplifiée plutôt que de forcer exactement la même animation si cela
   * nuit à la lisibilité ou aux performances" (demande explicite).
   */
  const canAnimateCurtain = isDesktop && !prefersReducedMotion;

  const sectionRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start 0.9", "start 0.15"],
  });

  /* Palier de repos (0 → HOLD) : rien ne bouge pendant que la section
     finit d'entrer dans le viewport. Sans ce palier, la progression 0
     (arbres fermés) correspond à un instant où le paquet arbres+cartes
     n'est encore visible qu'à peine, sous le bord inférieur de l'écran —
     l'utilisateur ne voit donc jamais réellement le "passage fermé"
     avant qu'il ne commence déjà à s'ouvrir. Bug trouvé à l'écran en
     comparant la position de restitution réelle (via `getBoundingClientRect`
     du conteneur) à la fenêtre `useScroll`, pas en le devinant. */
  const HOLD = 0.16;
  const TREE_END = 0.86;
  const TREE_MID = (HOLD + TREE_END) / 2;

  // Arbres : sortie ample (jusqu'à quasi hors-cadre) mais pas parfaitement
  // horizontale — une légère rotation et un très léger flottement vertical
  // non-linéaire (quatre points de passage) pour éviter l'effet "élément
  // d'interface".
  const leftX = useTransform(scrollYProgress, [0, HOLD, TREE_END], ["0%", "0%", "-125%"]);
  const leftRotate = useTransform(scrollYProgress, [0, HOLD, TREE_END], [0, 0, -6]);
  const leftY = useTransform(scrollYProgress, [0, HOLD, TREE_MID, TREE_END], [0, 0, -9, -16]);

  const rightX = useTransform(scrollYProgress, [0, HOLD, TREE_END], ["0%", "0%", "125%"]);
  const rightRotate = useTransform(scrollYProgress, [0, HOLD, TREE_END], [0, 0, 6]);
  const rightY = useTransform(scrollYProgress, [0, HOLD, TREE_MID, TREE_END], [0, 0, 7, 13]);

  // Lueur centrale très discrète — le dégradé lui-même reste à faible
  // alpha (voir plus bas), `glowOpacity` ne fait que la faire apparaître
  // progressivement, jamais un halo net ni un effet "spot".
  const glowOpacity = useTransform(scrollYProgress, [HOLD, HOLD + 0.3], [0, 1]);

  // Cartes : révélées seulement une fois les arbres bien engagés dans leur
  // ouverture (jamais avant HOLD), écart de stagger volontairement faible
  // (0.03 de progression entre chaque), flou court (résolu dans le
  // premier tiers de la fenêtre de chaque carte) pour rester net plutôt
  // que "mou".
  const card0Opacity = useTransform(scrollYProgress, [0.52, 0.74], [0, 1]);
  const card0Y = useTransform(scrollYProgress, [0.52, 0.74], [26, 0]);
  const card0BlurPx = useTransform(scrollYProgress, [0.52, 0.6], [6, 0]);
  const card0Filter = useMotionTemplate`blur(${card0BlurPx}px)`;

  const card1Opacity = useTransform(scrollYProgress, [0.55, 0.77], [0, 1]);
  const card1Y = useTransform(scrollYProgress, [0.55, 0.77], [26, 0]);
  const card1BlurPx = useTransform(scrollYProgress, [0.55, 0.63], [6, 0]);
  const card1Filter = useMotionTemplate`blur(${card1BlurPx}px)`;

  const card2Opacity = useTransform(scrollYProgress, [0.58, 0.8], [0, 1]);
  const card2Y = useTransform(scrollYProgress, [0.58, 0.8], [26, 0]);
  const card2BlurPx = useTransform(scrollYProgress, [0.58, 0.66], [6, 0]);
  const card2Filter = useMotionTemplate`blur(${card2BlurPx}px)`;

  const curtainCardStyle = [
    { opacity: card0Opacity, y: card0Y, filter: card0Filter },
    { opacity: card1Opacity, y: card1Y, filter: card1Filter },
    { opacity: card2Opacity, y: card2Y, filter: card2Filter },
  ];

  return (
    <section id="gammes" className="relative overflow-hidden bg-ciel px-6 py-28">
      <div className="relative mx-auto max-w-6xl">
        <p className="eyebrow text-xs text-encre-douce">Nos gammes</p>
        <h2 className="mt-4 max-w-2xl text-4xl font-semibold text-encre sm:text-5xl">
          Trois gammes pour trois exigences.
        </h2>

        <div ref={sectionRef} className="relative mt-16">
          {canAnimateCurtain && (
            <>
              <CurtainTree side="left" x={leftX} y={leftY} rotate={leftRotate} />
              <CurtainTree side="right" x={rightX} y={rightY} rotate={rightRotate} />
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
    </section>
  );
}
