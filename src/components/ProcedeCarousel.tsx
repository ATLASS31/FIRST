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
 * annotée) : numéro (haut gauche) → titre → illustration → petite
 * ligne laiton → texte descriptif. `meta` (durée, ex. "4 à 8 semaines")
 * n'apparaît pas sur la maquette du client — casée juste après la
 * ligne, avant la description, comme complément discret.
 *
 * Illustrations : après plusieurs tentatives infructueuses (images
 * collées dans le chat = invisibles sur disque pour moi ; pièce jointe
 * d'issue GitHub = bloquée par la politique réseau du sandbox, les
 * assets `user-attachments` ne sont pas accessibles), la solution qui a
 * fonctionné est un commit direct dans le repo (`Add file → Upload
 * files` sur la branche de travail) — un vrai fichier versionné, donc
 * récupérable par `git pull`. Les 5 rendus isométriques du client
 * (`public/images/house-1..5.png`, ~2 Mo chacun) ont été redimensionnés
 * à 900px de large et convertis en WebP (~60-80 Ko chacun) dans
 * `public/images/procede/`. Le client n'a pas donné de mapping
 * image→étape explicite, seulement "au fur et à mesure des cartes la
 * maison se construit" : les 5 images forment une progression de
 * complétude évidente (fondation vide → modules grutés → structure
 * montée avec camion sur site → finitions par l'équipe → maison livrée
 * avec poignée de main), utilisée telle quelle pour l'ordre 01→05,
 * indépendamment des titres exacts de chaque étape (aucune image ne
 * montre littéralement un "atelier" puisque toutes sont prises sur le
 * même terrain).
 * `CardIllustration` retombe sur le chiffre fantôme en filigrane si
 * jamais `illustrationUrl` est `null` — conservé comme filet de
 * sécurité, plus utilisé actuellement.
 *
 * Détourage : demande client ("supprime l'arrière-plan des photos pour
 * qu'elles s'incrustent bien"). Le remplaceur de fond IA d'Higgsfield
 * (`remove_background`) nécessite un upload vers `upload.higgsfield.ai`
 * depuis ce sandbox — hôte bloqué par la politique réseau (403 confirmé,
 * même famille de restriction que les pièces jointes GitHub). Détourage
 * fait localement à la place : les rendus ont un fond crème quasi
 * parfaitement uniforme (échantillonné aux 4 coins), mais une simple
 * distance de couleur globale mord dans le toit (teinte très proche du
 * fond) — recours à un flood fill (propagation depuis les bords de
 * l'image, uniquement à travers des pixels "couleur fond", en Python/
 * numpy) : ne retire QUE la région de fond réellement connectée au
 * bord, donc le toit clair (jamais connecté au bord, encerclé par la
 * végétation) reste intact même s'il est presque de la même couleur.
 * Léger flou (quelques passes de box-blur sur le canal alpha) pour
 * adoucir le contour plutôt qu'un détourage à l'emporte-pièce. Résultat
 * en WebP avec canal alpha (même noms de fichiers `procede-0X.webp`,
 * contenu remplacé).
 *
 * Cartes agrandies (desktop et mobile) : `image object-cover` →
 * `object-contain`, plus la peine de recadrer maintenant que le fond
 * est transparent — l'espace "vide" autour du sujet ne montre plus une
 * couleur de secours mais laisse voir le fond crème de la carte,
 * invisible donc pas de recadrage nécessaire pour cacher un bord.
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
    illustrationUrl: "/images/procede/procede-01.webp",
  },
  {
    title: "Fabrication à la main en atelier",
    meta: "4 à 8 semaines",
    body: "Vos modules naissent en atelier français. Ossature bois Douglas, isolation RE2020, finitions par nos artisans.",
    illustrationUrl: "/images/procede/procede-02.webp",
  },
  {
    title: "Transport jusqu'à votre terrain",
    body: "Camions plateaux, escorte si nécessaire. Vos modules arrivent prêts à être posés.",
    illustrationUrl: "/images/procede/procede-03.webp",
  },
  {
    title: "Pose et finitions par notre équipe française",
    meta: "1 à 2 semaines",
    body: "Grutage, assemblage, raccordements. Notre équipe orchestre l'opération sur place.",
    illustrationUrl: "/images/procede/procede-04.webp",
  },
  {
    title: "Vous emménagez. Clé en main.",
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
    // object-contain (pas object-cover) : les illustrations sont
    // détourées (fond retiré), donc plus besoin — et plus jamais
    // souhaitable — de les recadrer en plein cadre. Le "vide" autour du
    // sujet est transparent, pas une couleur de secours, donc invisible
    // sur le fond crème de la carte.
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={url} alt="" className="h-full w-full object-contain" />;
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
        className="relative mx-auto h-[540px] max-w-md sm:h-[620px]"
        style={{ perspective: "1400px" }}
      >
        <AnimatePresence initial={false}>
          {visible.map(({ etape, index, offset }) => {
            const isActive = offset === 0;
            const target = {
              x: offset * 250,
              scale: isActive ? 1 : 0.82,
              opacity: isActive ? 1 : 0.45,
              rotateY: offset * -12,
              filter: isActive ? "blur(0px)" : "blur(3px)",
            };
            // Une carte qui vient d'apparaître (ex-position ±2, hors
            // DOM) démarre plus loin dans le même sens que sa cible,
            // pour glisser vers sa place plutôt que de "popper".
            const enterFrom = {
              x: offset * 460,
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
                  className={`flex h-full flex-col overflow-hidden rounded-3xl bg-brume shadow-[0_20px_50px_-16px_rgba(26,22,20,0.25)] ${
                    !isActive ? "cursor-pointer" : ""
                  }`}
                >
                  <div className="flex flex-col gap-1 px-7 pt-7">
                    <span className="eyebrow text-xs text-laiton">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <h3 className="text-lg font-semibold leading-snug text-encre">
                      {etape.title}
                    </h3>
                  </div>
                  {/* h-[46%] (au lieu de 38%) + object-contain sur
                      l'image : les illustrations sont maintenant
                      détourées (voir CardIllustration), donc une image
                      plus grande ne risque plus de se faire recadrer
                      moche — elle respire simplement plus dans la
                      carte, demande client ("les cartes soient plus
                      grandes... elle ne soit pas coupée"). */}
                  <div className="mt-4 h-[46%] w-full shrink-0 px-5">
                    <CardIllustration url={etape.illustrationUrl} index={index} />
                  </div>
                  <div className="flex flex-1 flex-col gap-2 px-7 py-5">
                    <span aria-hidden className="block h-px w-8 bg-laiton" />
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
