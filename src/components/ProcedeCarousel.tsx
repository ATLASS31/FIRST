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
    // 10e passe client, capture annotée d'une maquette 2 colonnes :
    // "on consomme presque 40% de la hauteur de l'écran avant même de
    // voir l'élément principal" — sur desktop, le flux vertical unique
    // (titre → numéro/titre d'étape → maquette) empilait tout ce texte
    // AU-DESSUS de la maquette. Restructuré en grille CSS 2 colonnes
    // À PARTIR de `lg:` seulement (texte à gauche, maquette à droite,
    // visible immédiatement, plus besoin de scroller le texte pour
    // l'atteindre) ; mobile/tablette gardent le flux vertical centré
    // existant tel quel (non concerné par la demande, "la mise en page
    // PC"). Grille (pas flex) : seule façon de placer des enfants
    // indépendamment sur 2 colonnes/3 lignes sans dupliquer le DOM.
    <div
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      className="lg:grid lg:grid-cols-[minmax(0,26rem)_1fr] lg:gap-x-16"
    >
      {/* Eyebrow + titre de section — vivait dans `Procede.tsx`, déplacé
          ici pour pouvoir être un enfant direct de cette même grille
          (ligne 1, colonne 1) ; contenu et style identiques à avant sur
          mobile/tablette (centré), aligné à gauche sur `lg:`. */}
      {/* 11e passe client : "le filet à droite de Notre procédé sert à
          rien" — retiré. "le titre de catégorie... met-le de la même
          taille que tous les titres" — `lg:text-4xl` plafonnait le
          titre en dessous de `sm:text-5xl` à partir de `lg:` ; retiré,
          il grandit maintenant jusqu'à `text-5xl` comme partout
          ailleurs sur le site (`NotreHistoire`, `GammesPreview`,
          `ThreePiliers`... même classe `text-4xl sm:text-5xl` sans
          exception). */}
      <div className="mx-auto max-w-2xl text-center lg:col-start-1 lg:row-start-1 lg:mx-0 lg:max-w-none lg:text-left">
        <p className="eyebrow text-xs text-encre-douce">Notre procédé</p>
        {/* 12e passe client : retour à la ligne forcé après "clés," —
            le retour automatique du navigateur coupait plus tôt ("De
            la signature / aux clés, sans / surprise.", 3 lignes). Un
            `<br />` seul ne suffisait pas : la colonne de gauche
            desktop ne fait que 26rem, donc "De la signature aux
            clés," lui-même continuait à se re-couper en 2 lignes à
            cette largeur. `lg:whitespace-nowrap` sur ce premier
            segment force la ligne complète même si elle déborde de la
            colonne — accepté explicitement par le client ("même si il
            y a superposition avec l'image... le fond est
            transparent"), et limité à `lg:` (pas de risque de
            débordement de PAGE sur mobile/tablette, où le segment
            reste libre de se re-couper si besoin). */}
        <h2 className="mt-4 text-4xl font-semibold text-encre sm:text-5xl">
          <span className="block lg:whitespace-nowrap">De la signature aux clés,</span>
          <span className="block">sans surprise.</span>
        </h2>
      </div>

      {/* 1. numéro + 2. titre + label — texte, peut brièvement
          s'effacer/réapparaître entre 2 étapes (contrairement à la
          maquette, qui elle ne doit jamais disparaître). Masqué sur
          `lg:` : remplacé par le bloc gauche ci-dessous (même contenu +
          compteur "01 / 05" + description + flèche, tous ensemble dans
          la colonne de texte de la nouvelle grille). */}
      <div className="mx-auto max-w-2xl text-center lg:hidden">
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

      {/* Bloc gauche desktop uniquement : numéro/total, titre, label,
          description et flèche "étape suivante" regroupés dans la
          colonne de texte (ligne 2), à côté de la maquette (colonne de
          droite). La flèche reste hors de l'`AnimatePresence` — c'est
          un contrôle de navigation stable, pas un contenu qui doit
          s'effacer/réapparaître à chaque étape. */}
      <div className="hidden lg:col-start-1 lg:row-start-2 lg:mt-10 lg:block">
        <AnimatePresence mode="wait">
          <motion.div
            key={active}
            initial={prefersReducedMotion ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={prefersReducedMotion ? undefined : { opacity: 0, y: -12 }}
            transition={{ duration: prefersReducedMotion ? 0.15 : 0.5, ease: [0.22, 1, 0.36, 1] }}
          >
            <p className="flex items-baseline gap-1 text-sm font-semibold text-laiton">
              <span>{String(active + 1).padStart(2, "0")}</span>
              <span className="text-encre-douce/40">/ {String(COUNT).padStart(2, "0")}</span>
            </p>
            <h3 className="mt-4 text-3xl font-semibold leading-tight text-encre">
              {etape.title}
            </h3>
            <span className="eyebrow mt-3 block text-xs text-laiton">
              {etape.label}
            </span>
            <p className="mt-5 max-w-sm text-base leading-relaxed text-encre-doux">
              {etape.body}
            </p>
          </motion.div>
        </AnimatePresence>
        <button
          type="button"
          onClick={() => goTo(active + 1)}
          aria-label="Étape suivante"
          className="mt-8 flex h-12 w-12 items-center justify-center rounded-full border border-encre-douce/25 text-encre transition-colors duration-300 hover:border-laiton hover:text-laiton"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
            className="h-4 w-4"
          >
            <path d="M5 12h14M13 6l6 6-6 6" />
          </svg>
        </button>
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
      {/* 10e passe client : la maquette rejoint la colonne de droite de
          la grille (`lg:col-start-2`), sur les 2 lignes du bloc gauche
          (titre de section + texte d'étape), centrée verticalement
          dedans (`lg:self-center`) — les hacks `-mt-*` du flux vertical
          empilé (rapprocher la maquette du texte au-dessus) n'ont plus
          de sens en grille et sont retirés sur `lg:` uniquement. */}
      {/* 11e passe client : "grossis-moi cette image beaucoup plus, on
          s'en fout de la superposition, je te dirai de rétrécir au cas
          où" — `lg:scale-150` plutôt que d'élargir la colonne ou la
          box elle-même : un `transform` agrandit le rendu visuel SANS
          changer la taille prise en compte par la grille (les autres
          éléments ne bougent pas), exactement ce qu'il faut pour une
          image volontairement plus grande que sa place réservée,
          autorisée à chevaucher le texte/la maquette voisine. */}
      <div className="relative -mx-6 mt-2 h-[300px] w-[calc(100%+3rem)] sm:mx-auto sm:-mt-8 sm:h-[560px] sm:w-full sm:max-w-5xl lg:col-start-2 lg:row-start-1 lg:row-span-2 lg:mt-0 lg:h-auto lg:max-w-none lg:self-center lg:aspect-[1100/614] lg:w-full lg:scale-150">
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
      {/* 10e passe client : masqué sur `lg:` — la description a
          rejoint le bloc gauche de la nouvelle grille 2 colonnes
          ci-dessus (juste après le label, avant la flèche), les hacks
          `-mt-*` de rapprochement n'ont donc plus lieu d'être à cette
          largeur. Bloc conservé tel quel pour mobile/tablette. */}
      <div className="mx-auto mt-2 max-w-md text-center sm:-mt-4 lg:hidden">
        <AnimatePresence mode="wait">
          <motion.p
            key={active}
            initial={prefersReducedMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={prefersReducedMotion ? undefined : { opacity: 0 }}
            transition={{ duration: prefersReducedMotion ? 0.15 : 0.4 }}
            className="text-base leading-relaxed text-encre-doux lg:text-lg"
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
          (plus seulement mobile) — la taille n'est plus une valeur
          fixe à remonter à chaque retour client, elle est TOUJOURS le
          maximum que la largeur du conteneur permet, à n'importe
          quelle taille d'écran (même logique que le fix mobile du
          round précédent, étendue partout). Le séparateur vertical
          passe d'un élément de flexbox (qui consommait sa propre
          largeur) à un trait positionné en absolu sur le bord de
          chaque colonne — sinon un 6e élément par étape aurait cassé
          le compte de `grid-cols-5`. */}
      {/* 9e passe client : "le texte n'est pas assez collé aux
          miniatures, l'ombre est trop loin aussi" — cause : la box de
          chaque miniature était en `aspect-square` (carrée), mais les
          illustrations elles-mêmes sont bien plus larges que hautes
          (ratio 1100×614, comme la grande maquette) — en `object-
          contain` dans une box carrée, l'image ne remplit que la
          bande centrale, laissant ~22% de vide en haut ET en bas de
          la box. L'ombre (positionnée en `%` de la box) et le
          libellé (juste après la box en flux normal) se retrouvaient
          donc loin du contenu VISIBLE, même avec un espacement CSS
          minimal — le vide était structurel, pas un simple espacement
          à resserrer. Fix : la box épouse maintenant le vrai ratio de
          l'image (`aspect-square` → `aspect-[1100/614]`), plus aucun
          vide — ombre et libellé collent enfin au contenu réel, sans
          changer la largeur (donc sans rapetisser la miniature, cf.
          8e passe "grandis x2"). */}
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
      {/* 10e passe client : sur `lg:`, la rangée quitte le flux vertical
          pour devenir la 3e ligne de la grille, étalée sur les 2
          colonnes (`lg:col-span-2`) — pleine largeur sous le texte ET
          la maquette, comme sur la maquette de référence du client. */}
      <div className="-mx-6 mt-4 grid grid-cols-5 items-start gap-x-1 px-2 sm:mx-0 sm:mt-6 sm:gap-x-3 sm:px-0 lg:col-span-2 lg:row-start-3 lg:mt-16 lg:gap-x-4">
        {ETAPES.map((e, i) => {
          const isActive = i === active;
          return (
            <div key={e.title} className="relative flex justify-center">
              {i > 0 && (
                <span
                  aria-hidden
                  className="absolute left-0 top-6 hidden h-8 w-px -translate-x-1/2 bg-encre-douce/15 sm:block lg:top-10"
                />
              )}
              <button
                type="button"
                onClick={() => goTo(i)}
                aria-label={`Aller à l'étape ${i + 1} : ${e.title}`}
                aria-current={isActive}
                className="flex w-full min-w-0 flex-col items-center gap-1 px-1 text-center"
              >
                <motion.div
                  animate={{
                    scale: isActive ? 1 : 0.72,
                    filter: isActive
                      ? "blur(0px) saturate(1) brightness(1)"
                      : "blur(1.5px) saturate(0.35) brightness(0.85)",
                  }}
                  transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                  className="relative w-full aspect-[1100/614]"
                >
                  <div
                    aria-hidden
                    className="absolute inset-x-[22%] bottom-[2%] h-[8%] rounded-[50%] bg-encre/15 blur-sm"
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
