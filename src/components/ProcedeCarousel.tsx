"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

/**
 * Carousel 3D demandé par le client, référence visuelle à l'appui (deux
 * maquettes de carte + rendus d'illustration isométrique, "au fur et à
 * mesure des cartes la maison se construit") : une carte active au
 * centre, ses deux voisines réduites et floutées en aperçu de chaque
 * côté, rotation automatique toutes les 3s.
 *
 * Ordre du contenu de carte (précisé par le client sur une maquette
 * annotée) : numéro (haut gauche) → titre → illustration → petit label
 * premium → texte descriptif.
 *
 * Illustrations : après plusieurs tentatives infructueuses (images
 * collées dans le chat = invisibles sur disque pour moi ; pièce jointe
 * d'issue GitHub = bloquée par la politique réseau du sandbox), la
 * solution qui a fonctionné est un commit direct dans le repo (`Add
 * file → Upload files`). Détourage fait localement (flood fill
 * Python/numpy, l'API Higgsfield étant elle aussi bloquée réseau — voir
 * historique git détaillé) : fond retiré, résultat en WebP avec canal
 * alpha (`public/images/procede/procede-0X.webp`). `CardIllustration`
 * retombe sur le chiffre fantôme en filigrane si jamais
 * `illustrationUrl` est `null` — conservé comme filet de sécurité, plus
 * utilisé actuellement.
 *
 * Refonte hiérarchie visuelle (2e passe client, retour détaillé en 7
 * points sur la version précédente — "impression de vide... les
 * proportions ne sont pas bonnes", référence Apple/Polestar/Porsche/
 * Awwwards) :
 * - Illustration devenue l'élément dominant de la carte (~50% de sa
 *   hauteur, contre 46% avant — la vraie différence vient surtout de la
 *   carte globalement plus compacte, qui fait mécaniquement grossir
 *   cette même proportion en pixels réels) — traitée comme un objet
 *   exposé : légère ombre synthétique floue dessous plutôt que posée à
 *   plat, padding latéral réduit pour la laisser respirer en grand.
 * - Carte nettement plus compacte (`h-[540px] sm:h-[620px]` →
 *   `h-[420px] sm:h-[480px]`) et tous les espacements internes resserrés
 *   (gaps, paddings) — "il faut supprimer le vide inutile".
 * - Divider remplacé par un label premium minimaliste par étape (chip
 *   `eyebrow`, ex. "Sur-mesure", "4 à 8 semaines") — chaque étape en a
 *   désormais un (avant : uniquement les 2 étapes avec une durée
 *   avaient un `meta`, réparti au hasard des données ; maintenant un
 *   `label` éditorial pour les 5, cohérent avec la demande "quelque
 *   chose de très minimaliste avec une belle typographie").
 * - Profondeur de champ renforcée entre carte active et voisines : pas
 *   seulement le flou d'avant, mais un vrai filtre combiné
 *   `blur + saturate + brightness` (voisines nettement plus
 *   désaturées/sombres/floues, active légèrement AGRANDIE — scale 1.05
 *   au lieu de 1 — pour dominer plutôt que seulement se distinguer par
 *   contraste). Framer Motion interpole ce filtre composite proprement
 *   car les 2 états (actif/inactif) utilisent exactement les mêmes 3
 *   fonctions dans le même ordre.
 * - Fond de section passé à `--brume` (#F7F5F0 exact demandé) avec un
 *   dégradé radial très doux — voir commentaire dans `Procede.tsx`.
 *   Cartes passées de `bg-brume` à `bg-white` pour se détacher de ce
 *   nouveau fond (elles avaient la MÊME couleur que l'ancien fond
 *   `bg-ciel`... non — elles avaient déjà `bg-brume`, qui devient donc
 *   la couleur du FOND une fois la demande appliquée ; d'où le passage
 *   des cartes à blanc pur pour ne pas se fondre dedans).
 *
 * Mécanique : seules 3 cartes sont montées à la fois (active + 2
 * voisines, `Math.abs(offset) <= 1`) — au-delà, une carte n'existe pas
 * encore dans le DOM. `AnimatePresence` gère alors son entrée (glisse
 * depuis plus loin, floue et réduite) quand elle devient voisine, et sa
 * sortie (continue dans le même sens) quand elle cesse de l'être. Entre
 * les deux, tant qu'une carte reste montée (active ↔ voisine), c'est un
 * simple repositionnement animé, pas un remontage — la carte ne
 * "saute" jamais.
 */

