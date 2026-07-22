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

/**
 * Vidéo Seedance (Higgsfield) : caméra prisonnière d'un feuillage de
 * chêne dense, avance et écarte physiquement les branches — pas de
 * fondu, pas de morphing, uniquement le contact de la caméra qui pousse
 * le feuillage — jusqu'à révéler un fond ivoire uni. Remplace le rideau
 * d'arbres (jugé "cheap" en photo découpée) : ici le scroll pilote
 * l'avancée de la caméra elle-même via `currentTime`, puis un fondu
 * classique prend le relais pour révéler le titre et les cartes une
 * fois les branches complètement écartées.
 */
const VIDEO_URL =
  "https://d8j0ntlcm91z4.cloudfront.net/user_3AOufDgdu5BZqUoyRdkQOitlUqQ/hf_20260722_134720_8a26fbc3-1c84-4982-af0e-b7345f8d7bea.mp4";
// La première seconde est un plan de départ peu intéressant (demande
// explicite : "commence la vidéo à 1 sec pas du début") ; la vidéo dure
// 4s au total, donc le scroll ne pilote que les 3 secondes utiles.
const VIDEO_START_TIME = 1;
const VIDEO_DURATION = 4;

function GammesScrollVideo({
  videoTime,
  filter,
}: {
  videoTime: ReturnType<typeof useTransform<number, number>>;
  filter: ReturnType<typeof useMotionTemplate>;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const readyRef = useRef(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const onLoaded = () => {
      readyRef.current = true;
      video.currentTime = VIDEO_START_TIME;
    };
    video.addEventListener("loadedmetadata", onLoaded);

    // Boucle rAF plutôt qu'un `.on("change", ...)` direct : `currentTime`
    // ne doit être écrit qu'une fois par frame peinte, jamais plus (une
    // vidéo de 3s utiles n'a pas besoin du cache/canvas construit pour la
    // vidéo Hero, beaucoup plus longue — un seek direct suffit ici).
    let raf = 0;
    const tick = () => {
      if (readyRef.current && !video.seeking) {
        const target = videoTime.get();
        if (Math.abs(video.currentTime - target) > 0.02) {
          video.currentTime = target;
        }
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      video.removeEventListener("loadedmetadata", onLoaded);
      cancelAnimationFrame(raf);
    };
  }, [videoTime]);

  return (
    // Sort du padding horizontal des conteneurs ancêtres (section / bloc
    // `sticky`) pour couvrir la largeur réelle du viewport, bord à
    // bord — un simple `inset-0` resterait cantonné à l'intérieur de ce
    // padding (déjà vérifié à l'écran sur le fond photo précédent).
    <motion.div
      aria-hidden
      initial={false}
      className="pointer-events-none absolute inset-y-0 left-1/2 z-10 w-screen -translate-x-1/2"
      style={{ filter }}
    >
      <video
        ref={videoRef}
        src={VIDEO_URL}
        muted
        playsInline
        preload="auto"
        className="h-full w-full object-cover"
      />
    </motion.div>
  );
}

/* Durée totale de l'écran épinglé : volontairement courte (pas de
   scroll bloqué sur une distance énorme, demande explicite du client) —
   ~1,2 hauteur d'écran de défilement supplémentaire pendant laquelle la
   scène reste figée à l'écran et le scroll ne pilote plus que l'avancée
   de la vidéo puis l'apparition du titre/des cartes. */
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

  // Répartition : 0–35 % la vidéo avance (caméra qui écarte les
  // branches, `currentTime` piloté par le scroll), 32–48 % fondu de la
  // vidéo vers le contenu ("fondu fin de vidéo"), 40–72 % apparition du
  // titre puis des cartes ("apparition des offres"), le reste en état
  // final maintenu (obtenu naturellement : au-delà du dernier point de
  // chaque courbe, la valeur reste figée).
  const videoTime = useTransform(
    scrollYProgress,
    [0, 0.35],
    [VIDEO_START_TIME, VIDEO_DURATION]
  );
  const videoOpacityPct = useTransform(scrollYProgress, [0.32, 0.48], [100, 0]);
  const videoFilter = useMotionTemplate`opacity(${videoOpacityPct}%)`;

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
    chaque `motion.div` concerné (vidéo, titre, cartes), qui empêche ce
    résidu de s'installer.
  */
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
          {/* En mode rideau, la vidéo vit à l'intérieur du bloc
              `sticky` (pleine largeur avant la colonne centrée) : elle
              reste ainsi parfaitement figée avec le titre et les cartes
              pendant toute la durée de l'écran épinglé, plutôt que de
              défiler derrière un contenu fixe si on la plaçait au
              niveau de la section (même piège que le décor précédent,
              déjà rencontré et corrigé). */}
          {canAnimateCurtain && <GammesScrollVideo videoTime={videoTime} filter={videoFilter} />}

          <div className={canAnimateCurtain ? "relative z-[1] mx-auto w-full max-w-6xl" : "relative z-[1]"}>
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
