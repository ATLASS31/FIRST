"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

/**
 * REFONTE COMPLÈTE (3e passe client, maquette de référence à l'appui —
 * une capture "BELLORA HOMES" au rendu très abouti, visiblement conçue
 * par le client lui-même comme cahier des charges visuel précis).
 * Verdict client sur la version carousel-de-cartes précédente : "le
 * problème n'était pas les illustrations, mais le fait de les enfermer
 * dans des cartes. Elles perdaient immédiatement leur côté premium et
 * donnaient une impression de composant UI classique." Direction
 * demandée : "une exposition d'architecture... pas une interface SaaS,
 * pas une succession de cartes."
 *
 * Architecture, chemin de lecture demandé par le client (repris tel
 * quel) : 1. grand numéro d'étape → 2. grand titre → 3. maquette
 * isométrique (élément PRINCIPAL, jamais enfermée dans une carte,
 * "doit presque flotter dans l'espace") → 4. petit texte descriptif →
 * 5. navigation des cinq étapes (miniatures, pas des cartes non plus).
 *
 * Suppression totale de la mécanique "3 cartes empilées avec offset
 * horizontal" (héritée des rounds précédents) : plus de carte du tout.
 * Une seule grande illustration en scène centrale, qui CROSSFADE d'une
 * étape à l'autre (les deux images se superposent brièvement, jamais
 * de moment "vide") — direction client explicite : "au scroll, la
 * grande maquette ne disparaît jamais, elle évolue simplement". Le
 * numéro/titre/label au-dessus utilisent un `AnimatePresence
 * mode="wait"` classique (bref moment sans texte togérable, ce n'est
 * pas l'élément dont le client a dit qu'il ne devait "jamais
 * disparaître" — seule la maquette a cette contrainte).
 *
 * Choix d'interprétation sur "au scroll" : le client emploie cette
 * formule mais le reste du paragraphe décrit un comportement stable
 * (jamais de disparition, évolution douce, navigation qui glisse) — pas
 * explicitement un pin/scroll-scrub où la position de scroll piloterait
 * l'étape active au pixel près. Un vrai scroll-scrub a été tenté et
 * abandonné plusieurs fois ailleurs sur CE MÊME projet pour cause de
 * fragilité (`NotreHistoire.tsx`, voir historique git : "animation
 * déclenchée fluide (pas scroll-scrub)"). Décision : garder le
 * mécanisme existant, éprouvé et fluide (rotation automatique 3s +
 * navigation manuelle par clic sur une miniature) plutôt que
 * réintroduire ce risque connu — à corriger si le client voulait
 * vraiment un pin scroll-driven littéral.
 *
 * Navigation basse : 5 miniatures (mêmes illustrations, en petit), pas
 * de cartes, séparées par de fins traits verticaux comme sur la
 * maquette de référence. Même logique de profondeur de champ que
 * demandée pour la scène principale dans la version précédente,
 * appliquée ici aux miniatures : active plus grande/nette/légère ombre,
 * les autres plus petites/floutées/désaturées. Petit trait doré
 * glissant (`layoutId`) sous le label actif — anime sa position d'une
 * étape à l'autre au lieu de réapparaître à chaque fois, cohérent avec
 * "la navigation du bas glisse doucement d'une étape à l'autre".
 *
 * Illustrations : détourées (fond retiré, flood fill Python/numpy —
 * historique complet dans les rounds git précédents), WebP alpha dans
 * `public/images/procede/`. `Illustration` retombe sur un chiffre
 * fantôme si `illustrationUrl` est `null` (filet de sécurité, plus
 * utilisé actuellement — toutes les étapes ont leur vraie image).
 */

const ETAPES = [
  {
    title: "Échange et conception sur mesure",
    navLabel: "Échange & conception",
    label: "Sur-mesure",
    body: "Premier rendez-vous. On écoute votre projet, on regarde votre terrain, on dessine la maison qui vous ressemble.",
    illustrationUrl: "/images/procede/procede-01.webp",
  },
  {
    title: "Fabrication à la main en atelier",
    navLabel: "Fabrication en atelier",
    label: "4 à 8 semaines",
    body: "Vos modules naissent en atelier français. Ossature bois Douglas, isolation RE2020, finitions par nos artisans.",
    illustrationUrl: "/images/procede/procede-02.webp",
  },
  {
    title: "Transport jusqu'à votre terrain",
    navLabel: "Livraison & installation",
    label: "Transport sécurisé",
    body: "Camions plateaux, escorte si nécessaire. Vos modules arrivent prêts à être posés.",
    illustrationUrl: "/images/procede/procede-03.webp",
  },
  {
    title: "Pose et finitions par notre équipe française",
    navLabel: "Pose & finitions",
    label: "1 à 2 semaines",
    body: "Grutage, assemblage, raccordements. Notre équipe orchestre l'opération sur place.",
    illustrationUrl: "/images/procede/procede-04.webp",
  },
  {
    title: "Vous emménagez. Clé en main.",
    navLabel: "Remise des clés",
    label: "Garanti 20 ans",
    body: "Vous tournez la clé. Tout est prêt, tout est branché, tout est garanti 20 ans.",
    illustrationUrl: "/images/procede/procede-05.webp",
  },
] as const;

const ROTATE_MS = 3000;
const COUNT = ETAPES.length;

function Illustration({ url, index }: { url: string | null; index: number }) {
  if (url) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={url} alt="" className="h-full w-full object-contain" />;
  }
  return (
    <div className="flex h-full w-full items-center justify-center">
      <span
        aria-hidden
        className="text-[7rem] font-semibold leading-none text-laiton/15"
      >
        {String(index + 1).padStart(2, "0")}
      </span>
    </div>
  );
}