const ETAPES = [
  {
    title: "Échange et conception sur mesure",
    label: "Sur-mesure",
    body: "Premier rendez-vous. On écoute votre projet, on regarde votre terrain, on dessine la maison qui vous ressemble.",
    illustrationUrl: "/images/procede/procede-01.webp",
  },
  {
    title: "Fabrication à la main en atelier",
    label: "4 à 8 semaines",
    body: "Vos modules naissent en atelier français. Ossature bois Douglas, isolation RE2020, finitions par nos artisans.",
    illustrationUrl: "/images/procede/procede-02.webp",
  },
  {
    title: "Transport jusqu'à votre terrain",
    label: "Transport sécurisé",
    body: "Camions plateaux, escorte si nécessaire. Vos modules arrivent prêts à être posés.",
    illustrationUrl: "/images/procede/procede-03.webp",
  },
  {
    title: "Pose et finitions par notre équipe française",
    label: "1 à 2 semaines",
    body: "Grutage, assemblage, raccordements. Notre équipe orchestre l'opération sur place.",
    illustrationUrl: "/images/procede/procede-04.webp",
  },
  {
    title: "Vous emménagez. Clé en main.",
    label: "Garanti 20 ans",
    body: "Vous tournez la clé. Tout est prêt, tout est branché, tout est garanti 20 ans.",
    illustrationUrl: "/images/procede/procede-05.webp",
  },
] as const;

const ROTATE_MS = 3000;
const COUNT = ETAPES.length;

// Décalage le plus court (avec bouclage) entre un index de carte et la
// carte active — permet à la carte "04" de redevenir voisine de "00" en
// passant par la droite plutôt que de traverser tout le carousel.
function shortestOffset(index: number, active: number) {
  let offset = index - active;
  if (offset > COUNT / 2) offset -= COUNT;
  if (offset < -COUNT / 2) offset += COUNT;
  return offset;
}

