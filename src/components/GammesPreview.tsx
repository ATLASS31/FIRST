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
import { GAMMES, type Gamme } from "@/lib/gammes";

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
 * Contenu de carte inchangé, extrait en composant à part pour être
 * partagé tel quel entre la mise en scène "rideau épinglé" (desktop) et
 * le repli simple (mobile / `prefers-reduced-motion`) — un seul JSX, pas
 * deux copies qui pourraient diverger.
 */
function GammeCard({ gamme }: { gamme: Gamme }) {
  return (
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
            <p className="text-sm text-brume/85">{gamme.cardTagline}</p>
            <p className="mt-2 text-sm font-medium text-brume">{gamme.fromPrice}</p>
            <p className="eyebrow mt-3 text-xs text-laiton">Découvrir →</p>
          </div>
        </div>
      </Link>
    </TiltCard>
  );
}

/** Hash déterministe (même sortie serveur/client) — pas de Math.random. */
function seededRandom(seed: number) {
  const x = Math.sin(seed * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}

/**
 * Silhouette de feuillage organique : un contour fermé irrégulier
 * (Catmull-Rom → Bézier autour d'un cercle de base bruité), pas un
 * cercle parfait — c'est ce qui distingue une "masse de feuillage" d'une
 * simple boule. `seed` fait varier la silhouette d'un amas à l'autre et
 * d'un arbre à l'autre sans jamais se répéter à l'identique.
 */
function blobPath(cx: number, cy: number, r: number, seed: number, irregularity = 0.26, points = 9) {
  const pts: [number, number][] = [];
  for (let i = 0; i < points; i++) {
    const angle = (i / points) * Math.PI * 2;
    const rand = seededRandom(seed + i * 7.31);
    const radius = r * (1 - irregularity / 2 + rand * irregularity);
    pts.push([cx + Math.cos(angle) * radius, cy + Math.sin(angle) * radius]);
  }
  const n = pts.length;
  const d: string[] = [];
  for (let i = 0; i < n; i++) {
    const p0 = pts[(i - 1 + n) % n];
    const p1 = pts[i];
    const p2 = pts[(i + 1) % n];
    const p3 = pts[(i + 2) % n];
    const c1x = p1[0] + (p2[0] - p0[0]) / 6;
    const c1y = p1[1] + (p2[1] - p0[1]) / 6;
    const c2x = p2[0] - (p3[0] - p1[0]) / 6;
    const c2y = p2[1] - (p3[1] - p1[1]) / 6;
    if (i === 0) d.push(`M${p1[0].toFixed(1)},${p1[1].toFixed(1)}`);
    d.push(`C${c1x.toFixed(1)},${c1y.toFixed(1)} ${c2x.toFixed(1)},${c2y.toFixed(1)} ${p2[0].toFixed(1)},${p2[1].toFixed(1)}`);
  }
  d.push("Z");
  return d.join(" ");
}

type Blob = { cx: number; cy: number; r: number; seed: number };

/**
 * Deux silhouettes entièrement distinctes (pas une simple symétrie
 * miroir de la même géométrie) : nombre d'amas, tailles, hauteur de
 * couronne et courbure du tronc diffèrent volontairement d'un côté à
 * l'autre, comme deux arbres réels d'une même clairière plutôt que deux
 * copies retournées.
 */
const LEFT_BLOBS: Blob[] = [
  { cx: 250, cy: 300, r: 148, seed: 11 },
  { cx: 118, cy: 255, r: 104, seed: 23 },
  { cx: 372, cy: 235, r: 92, seed: 37 },
  { cx: 148, cy: 425, r: 118, seed: 51 },
  { cx: 342, cy: 445, r: 128, seed: 64 },
  { cx: 252, cy: 135, r: 88, seed: 78 },
  { cx: 228, cy: 525, r: 108, seed: 92 },
];

const RIGHT_BLOBS: Blob[] = [
  { cx: 292, cy: 262, r: 138, seed: 14 },
  { cx: 412, cy: 302, r: 98, seed: 28 },
  { cx: 172, cy: 282, r: 88, seed: 41 },
  { cx: 330, cy: 442, r: 132, seed: 56 },
  { cx: 152, cy: 412, r: 92, seed: 69 },
  { cx: 292, cy: 112, r: 82, seed: 83 },
  { cx: 300, cy: 542, r: 112, seed: 97 },
  { cx: 202, cy: 182, r: 66, seed: 105 },
];

const LEFT_BRANCHES = [
  "M265,635 C220,560 160,480 118,428",
  "M265,635 C302,538 342,458 372,388",
  "M265,635 C253,518 233,418 208,338",
];

const RIGHT_BRANCHES = [
  "M255,635 C302,553 352,468 402,408",
  "M255,635 C208,543 173,453 148,378",
  "M255,635 C260,528 277,428 302,338",
];

const LEFT_TRUNK =
  "M243,635 C238,660 236,700 240,735 C242,755 238,775 232,796 L300,796 C294,775 290,755 292,735 C296,700 294,660 289,635 C275,624 257,624 243,635 Z";

const RIGHT_TRUNK =
  "M232,796 C226,775 222,755 226,735 C230,700 228,660 234,635 C247,624 264,624 277,635 C283,660 281,700 285,735 C289,755 285,775 279,796 Z";

function BigTree({
  side,
  x,
  rotate,
}: {
  side: "left" | "right";
  x: ReturnType<typeof useTransform<number, string>>;
  rotate: ReturnType<typeof useTransform<number, number>>;
}) {
  const blobs = side === "left" ? LEFT_BLOBS : RIGHT_BLOBS;
  const branches = side === "left" ? LEFT_BRANCHES : RIGHT_BRANCHES;
  const trunkPath = side === "left" ? LEFT_TRUNK : RIGHT_TRUNK;
  const gradA = `gammes-bigtree-${side}-a`;
  const gradB = `gammes-bigtree-${side}-b`;
  const trunkGrad = `gammes-bigtree-${side}-trunk`;

  return (
    <div
      aria-hidden
      className={`pointer-events-none absolute -top-16 bottom-0 z-10 hidden w-[58%] md:flex ${
        side === "left" ? "left-0 justify-end" : "right-0 justify-start"
      }`}
    >
      <motion.div
        className="flex h-full items-end"
        style={{ x, rotate, transformOrigin: side === "left" ? "88% 100%" : "12% 100%" }}
      >
        <svg width="440" height="720" viewBox="0 0 520 800">
          <defs>
            <radialGradient id={gradA} cx="34%" cy="26%" r="78%">
              <stop offset="0%" stopColor="#8a9a72" />
              <stop offset="55%" stopColor="#51603f" />
              <stop offset="100%" stopColor="#2e3a29" />
            </radialGradient>
            <radialGradient id={gradB} cx="30%" cy="24%" r="80%">
              <stop offset="0%" stopColor="#6f7f5c" />
              <stop offset="55%" stopColor="#414f36" />
              <stop offset="100%" stopColor="#242f1f" />
            </radialGradient>
            <linearGradient id={trunkGrad} x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#5b4632" />
              <stop offset="45%" stopColor="#7a5c3e" />
              <stop offset="100%" stopColor="#4a3826" />
            </linearGradient>
          </defs>

          {/* Tronc, légèrement galbé plutôt qu'un trapèze droit */}
          <path d={trunkPath} fill={`url(#${trunkGrad})`} />

          {/* Branches suggérées, dessinées sous le feuillage : elles ne
              se devinent que dans les interstices entre les amas. */}
          {branches.map((d, i) => (
            <path
              key={i}
              d={d}
              fill="none"
              stroke="#4a3d2a"
              strokeWidth={5 - i}
              strokeLinecap="round"
              opacity={0.5}
            />
          ))}

          {/* Couronne : amas foliaires irréguliers superposés, tons
              alternés pour suggérer la profondeur plutôt qu'une teinte
              plate unique. */}
          {blobs.map((b, i) => (
            <path
              key={b.seed}
              d={blobPath(b.cx, b.cy, b.r, b.seed)}
              fill={`url(#${i % 2 === 0 ? gradA : gradB})`}
              opacity={0.94 + seededRandom(b.seed) * 0.06}
            />
          ))}
        </svg>
      </motion.div>
    </div>
  );
}

/* Durée totale de l'écran épinglé : volontairement courte (pas de
   scroll bloqué sur une distance énorme, demande explicite du client) —
   ~1,2 hauteur d'écran de défilement supplémentaire pendant laquelle la
   scène reste figée à l'écran et le scroll ne pilote plus que
   l'ouverture des arbres et l'apparition du titre/des cartes. */
const PIN_VH = 220;

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
   * Le rideau épinglé (arbres + lueur + révélation du titre et des
   * cartes) n'est activé qu'en desktop, sans `prefers-reduced-motion` —
   * sur mobile ou en accessibilité réduite, on retombe sur l'ancienne
   * animation `whileInView` (déjà éprouvée, plus simple et moins
   * coûteuse, et surtout sans écran épinglé sur un petit viewport).
   */
  const canAnimateCurtain = isDesktop && !prefersReducedMotion;

  const pinRef = useRef<HTMLDivElement>(null);
  /* Technique d'écran épinglé : `pinRef` est un conteneur plus haut que
     le viewport ; l'enfant `sticky top-0 h-screen` reste figé à l'écran
     tant que `pinRef` traverse le viewport. `useScroll` avec
     `["start start", "end end"]` traduit exactement cette traversée en
     progression 0→1 — c'est la mécanique "section bloquée pendant que le
     scroll pilote l'animation" demandée explicitement par le client. */
  const { scrollYProgress } = useScroll({
    target: pinRef,
    offset: ["start start", "end end"],
  });

  // Répartition verrouillée avec le client : 0–45 % ouverture des
  // arbres, 30–75 % apparition du titre puis des cartes, 75–100 % état
  // final maintenu (obtenu naturellement : au-delà du dernier point de
  // chaque courbe, la valeur reste figée).
  const leftX = useTransform(scrollYProgress, [0, 0.45], ["0%", "-135%"]);
  const leftRotate = useTransform(scrollYProgress, [0, 0.45], [0, -5]);

  const rightX = useTransform(scrollYProgress, [0, 0.45], ["0%", "135%"]);
  const rightRotate = useTransform(scrollYProgress, [0, 0.45], [0, 5]);

  /*
    Écran épinglé (`position: sticky`) + `opacity` en `style` direct : le
    style écrit par Framer Motion se fige de façon non déterministe
    (confirmé par une lecture directe du DOM sur des dizaines d'essais —
    tantôt correct, tantôt bloqué sur une valeur périmée), alors que
    `transform` et `filter`, sur ces mêmes éléments, se mettent à jour
    sans faute à chaque frame. Plutôt que de risquer un fondu cassé de
    façon aléatoire en production, tout fondu passe par
    `filter: opacity(N%)` (combiné avec le flou existant pour les
    cartes) au lieu de la propriété `opacity` — même résultat visuel,
    mécanisme fiable.

    Corollaire piégeux, repéré à l'écran (une carte restait invisible en
    permanence même en fin d'ouverture) : les éléments qui ont DÉJÀ eu un
    `initial={{opacity: ...}}` explicite dans une passe de rendu (les
    cartes, dont le repli mobile/reduced-motion utilise
    `initial={{opacity:0,y:32}}`) gardent cette opacité comme valeur
    CSS figée même après être repassés en mode `style` pur, où
    `opacity` ne fait plus partie de l'objet — Framer ne la "libère"
    jamais. D'où `initial={false}` explicite sur la branche rideau de
    chaque `motion.div` concerné (titre, lueur, cartes), qui empêche
    ce résidu de s'installer.
  */
  const glowOpacityPct = useTransform(scrollYProgress, [0.05, 0.3, 0.55, 0.75], [0, 100, 60, 35]);
  const glowFilter = useMotionTemplate`opacity(${glowOpacityPct}%)`;

  const titleOpacityPct = useTransform(scrollYProgress, [0.3, 0.5], [0, 100]);
  const titleY = useTransform(scrollYProgress, [0.3, 0.5], [16, 0]);
  const titleFilter = useMotionTemplate`opacity(${titleOpacityPct}%)`;

  const card0OpacityPct = useTransform(scrollYProgress, [0.4, 0.63], [0, 100]);
  const card0Y = useTransform(scrollYProgress, [0.4, 0.63], [26, 0]);
  const card0BlurPx = useTransform(scrollYProgress, [0.4, 0.48], [6, 0]);
  const card0Filter = useMotionTemplate`opacity(${card0OpacityPct}%) blur(${card0BlurPx}px)`;

  const card1OpacityPct = useTransform(scrollYProgress, [0.44, 0.67], [0, 100]);
  const card1Y = useTransform(scrollYProgress, [0.44, 0.67], [26, 0]);
  const card1BlurPx = useTransform(scrollYProgress, [0.44, 0.52], [6, 0]);
  const card1Filter = useMotionTemplate`opacity(${card1OpacityPct}%) blur(${card1BlurPx}px)`;

  const card2OpacityPct = useTransform(scrollYProgress, [0.48, 0.71], [0, 100]);
  const card2Y = useTransform(scrollYProgress, [0.48, 0.71], [26, 0]);
  const card2BlurPx = useTransform(scrollYProgress, [0.48, 0.56], [6, 0]);
  const card2Filter = useMotionTemplate`opacity(${card2OpacityPct}%) blur(${card2BlurPx}px)`;

  const curtainCardStyle = [
    { y: card0Y, filter: card0Filter },
    { y: card1Y, filter: card1Filter },
    { y: card2Y, filter: card2Filter },
  ];

  return (
    <section id="gammes" className="relative bg-ciel px-6 py-28">
      {/*
        Le conteneur ciblé par `useScroll` (et son enfant `sticky`) reste
        TOUJOURS monté, y compris sur mobile / reduced-motion / avant
        hydratation — seuls son style et son contenu changent selon
        `canAnimateCurtain`. Le rendre conditionnel entièrement (comme
        dans un essai précédent) fait que le ref n'existe pas encore au
        premier rendu (isDesktop démarre à `false`), et `useScroll`
        s'accroche dans le vide ("Target ref is defined but not
        hydrated") : la progression de scroll ne reflète alors plus rien
        de réel. Garder le nœud stable évite ce piège.
      */}
      <div
        ref={pinRef}
        className="relative"
        style={canAnimateCurtain ? { height: `${PIN_VH}vh` } : undefined}
      >
        <div
          className={
            canAnimateCurtain
              ? "sticky top-0 flex h-screen flex-col items-center justify-center overflow-hidden px-6 py-8"
              : "relative mx-auto max-w-6xl"
          }
        >
          <div className={canAnimateCurtain ? "relative mx-auto w-full max-w-6xl" : undefined}>
            <motion.div
              initial={false}
              {...(canAnimateCurtain ? { style: { filter: titleFilter, y: titleY } } : {})}
            >
              <p className="eyebrow text-xs text-encre-douce">Nos gammes</p>
              <h2 className="mt-4 max-w-2xl text-4xl font-semibold text-encre sm:text-5xl">
                Trois gammes pour trois exigences.
              </h2>
            </motion.div>

            <div className={canAnimateCurtain ? "relative mt-8 md:mt-10" : "relative z-[1] mt-16"}>
              {canAnimateCurtain && (
                <>
                  <motion.div
                    aria-hidden
                    initial={false}
                    className="pointer-events-none absolute inset-0 z-0 flex items-center justify-center"
                    style={{ filter: glowFilter }}
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
                      ? { style: curtainCardStyle[i], initial: false }
                      : {
                          initial: { filter: "opacity(0%)", y: 32 },
                          whileInView: { filter: "opacity(100%)", y: 0 },
                          viewport: { once: true, margin: "-80px" },
                          transition: { duration: 0.6, delay: i * 0.12, ease: "easeOut" },
                        })}
                  >
                    <GammeCard gamme={gamme} />
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
