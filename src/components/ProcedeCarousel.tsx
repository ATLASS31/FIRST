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
 * Illustrations, 2e génération (client insatisfait du premier lot de
 * rendus "vue de dessus large" — remplacés par un nouveau lot en plan
 * plus serré, style "produit exposé en studio", avec personnages
 * (poignée de main, ouvriers) qui racontent mieux chaque étape).
 * Envoyées en commentaire de la PR #1 (`user-attachments`, bloqué côté
 * réseau comme d'habitude) puis correctement uploadées via `Add file →
 * Upload files` — mais sur la branche `main` par erreur (pas la branche
 * de travail) : récupérées via `git show origin/main:<fichier>` plutôt
 * que `git pull`, sans qu'il soit nécessaire de merger `main`.
 *
 * Détourage : même technique flood fill que le lot précédent, mais
 * avec une complication nouvelle — le fond de ces rendus n'est PAS une
 * couleur plate, c'est un dégradé (vignette studio, un coin jusqu'à
 * ~57 de distance colorimétrique d'un autre). Un unique `bg_color`
 * moyen (technique du lot précédent) laissait de larges zones de fond
 * non détourées (visible en testant sur fond rouge). Corrigé en
 * ajustant une surface quadratique lissée (régression aux moindres
 * carrés sur les pixels d'une fine bande le long des 4 bords, modèle
 * `a + bx + cy + dx² + ey² + fxy` par canal) plutôt qu'une couleur
 * unique — le flood fill compare alors chaque pixel à SA valeur de
 * fond attendue localement, pas à une moyenne globale. Un résidu
 * minuscule de fond non retiré subsiste dans un interstice de feuillage
 * sur une image (bloqué par les branches, jamais connecté au bord) —
 * vérifié invisible une fois composé sur le vrai fond blanc des cartes
 * (seulement visible en test adversarial sur fond rouge vif).
 *
 * WebP alpha dans `public/images/procede/` (mêmes noms de fichiers que
 * le lot précédent, contenu remplacé). `Illustration` retombe sur un
 * chiffre fantôme si `illustrationUrl` est `null` (filet de sécurité,
 * plus utilisé actuellement — toutes les étapes ont leur vraie image).
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
          que collé à plat. 4e passe client, capture annotée : "l'image
          c'est pas l'élément principal de la catégorie" sur mobile +
          trait noir tracé sur une capture desktop indiquant que le
          haut de la maquette (la cime des arbres) doit remonter
          nettement plus près du bloc titre. Réponse : box mobile en
          plein bleed (`-mx-6`, annule le `px-6` de la section pour
          toucher les deux bords de l'écran — sur mobile la largeur est
          le facteur limitant vu le ratio des images, donc bleed = seul
          vrai levier de taille) + inset interne réduit (moins de marge
          morte autour de l'image dans sa box) + rapprochement encore
          plus marqué du bloc texte au-dessus (`lg:-mt-4` → `lg:-mt-10`)
          pour coller au trait dessiné par le client. Fond transparent
          des illustrations = ce rapprochement ne crée aucune
          superposition moche (argument client déjà validé au round
          précédent). */}
      {/* h-[300px] mobile (était 220px) : même avec le bleed plein
          écran, les 5 illustrations partagent toutes le ratio
          1100×614 (≈1.79:1), donc l'image reste contrainte par la
          largeur de l'écran, pas par la hauteur de la box — la box
          plus haute ajoute de la respiration verticale volontaire
          (cohérent avec la maquette de référence, qui laisse aussi de
          l'air autour de l'illustration) plutôt que de faire encore
          grossir l'image elle-même au-delà de ce que la largeur
          d'écran permet. */}
      {/* 5e passe client : "en bas regarde le vide" — capture annotée
          montrant un grand espace mort entre le bas de la maquette et
          le texte descriptif. Cause : la box `sm:h-[640px] lg:h-[820px]`
          du round précédent était bien plus haute que ce que l'image
          (contrainte par la largeur, cf. ci-dessus) occupe réellement
          une fois centrée dedans — le surplus se répartissait en
          `object-contain` pour moitié en haut, pour moitié en bas de
          la box. Le haut avait déjà été validé "parfaitement collé",
          donc réduire la hauteur de la box (au lieu de bouger l'image
          dans sa box) resserre les deux moitiés de façon symétrique :
          le bas se resserre (ce qui était demandé) et le haut, déjà
          bon, ne fait que gagner encore un peu en compacité plutôt que
          de se dégrader. Hauteurs recalculées au plus près du rendu
          réel (ratio 1100×614, largeur dispo à chaque palier) + une
          marge de sécurité modeste pour ne jamais rogner l'image :
          sm:h-[640px]→h-[580px], lg:h-[820px]→h-[700px]. */}
      <div className="relative -mx-6 mt-2 h-[300px] w-[calc(100%+3rem)] sm:mx-auto sm:-mt-8 sm:h-[560px] sm:w-full sm:max-w-5xl lg:-mt-24 lg:h-[660px] lg:max-w-6xl">
        <div
          aria-hidden
          className="absolute inset-x-[20%] bottom-[6%] h-[8%] rounded-[50%] bg-encre/10 blur-2xl"
        />
        <AnimatePresence>
          {ETAPES.map((e, i) =>
            i === active ? (
              <motion.div
                key={e.title}
                className="absolute inset-[2%] sm:inset-[6%]"
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

      {/* 4. texte descriptif, très court — resserré contre la maquette
          (`mt-6/8` → `mt-2/3`), demande client explicite ("le texte
          plus les miniatures doivent remonter jusqu'à l'image"). */}
      {/* 8e passe client : "monte encore plus le bas, que ce soit juste
          en bas de l'angle en béton" — `lg:-mt-14` → testé par paliers
          jusqu'à `-mt-36` (chevauchait le camion de l'étape 2, le pire
          cas — toutes les illustrations ne s'arrêtent pas à la même
          hauteur dans leur canevas transparent, même logique que le
          recalibrage du haut au round précédent) → repli sur
          `lg:-mt-20`, revérifié sur les 5 étapes cette fois : aucun
          chevauchement nulle part, texte tout de suite sous le socle. */}
      <div className="mx-auto mt-2 max-w-md text-center sm:-mt-4 lg:-mt-20">
        <AnimatePresence mode="wait">
          <motion.p
            key={active}
            initial={prefersReducedMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={prefersReducedMotion ? undefined : { opacity: 0 }}
            transition={{ duration: prefersReducedMotion ? 0.15 : 0.4 }}
            className="text-sm leading-relaxed text-encre-doux lg:text-base"
          >
            {etape.body}
          </motion.p>
        </AnimatePresence>
      </div>

      {/* 5. navigation des 5 étapes — miniatures, pas des cartes.
          Profondeur de champ : active plus grande/nette/ombre légère,
          les autres plus petites/floutées/désaturées ("comme une
          profondeur de champ photographique"). Petite ombre synthétique
          sous chaque miniature (même logique que la grande scène, en
          plus discret) — demande client explicite d'un round
          précédent, illustrée en dessinant une ligne noire sous une
          des miniatures sur sa capture annotée. */}
      {/* 6e passe client : "on est sur pc, tu peux te permettre de les
          mettre bien plus grandes, comme le texte — c'est pour une
          clientèle âgée, il faut que ce soit lisible". Libellés et
          numéros passés de `text-[9px]` (illisible pour une clientèle
          âgée) à `text-xs` (12px) sur `lg:`. */}
      {/* 8e passe client : "grandis x2 les miniatures" — après 3 passes
          de suite à agrandir une taille fixe en dur (144→176→192px),
          changement d'architecture plutôt qu'un 4e chiffre deviné :
          `grid grid-cols-5` désormais à TOUTES les tailles d'écran
          (plus seulement mobile), chaque miniature en `aspect-square
          w-full` — la taille n'est plus une valeur fixe à remonter à
          chaque retour client, elle est TOUJOURS le maximum que la
          largeur du conteneur permet, à n'importe quelle taille
          d'écran (même logique que le fix mobile du round précédent,
          étendue partout). Le séparateur vertical passe d'un élément
          de flexbox (qui consommait sa propre largeur) à un trait
          positionné en absolu sur le bord de chaque colonne — sinon un
          6e élément par étape aurait cassé le compte de `grid-cols-5`.
          Espace miniature↔libellé encore resserré (`lg:gap-1.5` →
          `lg:gap-1`), 2e passe sur ce réglage ("le texte miniature
          n'est pas assez collé"). */}
      {/* 6e passe client, mobile : "t'avais raison, ça sort de
          l'écran, corrige pour avoir la taille maximale sans que ça
          sorte" — la rangée scrollable du round précédent (miniatures
          à taille fixe 112px, débordement volontaire absorbé par un
          scroll horizontal) est abandonnée : le client veut du non
          scrollable, la taille maximale qui rentre pile. Solution
          robuste à toutes les largeurs d'écran plutôt qu'une valeur en
          dur devinée : `grid grid-cols-5` en plein bleed (`-mx-6`,
          même technique que la maquette) — chaque miniature occupe
          exactement 1/5 de la largeur réelle de l'écran (`aspect-square`
          au lieu d'une hauteur fixe), donc toujours la taille maximale
          possible et JAMAIS de débordement, quel que soit l'appareil.
          Cette même logique s'applique maintenant à `sm:`/`lg:`
          (voir plus haut) — plus de rangée à taille fixe du tout. */}
      <div className="-mx-6 mt-4 grid grid-cols-5 items-start gap-x-1 px-2 sm:mx-0 sm:mt-6 sm:gap-x-3 sm:px-0 lg:gap-x-4">
        {ETAPES.map((e, i) => {
          const isActive = i === active;
          return (
            <div key={e.title} className="relative flex justify-center">
              {i > 0 && (
                <span
                  aria-hidden
                  className="absolute left-0 top-8 hidden h-8 w-px -translate-x-1/2 bg-encre-douce/15 sm:block lg:top-14"
                />
              )}
              <button
                type="button"
                onClick={() => goTo(i)}
                aria-label={`Aller à l'étape ${i + 1} : ${e.title}`}
                aria-current={isActive}
                className="flex w-full min-w-0 flex-col items-center gap-2 px-1 text-center lg:gap-1"
              >
                <motion.div
                  animate={{
                    scale: isActive ? 1 : 0.72,
                    filter: isActive
                      ? "blur(0px) saturate(1) brightness(1)"
                      : "blur(1.5px) saturate(0.35) brightness(0.85)",
                  }}
                  transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                  className="relative aspect-square w-full"
                >
                  <div
                    aria-hidden
                    className="absolute inset-x-[22%] bottom-[10%] h-[6%] rounded-[50%] bg-encre/15 blur-sm"
                  />
                  <div
                    className={
                      isActive
                        ? "relative h-full w-full drop-shadow-[0_6px_14px_rgba(26,22,20,0.18)]"
                        : "relative h-full w-full"
                    }
                  >
                    <Illustration url={e.illustrationUrl} index={i} />
                  </div>
                </motion.div>
                <span
                  className={`eyebrow text-[9px] transition-colors duration-300 lg:text-xs ${
                    isActive ? "text-laiton" : "text-encre-douce/40"
                  }`}
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span
                  className={`block w-full text-[9px] font-medium uppercase leading-tight tracking-wide transition-colors duration-300 lg:text-xs ${
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