function CardIllustration({
  url,
  index,
}: {
  url: string | null;
  index: number;
}) {
  if (url) {
    return (
      <div className="relative h-full w-full">
        {/* Ombre synthétique sous l'illustration : les rendus sont
            détourés (fond transparent), donc sans profondeur propre une
            fois posés sur la carte blanche — cette ellipse floue leur
            donne un ancrage, comme un objet posé en studio plutôt
            qu'une image plate collée sur la carte. */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-[15%] bottom-1 h-[10%] rounded-[50%] bg-encre/10 blur-md"
        />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={url}
          alt=""
          className="relative h-full w-full object-contain"
        />
      </div>
    );
  }
  return (
    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-brume-2 to-brume">
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

  const visible = ETAPES.map((etape, index) => ({
    etape,
    index,
    offset: shortestOffset(index, active),
  })).filter((c) => Math.abs(c.offset) <= 1);

  return (
    <div
      className="relative"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div
        className="relative mx-auto h-[420px] max-w-md sm:h-[480px]"
        style={{ perspective: "1400px" }}
      >
        <AnimatePresence initial={false}>
          {visible.map(({ etape, index, offset }) => {
            const isActive = offset === 0;
            // Profondeur de champ : la carte active domine (légèrement
            // agrandie, nette, couleurs pleines) ; les voisines
            // reculent (réduites, floutées, désaturées, assombries) —
            // demande client explicite ("comme une profondeur de champ
            // photographique"). Les 2 états utilisent le même triplet
            // de fonctions filter dans le même ordre : Framer Motion
            // interpole chaque paramètre individuellement plutôt que de
            // sauter d'une valeur à l'autre.
            const target = {
              x: offset * 250,
              scale: isActive ? 1.05 : 0.76,
              opacity: isActive ? 1 : 0.7,
              rotateY: offset * -10,
              filter: isActive
                ? "blur(0px) saturate(1) brightness(1)"
                : "blur(5px) saturate(0.6) brightness(0.8)",
            };
            // Une carte qui vient d'apparaître (ex-position ±2, hors
            // DOM) démarre plus loin dans le même sens que sa cible,
            // pour glisser vers sa place plutôt que de "popper".
            const enterFrom = {
              x: offset * 460,
              scale: 0.55,
              opacity: 0,
              rotateY: offset * -10,
              filter: "blur(8px) saturate(0.5) brightness(0.75)",
            };

            return (
              <motion.div
                key={etape.title}
                className="absolute inset-0 m-auto"
                style={{
                  width: "min(94%, 360px)",
                  zIndex: isActive ? 3 : 2,
                  pointerEvents: isActive ? "auto" : "none",
                }}
                initial={prefersReducedMotion ? target : enterFrom}
                animate={target}
                exit={prefersReducedMotion ? { opacity: 0 } : enterFrom}
                transition={{ duration: prefersReducedMotion ? 0.15 : 0.7, ease: [0.22, 1, 0.36, 1] }}
                onClick={() => !isActive && goTo(index)}
              >
                <div
                  className={`flex h-full flex-col overflow-hidden rounded-3xl bg-white shadow-[0_20px_50px_-16px_rgba(26,22,20,0.25)] ${
                    !isActive ? "cursor-pointer" : ""
                  }`}
                >
                  <div className="flex shrink-0 flex-col gap-0.5 px-6 pt-5">
                    <span className="eyebrow text-[11px] text-laiton">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <h3 className="text-base font-semibold leading-snug text-encre sm:text-lg">
                      {etape.title}
                    </h3>
                  </div>
                  {/* ~50% de la hauteur de la carte : l'illustration
                      devient l'élément dominant plutôt qu'un simple
                      accompagnement du texte — demande client
                      ("l'illustration doit devenir l'élément
                      principal"). Padding latéral réduit (px-3) pour la
                      laisser occuper un maximum de largeur. */}
                  <div className="mt-1.5 h-[50%] w-full shrink-0 px-3">
                    <CardIllustration url={etape.illustrationUrl} index={index} />
                  </div>
                  <div className="flex shrink-0 flex-col px-6">
                    <span className="eyebrow text-[10px] text-laiton/80">
                      {etape.label}
                    </span>
                  </div>
                  <div className="flex-1 px-6 pb-5 pt-1">
                    <p className="text-sm leading-relaxed text-encre-doux">
                      {etape.body}
                    </p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      <div className="mt-10 flex items-center justify-center gap-6">
        <div className="flex items-center gap-2.5">
          {ETAPES.map((etape, i) => (
            <button
              key={etape.title}
              type="button"
              onClick={() => goTo(i)}
              aria-label={`Aller à l'étape ${i + 1}`}
              aria-current={i === active}
              className={`rounded-full transition-all duration-300 ${
                i === active
                  ? "h-2.5 w-2.5 bg-laiton shadow-[0_0_0_4px_rgba(173,138,85,0.18)]"
                  : "h-1.5 w-1.5 border border-encre-douce/30 bg-transparent hover:border-laiton/60"
              }`}
            />
          ))}
        </div>

        {!prefersReducedMotion && (
          <motion.button
            type="button"
            onClick={() => goTo(active + 1)}
            whileTap={{ scale: 0.9 }}
            whileHover={{ scale: 1.05 }}
            aria-label="Étape suivante"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-laiton/40 text-laiton transition-colors duration-300 hover:border-laiton hover:bg-laiton/10"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.5}
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-4 w-4"
            >
              <path d="M4 12h15M13 6l6 6-6 6" />
            </svg>
          </motion.button>
        )}
      </div>
    </div>
  );
}