export default function ProcedeCarousel() {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const prefersReducedMotion = useReducedMotion();
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const goTo = useCallback((index: number) => {
    setActive(((index % COUNT) + COUNT) % COUNT);
  }, []);

  useEffect(() => {
    if (paused || prefersReducedMotion) return;
    timeoutRef.current = setTimeout(() => {
      setActive((a) => (a + 1) % COUNT);
    }, ROTATE_MS);
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [active, paused, prefersReducedMotion]);

  const etape = ETAPES[active];

  return (
    <div onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
      {/* 1. numéro + 2. titre + label — texte, peut brièvement
          s'effacer/réapparaître entre 2 étapes (contrairement à la
          maquette, qui elle ne doit jamais disparaître). */}
      <div className="mx-auto max-w-2xl text-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={active}
            initial={prefersReducedMotion ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={prefersReducedMotion ? undefined : { opacity: 0, y: -12 }}
            transition={{ duration: prefersReducedMotion ? 0.15 : 0.5, ease: [0.22, 1, 0.36, 1] }}
          >
            <span className="block text-4xl font-semibold text-laiton/60 sm:text-5xl">
              {String(active + 1).padStart(2, "0")}
            </span>
            <h3 className="mt-3 text-2xl font-semibold leading-tight text-encre sm:text-3xl">
              {etape.title}
            </h3>
            <span className="eyebrow mt-4 block text-xs text-laiton">
              {etape.label}
            </span>
            <span aria-hidden className="mx-auto mt-3 block h-px w-10 bg-laiton/50" />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* 3. la maquette — élément principal, jamais enfermée dans une
          carte, ombre synthétique pour un rendu "objet exposé" plutôt
          que collé à plat, énormément d'espace autour (demande
          client). Crossfade pur (les 2 images se superposent, pas de
          "wait") : la scène n'est jamais vide. */}
      <div className="relative mx-auto mt-8 h-[300px] w-full max-w-xl sm:mt-12 sm:h-[400px] sm:max-w-2xl lg:h-[460px] lg:max-w-3xl">
        <div
          aria-hidden
          className="absolute inset-x-[20%] bottom-[6%] h-[8%] rounded-[50%] bg-encre/10 blur-2xl"
        />
        <AnimatePresence>
          {ETAPES.map((e, i) =>
            i === active ? (
              <motion.div
                key={e.title}
                className="absolute inset-[6%] sm:inset-[8%]"
                initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, scale: 1.02 }}
                transition={{ duration: prefersReducedMotion ? 0.15 : 0.8, ease: [0.22, 1, 0.36, 1] }}
              >
                <Illustration url={e.illustrationUrl} index={i} />
              </motion.div>
            ) : null
          )}
        </AnimatePresence>
      </div>

      {/* 4. texte descriptif, très court */}
      <div className="mx-auto mt-6 max-w-md text-center sm:mt-8">
        <AnimatePresence mode="wait">
          <motion.p
            key={active}
            initial={prefersReducedMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={prefersReducedMotion ? undefined : { opacity: 0 }}
            transition={{ duration: prefersReducedMotion ? 0.15 : 0.4 }}
            className="text-sm leading-relaxed text-encre-doux"
          >
            {etape.body}
          </motion.p>
        </AnimatePresence>
      </div>

      {/* 5. navigation des 5 étapes — miniatures, pas des cartes.
          Profondeur de champ : active plus grande/nette/ombre légère,
          les autres plus petites/floutées/désaturées ("comme une
          profondeur de champ photographique"). */}
      <div className="mt-12 flex items-start justify-center sm:mt-16">
        {ETAPES.map((e, i) => {
          const isActive = i === active;
          return (
            <div key={e.title} className="flex items-start">
              {i > 0 && (
                <span
                  aria-hidden
                  className="mx-2 mt-6 hidden h-8 w-px shrink-0 bg-encre-douce/15 sm:mx-4 sm:block"
                />
              )}
              <button
                type="button"
                onClick={() => goTo(i)}
                aria-label={`Aller à l'étape ${i + 1} : ${e.title}`}
                aria-current={isActive}
                className="flex w-16 flex-col items-center gap-2 px-1 text-center sm:w-20"
              >
                <motion.div
                  animate={{
                    scale: isActive ? 1 : 0.72,
                    filter: isActive
                      ? "blur(0px) saturate(1) brightness(1)"
                      : "blur(1.5px) saturate(0.35) brightness(0.85)",
                  }}
                  transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                  className={`h-12 w-12 sm:h-14 sm:w-14 ${
                    isActive ? "drop-shadow-[0_6px_14px_rgba(26,22,20,0.18)]" : ""
                  }`}
                >
                  <Illustration url={e.illustrationUrl} index={i} />
                </motion.div>
                <span
                  className={`eyebrow text-[9px] transition-colors duration-300 ${
                    isActive ? "text-laiton" : "text-encre-douce/40"
                  }`}
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span
                  className={`text-[9px] font-medium uppercase leading-tight tracking-wide transition-colors duration-300 ${
                    isActive ? "text-encre" : "text-encre-douce/40"
                  }`}
                >
                  {e.navLabel}
                </span>
                {isActive && (
                  <motion.span
                    layoutId="procede-nav-underline"
                    transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                    className="block h-px w-5 bg-laiton"
                  />
                )}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
