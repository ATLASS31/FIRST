"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

/**
 * Carousel 3D demandé par le client, référence visuelle à l'appui (deux
 * maquettes de carte + 3 rendus d'illustration isométrique, "au fur et à
 * mesure des cartes la maison se construit") : une carte active au
 * centre, ses deux voisines réduites et floutées en aperçu de chaque
 * côté, rotation automatique toutes les 3s.
 *
 * Illustrations : le client envoie les images collées dans le chat, pas
 * en pièce jointe (même distinction déjà rencontrée plusieurs fois ce
 * projet — voir historique git) — aucun fichier exploitable sur disque
 * pour l'instant. Chaque étape a un champ `illustrationUrl` prêt à
 * recevoir une vraie image dès qu'elle arrive en pièce jointe ; en
 * attendant, un chiffre fantôme géant en filigrane tient lieu de
 * placeholder — délibérément sobre pour ne pas se faire passer pour un
 * rendu final.
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
    body: "Premier rendez-vous. On écoute votre projet, on regarde votre terrain, on dessine la maison qui vous ressemble.",
    illustrationUrl: null,
  },
  {
    title: "Fabrication à la main en atelier",
    meta: "4 à 8 semaines",
    body: "Vos modules naissent en atelier français. Ossature bois Douglas, isolation RE2020, finitions par nos artisans.",
    illustrationUrl: null,
  },
  {
    title: "Transport jusqu'à votre terrain",
    body: "Camions plateaux, escorte si nécessaire. Vos modules arrivent prêts à être posés.",
    illustrationUrl: null,
  },
  {
    title: "Pose et finitions par notre équipe française",
    meta: "1 à 2 semaines",
    body: "Grutage, assemblage, raccordements. Notre équipe orchestre l'opération sur place.",
    illustrationUrl: null,
  },
  {
    title: "Vous emménagez. Clé en main.",
    body: "Vous tournez la clé. Tout est prêt, tout est branché, tout est garanti 20 ans.",
    illustrationUrl: null,
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
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={url} alt="" className="h-full w-full object-cover" />;
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
        className="relative mx-auto h-[460px] max-w-sm sm:h-[500px]"
        style={{ perspective: "1400px" }}
      >
        <AnimatePresence initial={false}>
          {visible.map(({ etape, index, offset }) => {
            const isActive = offset === 0;
            const target = {
              x: offset * 210,
              scale: isActive ? 1 : 0.82,
              opacity: isActive ? 1 : 0.45,
              rotateY: offset * -12,
              filter: isActive ? "blur(0px)" : "blur(3px)",
            };
            // Une carte qui vient d'apparaître (ex-position ±2, hors
            // DOM) démarre plus loin dans le même sens que sa cible,
            // pour glisser vers sa place plutôt que de "popper".
            const enterFrom = {
              x: offset * 380,
              scale: 0.6,
              opacity: 0,
              rotateY: offset * -12,
              filter: "blur(6px)",
            };

            return (
              <motion.div
                key={etape.title}
                className="absolute inset-0 m-auto"
                style={{
                  width: "min(100%, 300px)",
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
                  className={`flex h-full flex-col overflow-hidden rounded-3xl bg-brume shadow-[0_20px_50px_-16px_rgba(26,22,20,0.25)] ${
                    !isActive ? "cursor-pointer" : ""
                  }`}
                >
                  <div className="h-[55%] w-full shrink-0">
                    <CardIllustration url={etape.illustrationUrl} index={index} />
                  </div>
                  <div className="flex flex-1 flex-col gap-2 px-6 py-5">
                    <span className="eyebrow text-xs text-laiton">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <h3 className="text-lg font-semibold leading-snug text-encre">
                      {etape.title}
                    </h3>
                    <span aria-hidden className="mt-1 block h-px w-8 bg-laiton" />
                    {"meta" in etape && etape.meta && (
                      <p className="eyebrow text-[10px] text-foret">
                        {etape.meta}
                      </p>
                    )}
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
