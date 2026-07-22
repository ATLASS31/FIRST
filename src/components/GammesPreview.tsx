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
 * Vraie photo d'arbre (rendu Higgsfield, validé par le client — la
 * silhouette générée en SVG jugée "cheap") plutôt qu'une illustration
 * dessinée : tronc et branches détaillés, feuillage doré côté lumière /
 * vert plus frais côté ombre, déjà détouré sur fond transparent. Le même
 * fichier sert aux deux arbres — l'arbre droit est simplement retourné
 * horizontalement (`-scale-x-100` sur l'image, indépendant du
 * `x`/`rotate` du rideau porté par le `motion.div` parent) pour éviter
 * de dupliquer un second rendu coûteux tout en gardant une composition
 * symétrique cohérente.
 */
const TREE_IMAGE_URL =
  "https://d8j0ntlcm91z4.cloudfront.net/user_3AOufDgdu5BZqUoyRdkQOitlUqQ/hf_20260722_124202_96128beb-5f45-4e42-afcb-2a9c89f15840.png";

/**
 * Retour client sur la première intégration photo : deux arbres découpés
 * posés sur l'aplat `bg-ciel` lisaient comme des autocollants ("cheap"),
 * sans aucune cohérence de lumière avec la page. Un décor photographique
 * (clairière floutée, lumière chaude, profondeur de champ) sert
 * maintenant de fond plein cadre à toute la section — arbres nets du
 * rideau au premier plan, arrière-plan flou déjà présent dans la photo
 * en second plan — pour que l'ensemble se lise comme un seul
 * environnement réel plutôt qu'un montage de calques plats.
 */
const BACKGROUND_IMAGE_URL =
  "https://d8j0ntlcm91z4.cloudfront.net/user_3AOufDgdu5BZqUoyRdkQOitlUqQ/hf_20260722_125907_5030b562-6cce-4501-a236-542235068c8d.png";

/** Photo plein cadre + voile de lisibilité — extrait pour être posé au
 * bon endroit selon le mode (voir les deux points d'usage plus bas). */
function GammesBackground() {
  return (
    // Sort du padding horizontal des conteneurs ancêtres (section / bloc
    // `sticky`) pour couvrir la largeur réelle du viewport, bord à
    // bord — un simple `inset-0` resterait cantonné à l'intérieur de ce
    // padding (vérifié à l'écran : ~24px de bande visible de chaque
    // côté sinon), très loin du plein cadre demandé.
    <div className="pointer-events-none absolute inset-y-0 left-1/2 z-0 w-screen -translate-x-1/2">
      <Image src={BACKGROUND_IMAGE_URL} alt="" fill sizes="100vw" className="object-cover" />
      <div className="absolute inset-0 bg-gradient-to-b from-brume/55 via-brume/10 to-brume/45" />
    </div>
  );
}

function BigTree({
  side,
  x,
  rotate,
}: {
  side: "left" | "right";
  x: ReturnType<typeof useTransform<number, string>>;
  rotate: ReturnType<typeof useTransform<number, number>>;
}) {
  return (
    <div
      aria-hidden
      className={`pointer-events-none absolute -top-16 bottom-0 z-10 hidden w-[58%] md:flex ${
        side === "left" ? "left-0 justify-end" : "right-0 justify-start"
      }`}
    >
      <motion.div
        className="relative h-full w-[380px]"
        style={{ x, rotate, transformOrigin: side === "left" ? "88% 100%" : "12% 100%" }}
      >
        <Image
          src={TREE_IMAGE_URL}
          alt=""
          fill
          sizes="380px"
          className={`object-contain object-bottom drop-shadow-[0_35px_40px_rgba(20,18,12,0.35)] ${side === "right" ? "-scale-x-100" : ""}`}
        />
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
      {/* Repli mobile / reduced-motion : pas d'écran épinglé, donc pas de
          risque de désynchronisation avec un contenu fixe — le décor
          peut vivre au niveau de la section (pleine largeur, hauteur
          naturelle du contenu). */}
      {!canAnimateCurtain && <GammesBackground />}

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
          {/* En mode rideau, le décor vit à l'intérieur du bloc
              `sticky` (pleine largeur avant la colonne centrée) : il
              reste ainsi parfaitement figé avec les arbres et les
              cartes pendant toute la durée de l'écran épinglé, plutôt
              que de défiler derrière un contenu fixe si on le plaçait
              au niveau de la section (bug constaté à l'écran, corrigé
              avant livraison). */}
          {canAnimateCurtain && <GammesBackground />}

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
