# Bellora Homes

Refonte du site bellora-homes.com — Next.js (App Router) + Tailwind CSS v4,
direction créative "Apple meets Liquid Glass". Contenu réel transcrit depuis
le site actuel (accueil, 3 gammes, modèles, contact, mentions légales, CGV,
confidentialité) ; `/atelier` reste un stub, cette page n'existe pas encore
sur le site actuel.

## Démarrer

```bash
npm install
npm run dev
```

## Ce qui est en place

- **Design tokens** (`src/app/globals.css`) : palette Bellora (Brume, Ciel,
  Encre, Forêt, Laiton), typo Inter 400/500/600 uniquement, jamais de mode
  sombre.
- **Liquid Glass** (`src/components/GlassFilter.tsx`, `GlassPanel.tsx`) :
  filtre SVG `feTurbulence` + `feDisplacementMap` avec repli en blur simple
  via `@supports`, réservé à la nav et aux petites cartes.
- **Hero scroll-scrubbed** (`src/components/Hero.tsx`) : vidéo jamais lue en
  autoplay, `video.currentTime` piloté par la progression du scroll.
- **Nav** (`src/components/Nav.tsx`) : Concept/Gammes/Modèles/Procédé,
  ancres vers les sections de l'accueil, menu mobile sans flash au
  chargement.
- **Contenu réel des gammes** (`src/lib/gammes.ts`) : vrais prix (Primaire
  76 134 €, Premium 80 888 €, Prestige 88 763 € TTC), descriptions,
  configurations, témoignages — partagé entre la preview accueil, les 3
  pages de gamme et `/modeles`.
- **Simulateur de rentabilité** (`src/components/RentabiliteCalculator.tsx`) :
  calcul réel (surface/région/type de location), calibré pour reproduire
  l'exemple du site actuel (60 m², défaut → 4 300 €/mois, 36 122 €/an,
  2,4 ans).
- **Tunnel de contact en 4 étapes** (`src/components/ContactClient.tsx`) :
  projet → gamme/surface/budget → terrain → coordonnées.
- **Pages légales** : mentions légales, CGV, confidentialité — texte réel du
  site actuel ; SIRET/raison sociale/hébergeur restent des placeholders (le
  site actuel ne les indique pas non plus).
- **Visuels produit par gamme** (`src/lib/gammes.ts`, champ `imageUrl`) :
  rendus IA Higgsfield cohérents entre les 3 gammes (même univers lumineux,
  matériaux qui montent en gamme), utilisés sur la preview accueil et le
  hero de chaque page de gamme — à remplacer par un vrai shooting.
- **Glass étendu + micro-interactions** : tuiles chiffres clés, badges
  savoir-faire, CTA finale, bouton du hero, calculateur ; reflet ambiant
  lent sur le chrome permanent (nav) vs reflet au survol uniquement sur les
  cartes interactives ; entrées animées au scroll et parallax léger au
  survol (`TiltCard.tsx`, Framer Motion) sur la quasi-totalité des cartes.
  Les taches de couleur floutées (`GlowField.tsx`) utilisées un temps
  derrière les tuiles/gammes/3-piliers ont été jugées trop décoratives et
  pas assez premium ("cheap") — le composant a été retiré du site entier.
- **Calculateur de rentabilité** (`RentabiliteCalculator.tsx`) : vrai
  liquid glass — flotte sur une photo plein cadre (coucher de soleil sur
  montagnes, `CALCULATOR_BG_URL`), assez transparent pour que le blur
  révèle vraiment la scène derrière, halo doré autour (`glass-graphite`),
  slider custom (`PremiumSlider.tsx`), chiffres qui s'animent au changement
  (`AnimatedNumber.tsx`).
- **Performance vidéo du hero** : le scroll vers l'avant utilise
  `video.play()` + un `playbackRate` proportionnel au retard à rattraper
  (lecture séquentielle, que les décodeurs gèrent nativement bien) —
  confirmé fluide. Le scroll vers l'arrière ne peut pas jouer la vidéo à
  l'envers ; un premier essai de cache de frames faisait un **warmup
  complet bloquant** (lisait toute la vidéo une fois, caché derrière un
  poster, avant d'activer le scroll) — abandonné, le warmup pouvait
  prendre plusieurs secondes pendant lesquelles le hero restait
  entièrement figé (aucune animation, avant comme arrière), pire que le
  problème qu'il cherchait à résoudre. La version actuelle construit le
  même cache (`<canvas>` + `createImageBitmap`, une image toutes les
  0,2s) de façon **opportuniste et non bloquante** : à chaque frame où la
  vidéo joue déjà normalement vers l'avant (le cas courant), on capture
  au passage l'image courante — gratuit, le décodeur l'a de toute façon
  déjà sous la main pour l'affichage. Le scroll vers l'arrière pioche
  dans ce cache s'il a de quoi (dessiné sur le canvas, aucun seek) ; sinon
  repli sur le seek throttlé habituel — jamais pire qu'avant, potentiellement
  bien mieux une fois qu'une partie de la vidéo a déjà été vue en avançant
  (le cas d'usage normal : on descend d'abord, on remonte ensuite).
  **Bug réel corrigé au passage** : la première version de ce cache
  recalculait la position "affichée" à partir de `progress` à chaque
  frame dès qu'on montrait le canvas — ça annulait l'écart avec la cible
  en continu et gelait tout le scroll arrière après la toute première
  image affichée. Remplacé par une variable persistante, mise à jour
  uniquement quand une nouvelle position est réellement affichée (vidéo
  ou frame du cache), comme dans la version qui fonctionnait avant. La
  netteté au scroll arrière reste une limite connue de la vidéo source
  720p (cf. section "à faire"). **Pas d'attribut `poster`** sur le
  `<video>` : le
  calque `<img>` séparé qui le montrait (avec son propre fondu JS) créait
  un "cut" visible dès le premier mm de scroll, et il s'est avéré que le
  problème n'était pas le fondu en lui-même mais les deux images —
  l'image de référence générée et la première frame de la vidéo sont deux
  plans différents (angle, cadrage). Aucune transition ne peut masquer un
  changement de plan ; la seule vraie correction est de ne jamais montrer
  que la vidéo, jamais une autre image à la place.
- **Hero : texte et CTA alignés à gauche** (`items-start text-left`),
  plutôt que centrés, pour rester dans la zone basse-gauche de la vidéo
  comme sur la maquette de référence.
- **Vague hero → 3 piliers** : l'effet d'herbe qui montait en premier plan
  a été abandonné (trop de complexité pour peu de valeur, et lié au
  chantier vidéo) ; à la place, une vague — un aplat plein (SVG, forme à 3
  bosses, plus dynamique qu'une simple sinusoïde à 2 bosses) teinté brume
  comme le fond de la section des 3 piliers qui suit (transition dans la
  continuité de la couleur, pas de séparation visible), avec son contour
  traité en une vraie ligne de lumière liquid glass (`.wave-rim` — cœur
  quasi blanc, halo chaud en laiton, `filter: drop-shadow`), collée au bas
  du hero. Deux itérations de révélation ont été rejetées : un fondu à
  seuil (temps mort avant la fin du scroll) puis un balayage `clip-path`
  gauche→droite (lisait comme "apparaît petit bout par petit bout"). La
  version actuelle ne révèle jamais la forme progressivement — elle existe
  toujours entière, plus large que l'écran (24% de largeur en plus, cachée
  par l'`overflow-hidden` du conteneur sticky) — et arrive par un fondu
  rapide (12% de la fenêtre de révélation — un vrai flash net, terminé
  bien avant la fin de la montée) + une montée depuis hors-champ + un
  glissement horizontal continu vers la droite en même temps, pour
  simuler une vague qui bouge. Liée en continu à la progression du scroll
  jusqu'à la toute fin (`WAVE_REVEAL_END = 1`, pas de temps mort avant le
  changement de section), scrubbable dans les deux sens. Timing recalibré
  ensuite : mouvement jugé pas assez franc mais l'ensemble trop court —
  fenêtre de scroll allongée (`WAVE_REVEAL_START` abaissé de 0.68 à 0.52)
  tout en faisant compléter la montée et le glissement plus tôt dans cette
  fenêtre (un tiers au lieu de plus de la moitié) et en doublant
  l'amplitude du glissement horizontal, pour un mouvement plus rapide et
  plus dynamique sur une durée totale plus longue.
- **Hero : entrée du titre mot par mot** : le bloc eyebrow/titre/CTA
  n'avait jusqu'ici aucune animation propre. Un premier essai faisait
  entrer chaque bloc (eyebrow, titre entier, bouton) en un seul morceau
  puis effaçait tout le texte dès le début du scroll — corrigé sur retour
  explicite : le texte doit **rester visible** sur le hero, et l'entrée
  doit se faire **mot par mot** plutôt que bloc par bloc. Le titre est
  maintenant découpé en mots, chacun un `motion.span` avec son propre
  délai (Framer Motion `staggerChildren`), fondu + léger glissement vers
  le haut, courbe "ease-out-expo" cohérente avec le reste du site ; le
  bouton entre juste après. Plus aucun effacement au scroll. Respecte
  `prefers-reduced-motion` (texte affiché directement, sans animation).
  Au passage, l'espacement entre le titre et le bouton (`mt-10`) était
  trop court pour la taille du titre et laissait le bouton chevaucher le
  jambage du "g" de "engagement." — passé à `mt-14`, jugé ensuite trop
  loin ("espacement pas premium") — recalibré à `mt-11`.
- **Hero : halo du bouton CTA, bug "boule" corrigé** : le bouton passe par
  `GlassPanel` (`tone="dark"`) avec un halo doré dédié (`.hero-cta`) pour
  être plus lumineux qu'un simple `.glass-dark`. Deux itérations rejetées
  avant la version actuelle, un vrai bug de rendu et pas une erreur de
  classe : (1) le halo en `filter: drop-shadow` recalcule l'ombre à partir
  du contenu réellement rendu à chaque frame — combiné au reflet ambiant
  du bouton (`.glass-sheen`, un `::before` animé qui balaie en boucle),
  l'ombre "suivait" ce reflet en mouvement, vue comme une grosse tache
  floue qui traverse le bouton ("on voit littéralement une boule passer") ;
  (2) passage à `box-shadow` (qui ne réagit qu'à la géométrie de la boîte,
  jamais au contenu) a bien réglé la boule, mais le reflet `.glass-sheen`
  lui-même débordait visuellement du bouton (barre diagonale dépassant
  largement la pilule), malgré un `overflow: hidden` + `border-radius`
  confirmés corrects sur l'élément (vérifié via `getComputedStyle`, puis
  confirmé en retirant la classe `.glass-sheen` en direct dans le DOM du
  navigateur — la barre disparaît instantanément). Solution retenue :
  pas de reflet ambiant sur ce bouton précis, seulement le halo doré
  statique en `box-shadow` (redéclarant au passage les valeurs de base de
  `.glass-dark`, puisqu'un seul `box-shadow` peut s'appliquer par élément)
  — déjà largement assez lumineux à lui seul, et sans aucun artefact. Sur
  le vrai fond vidéo (herbe/ciel clairs, pas le placeholder sombre), ce
  halo seul ne suffisait plus : sans aucun reflet, le bouton lisait comme
  un pavé mat "cheap". Ajout d'un reflet fixe (`::before`, dégradé blanc
  diagonal statique, jamais animé) pour retrouver la brillance liquid
  glass sans réintroduire le bug de débordement — une transform qui ne
  bouge jamais n'est pas promue sur son propre calque de composition de
  la même façon qu'une transform animée, donc `overflow: hidden` continue
  de la clipper correctement. Toujours jugé "pas liquid" ensuite — le
  reflet statique restait trop discret pour lire comme du verre. Renforcé :
  `backdrop-filter` avec `saturate/contrast/brightness` en plus du blur
  (fait davantage "réfracter" ce qu'il y a derrière — l'effet le plus
  proche d'une loupe qu'on puisse faire sans le filtre SVG, cf. point
  suivant), rim net et clair en haut + ombre nette en bas du panneau
  (courbure d'un verre bombé plutôt qu'un panneau plat), et le reflet
  fixe passé d'un dégradé linéaire diagonal à un highlight radial
  concentré en haut à gauche — lit davantage comme un point de lumière
  réel sur une surface bombée qu'un simple voile. Deux derniers défauts
  signalés ensuite : le halo doré (`0 0 22px` / `0 0 52px`, non-`inset`)
  peint par définition HORS de la boîte — un box-shadow non-inset n'est
  jamais "cropé" dans l'élément, c'est justement son rôle de déborder ;
  sur un fond vidéo clair et changeant, ce flou dilaté devenait une tache
  très visible qui semblait "sortir" du bouton de façon incohérente selon
  ce qu'il y avait juste en dessous. Remplacé par un liseré doré en
  `inset` (contenu par construction, ne peut techniquement pas déborder).
  Le fond `.glass-dark` (55% de noir) était par ailleurs trop sombre sur
  un fond vidéo déjà clair — éclairci à 40% + `brightness(1.1)` sur le
  backdrop-filter. Refonte finale sur référence visuelle fournie par le
  client (pilule claire, bordure fine uniforme, flèche à droite) : fond
  encore plus translucide, `border` réécrite en entier pour être uniforme
  sur les 4 côtés (`.glass-dark` la déclare plus claire en haut/à gauche
  qu'en bas/à droite — cassait l'anneau net de la référence), flèche SVG
  ajoutée à droite du libellé. Un vrai bug de cascade a aussi été trouvé et
  corrigé au passage : `.hero-cta` était déclaré AVANT le bloc `@supports
  (backdrop-filter: url(#glass-distortion))` qui redéclare le
  `backdrop-filter` de `.glass-dark` — sur un navigateur qui supporte ce
  filtre SVG, cette redéclaration plus tardive dans le fichier gagnait la
  cascade et écrasait silencieusement le `backdrop-filter` du bouton
  (retour à un `blur(8px)` non désiré, invisible depuis ce bac à sable
  puisque son Chromium échoue ce test `@supports`). `.hero-cta` déplacé
  après ce bloc pour toujours gagner, quel que soit le navigateur.
  Dernier calibrage, demandé avec des valeurs précises : verre moins
  opaque (fond éclairci à 15%/3% au lieu de 24%/8%), blur porté à 44px
  ("énorme"), un halo doré résiduel à 5% d'opacité seulement (`0 0 48px
  rgba(173, 138, 85, 0.05)`), et surtout un reflet qui se déplace en
  continu très lentement (boucle de 9s) plutôt qu'un point de lumière fixe
  — avec, au survol, un bouton qui "gonfle" légèrement (`scale(1.035)`) et
  un reflet rapide qui glisse une fois de gauche à droite. Le reflet mobile
  est fait via `background-position` animé sur le dégradé lui-même
  (`@keyframes hero-cta-sheen-idle`/`-hover`), délibérément PAS via un
  pseudo-élément `::before` en `position: absolute` + `transform` comme
  `.glass-sheen` ailleurs sur le site — c'est exactement ce mécanisme qui
  causait le bug de débordement documenté au point 2) plus haut. Un
  dégradé peint en `background-image` de l'élément lui-même est toujours
  clippé nativement par son propre `border-radius`, sans avoir besoin
  d'un `overflow: hidden` sur un enfant positionné séparément — aucune des
  conditions du bug précédent n'est réunie. Vérifié via Playwright sur un
  cycle complet de la boucle lente (captures toutes les ~2s, large marge
  autour du bouton) et sur le survol : rien ne déborde des bords à aucun
  moment. `prefers-reduced-motion` coupe l'animation et le hover (vérifié
  via `getComputedStyle`).

  Dernière itération : le client a fourni directement un extrait de code
  CSS à reprendre. Repris quasiment tel quel : fond redevenu une teinte
  blanche PLATE (`rgba(255,255,255,0.14)`, plus de dégradé) plutôt qu'un
  dégradé, blur redescendu de 44px à 26px (44px lisait plus comme un flou
  photo que comme du verre), et surtout le halo doré n'est plus un
  `box-shadow` — c'est maintenant un vrai second calque DERRIÈRE le
  bouton (`::before`, `z-index: -1`, `inset: -18px` pour déborder
  volontairement de 18px tout autour, façon "le soleil traverse le
  verre"). Ce point mérite d'être noté : plus haut, un halo non-inset
  avait été rejeté précisément parce qu'il "sortait" du bouton — la
  différence ici est que ce débordement est explicitement voulu et
  demandé, pas un artefact accidentel, donc pas la même situation. Ce
  pseudo-élément reste STATIQUE (jamais animé), donc aucune des
  conditions du bug de débordement documenté plus haut n'est réunie (ce
  bug touchait spécifiquement un pseudo-élément animé en `transform`).
  `overflow: visible` a dû être ajouté sur `.hero-cta` pour laisser ce
  halo déborder (`GlassPanel` pose `overflow-hidden` par défaut) — sans
  incidence sur le reflet animé, qui reste peint en `background-image`
  sur l'élément lui-même et donc toujours clippé nativement par son
  `border-radius`, qu'il y ait `overflow: hidden` ou non. Le reflet est
  aussi passé d'une bande nette (un seul pic lumineux) à un dégradé à 5
  arrêts beaucoup plus progressif — jugé "trop blanc" sinon. Texte
  recalé sur les valeurs fournies (`#faf8f3`, `font-weight: 600`,
  `text-shadow: 0 1px 6px rgba(0,0,0,.12)`) : plus proche d'un blanc
  chaud que le `text-brume` générique utilisé ailleurs, légèrement plus
  gras, avec un liseré d'ombre pour rester lisible sur un fond vidéo très
  clair. Revérifié intégralement via Playwright (cycle complet de la
  boucle + survol) : le halo déborde bien comme voulu sans aucun autre
  artefact, `getComputedStyle` confirme les valeurs exactes appliquées.
- **Gammes : pastilles de catégorie sans effet loupe** : les pastilles
  Primaire/Premium/Prestige (`.glass`, ton clair) posées sur une vraie
  photo colorée lisaient comme un simple sticker blanc plat. La
  réfraction SVG (`url(#glass-distortion)`, `feTurbulence` +
  `feDisplacementMap` dans `GlassFilter.tsx`) n'est fiable que sur
  Chromium récent — le `@supports` qui la gate échoue silencieusement
  ailleurs (Safari, Firefox, et vraisemblablement le navigateur mobile de
  test), laissant seulement un blur plat sans aucune réfraction. Plutôt
  que de modifier `.glass` partagé avec la nav (déjà validée), une classe
  dédiée `.gamme-badge` ajoute un `backdrop-filter` plus saturé/contrasté
  et un rim haut clair + ombre basse (même traitement que le CTA du hero
  ci-dessus) pour reconstituer l'effet verre en CSS pur, sans dépendre du
  filtre SVG. Ce `saturate(220%)` s'est révélé être une erreur : sur un
  fond aussi translucide, saturer autant amplifie la couleur de la PHOTO
  derrière plutôt que celle du verre lui-même — chaque pastille prenait la
  teinte de sa propre photo (ciel bleu, coucher de soleil orange, ciel
  violet) et les trois lisaient comme trois éléments différents plutôt
  qu'un même système, plus proche du plastique teinté que du verre. Fond
  remonté à une opacité franchement blanche (0.88 → 0.62, contre le fond
  quasi transparent de `.glass`) pour rester visuellement stable quelle
  que soit la photo dessous, `saturate` ramené à 140% — la cohérence et le
  rim/reflet portent l'effet verre plutôt que la saturation du fond.
- **Hero mobile : retour à la ligne du titre corrigé** : le titre wrappait
  de façon disgracieuse sur mobile ("que" isolé en fin de ligne). Un `<br>`
  forcé (visible uniquement sous `sm:`) est inséré juste avant le mot
  "que" dans `TITLE_WORDS.map`, sans toucher au wrap naturel des autres
  mots ni à l'entrée mot-par-mot en Framer Motion — le titre casse
  maintenant proprement en "Une qualité" / "aussi noble" / "que notre" /
  "engagement." sur petit écran.
- **Notre histoire** : un habillage photo (forêt embrumée en fond +
  cadrage de branches détourées), puis une version avec panneau liquid
  glass + icône + ligne dorée sur fond plat, ont été essayés pour cette
  section puis entièrement annulés sur demande explicite — retour à
  l'exact original (`bg-brume-2`, texte centré simple, sans glass ni
  icône). Vérifié identique à l'octet près à la version d'avant ces essais.
  Chiffres clés garde en revanche son panneau liquid glass + icône dorée
  par statistique (bouclier/camion/hexagone — la France comme
  "l'Hexagone"), sur fond plat — non concerné par cette demande de retour
  en arrière. Contenu textuel des deux sections identique à l'original.
  **Fusionné ensuite avec Chiffres clés** (sur référence visuelle du
  client) : les deux sections, jusque-là séparées, sont devenues un seul
  bloc à deux colonnes — texte à gauche, à droite une timeline horizontale
  où les 3 chiffres (garantie, livraison, fabrication France) défilent un
  par un. Un seul chiffre à la fois est "actif" : il quitte le fil pour se
  poser dans une carte liquid glass élevée au-dessus de la ligne (texte
  plus grand, ombre) pendant que les deux autres restent à plat sur la
  ligne, atténués (opacité 40%). Compteur "0X / 03" au-dessus. La carte
  active se déplace d'un chiffre à l'autre via `layoutId` (Framer Motion
  anime automatiquement la transition de position/taille — le "FLIP"
  classique, pas un fondu brut) ; la ligne elle-même se remplit en doré
  jusqu'au chiffre actif. Boucle automatique toutes les 3 secondes
  (`setInterval`), ET cliquable manuellement — le minuteur repart de zéro
  à chaque changement d'actif (autoplay ou clic), pour qu'un clic ne soit
  jamais aussitôt écrasé par l'avancement automatique (vérifié : cliquer
  puis attendre 2,5 s ne fait pas changer l'actif). `KeyFigures.tsx`
  supprimé (entièrement absorbé dans `NotreHistoire.tsx`), son import
  retiré de `page.tsx`. Premier jet cassé sur mobile : le texte de chaque
  chiffre était en `whitespace-nowrap`, ce qui forçait la ligne des 3
  éléments à dépasser la largeur de l'écran (le classique "grid/flex
  blowout" — un enfant en `nowrap` impose sa largeur de contenu minimale
  au parent flex, qui ne peut pas la comprimer sans `min-w-0`) ; texte du
  débordant hors-cadre. Corrigé : `whitespace-nowrap` retiré (le texte
  wrappe proprement, centré), tailles de police et espacements rendus
  responsive (base mobile → `sm:` → `lg:`), `min-w-0` posé sur les
  colonnes de la grille et les boutons du carrousel pour qu'ils puissent
  se comprimer plutôt que de repousser toute la section hors du
  viewport.

  Carte du chiffre actif jugée ensuite trop petite et "pas liquid glass"
  par rapport à une seconde référence visuelle, plus proche : deux causes
  distinctes. La taille était réglée trop petit (texte, padding) — corrigé
  en l'augmentant nettement (`text-3xl`/`sm:text-5xl` en gras, carte de
  largeur fixe `140px`/`sm:200px` pour forcer "4–12" et "semaines" sur
  deux lignes comme la référence, plutôt que sur une seule ligne étirée).
  Mais surtout, un vrai bug trouvé au passage : la carte utilisait `.glass`
  standard, dont le `box-shadow` d'élévation est non-inset — et
  `GlassPanel` pose `overflow: hidden` par défaut, qui clippe ce genre
  d'ombre à la frontière de l'élément (même bug que celui déjà trouvé sur
  `.glass-graphite`). La carte perdait donc l'ombre qui la fait "flotter"
  au-dessus de la ligne — et sur un fond `bg-brume-2` presque de la même
  teinte que le verre lui-même, sans cette ombre il ne restait plus rien
  pour la distinguer comme un objet en verre plutôt qu'un aplat. Classe
  dédiée `.figure-card` (même famille que `.hero-cta`/`.gamme-badge`) :
  fond plus opaque, `overflow: visible` pour laisser respirer une vraie
  ombre d'élévation à deux niveaux, reflet spéculaire radial statique.
  Au passage, un petit trait doré horizontal ajouté entre les deux
  paragraphes du texte, détail visible sur la référence.

  Retour ensuite (en anglais, ton direction artistique) : la carte "lit
  comme un mockup, pas Apple" — blanche, typo trop grosse ("4–12
  semaines" débordait), transition pas assez fluide. `.figure-card`
  entièrement recalibrée dans un sens plus retenu : opacité de fond
  réduite drastiquement (0.92→0.68 puis 0.22→0.06 — le premier essai
  restait assez couvrant pour ne rien laisser deviner du flou derrière,
  donc lisait comme un carré blanc plutôt que du verre), un grain SVG
  très léger ajouté (`feTurbulence` en data URI, `opacity: 0.035` —
  texture de verre dépoli plutôt qu'un aplat numérique trop lisse), le
  gros highlight spéculaire remplacé par un rim fin et discret, l'ombre
  d'élévation adoucie. Typo réduite (`text-5xl font-bold` → `text-3xl
  font-semibold`) et carte élargie (200px → 232px) en parallèle pour que
  "4–12 semaines" respire au lieu de déborder. Transition `layoutId`
  assouplie (`stiffness: 350 → 260`, `damping: 32 → 34`, `mass: 0.9`
  ajouté) pour un glissement moins ressort/plus posé. Toutes les valeurs
  volontairement basses — l'idée demandée était que l'effet "passe presque
  inaperçu" plutôt que de se faire remarquer.
- **Notre histoire : illustration low-poly en fond de section** — fournie
  directement par le client (collée dans le chat, pas un rendu Higgsfield ;
  une première tentative de génération a été explicitement refusée : "utilise
  l'image que j'ai joint n'en crée plus"). Intégrée en `public/images/
  notre-histoire-landscape.png`, plaquée en bas de la section
  (`object-cover object-bottom` dans un conteneur de hauteur fixe,
  responsive `h-40 sm:h-56 lg:h-72`). Le fichier source affichait un damier
  gris/blanc "transparence factice" (peint dans les pixels par l'outil qui
  l'a généré, pas un vrai canal alpha — confirmé via les métadonnées du
  fichier, `hasAlpha: false`) derrière les arbres/chemin/lac/montagne. Un
  simple recadrage rectangulaire ne suffisait pas : le ciel en damier ne
  forme pas une bande horizontale nette, il serpente entre les sapins et la
  montagne qui dépassent dedans par endroits — recadrer assez haut pour
  effacer tout le damier aurait aussi coupé les arbres. Le fichier a donc
  été retraité (détourage chromatique) : les pixels du damier sont gris pur
  et très clairs (canaux R=G=B, valeur ≥ 236), une signature qu'aucune
  couleur du dessin (vert du feuillage, sable, lac) ne partage — ces pixels
  passent à alpha 0, ce qui donne au PNG une vraie transparence. Un léger
  dégradé CSS (`mask-image`) fond ensuite le bord recadré dans le
  `bg-brume-2` de la section.

  Jugé ensuite "pas bien du tout" une fois vu en contexte réel (bande pleine
  largeur en bas de section, trop présente) — le client demande cette fois
  explicitement une génération ("fais l'image toi, je te fais confiance"),
  contrairement à l'itération précédente. Régénérée via Higgsfield
  (`nano_banana_pro`) avec, cette fois, un fond plein `#EFEDE4` demandé
  directement dans le prompt (= `--brume-2` exact) plutôt qu'un fond
  "transparent" factice : plus besoin de détourage ni de fondu, l'image se
  pose telle quelle sans aucune couture visible. URL Higgsfield stockée dans
  `src/lib/media.ts` (`NOTRE_HISTOIRE_LANDSCAPE_URL`, même convention que
  `HERO_MEDIA`/`CALCULATOR_BG_URL` — pas rapatriée en local, `public/images/
  notre-histoire-landscape.png` supprimé). Recomposée en plus petit format
  portrait, cadrée à gauche uniquement (`hidden sm:block`, largeur fixe
  `w-40`/`sm:w-48`) plutôt qu'en bande pleine largeur, pour rester discrète.
  Positionnement revu au passage : un premier essai en overlay `absolute
  bottom-0` chevauchait la dernière ligne du titre — sur une section aussi
  courte, le texte occupe déjà presque toute la hauteur disponible, un
  élément ancré au bas de la section n'a nulle part où se loger sans
  recouvrir le texte au-dessus. Repositionnée dans le flux normal, sous le
  dernier paragraphe de la colonne de texte, ce qui élimine le risque de
  chevauchement par construction plutôt que par un réglage de hauteur
  ajusté au pixel.

  Jugée "nulle" une fois vue en contexte réel (troisième itération, toujours
  pas convaincante) — abandonnée entièrement, retour à la section sans
  illustration. Au passage, un effet de bord expliquait la seconde partie du
  retour client sur l'alignement : le grid à deux colonnes utilise
  `lg:items-center`, qui centre verticalement chaque colonne comme un bloc
  dans la hauteur de la ligne — avec l'image, la colonne de texte devenait
  plus haute que la colonne carrousel, ce qui décalait visuellement l'eyebrow
  "NOTRE HISTOIRE" par rapport au compteur "0X/03" (qui ne partaient plus au
  même niveau). Simplement retirer l'image restaure des hauteurs de colonne
  proches et donc l'alignement d'origine — vérifié après coup, les deux
  repères sont de nouveau à la même hauteur. `NOTRE_HISTOIRE_LANDSCAPE_URL`
  retiré de `src/lib/media.ts`.

  Quatrième itération, cahier des charges très précis fourni par le client
  (deux images de référence + liste de consignes). Carte active (`.figure-card`
  dans `globals.css`) entièrement retravaillée : verre fumé teinté forêt/sauge
  (`rgba(38,48,38,…)` + dégradé `rgba(114,132,102,…)` → `rgba(24,32,24,…)`,
  overlay non plus blanc translucide) plutôt que blanc, texte en ivoire
  (`#FAF8F3`, comme le bouton du hero) pour rester lisible sur ce fond plus
  sombre, halo chaud diffus derrière la carte (`::after`, même procédé que le
  halo du bouton hero — déborde volontairement, `overflow: visible` sur le
  parent). Or (`laiton`) désormais réservé au point actif de la timeline, au
  numéro d'étape ("01"), et à une fine hairline en bas de carte — retiré de
  partout ailleurs. Étapes inactives légèrement renforcées (`opacity-40` →
  `opacity-55`) pour rester lisibles sans concurrencer l'actif.

  Illustration de fond redemandée, cette fois en pleine largeur (pins à
  gauche, eau/soleil à droite, comme la référence) plutôt qu'en petit format
  cadré à gauche. Le client a fourni directement le fichier (collé dans le
  chat une seconde fois, avec l'instruction explicite "utilise la photo que
  je t'envoie génère pas") : même technique de récupération que la première
  fois (le fichier n'existe sur aucun chemin accessible en Bash — récupéré
  depuis le JSONL de la session, où les images collées sont encodées en
  base64 dans les blocs de message). Contrairement au tout premier essai,
  cette image a un ciel en dégradé doux nativement très proche de
  `--brume-2` (pas de damier de transparence factice) : un simple fondu CSS
  (`mask-image`) en haut suffit, sans détourage chromatique.

  Composition "remontée" comme demandé (moins de ciel vide) : recadrée via
  `object-position: bottom` dans un conteneur bien plus court que l'image
  native, pour ne garder que sa bande basse (environ les 60% inférieurs,
  calculé pour montrer les sapins en entier plutôt que de couper leurs
  cimes). Hauteur de ce conteneur et `padding-bottom` de la section calibrés
  ensemble et vérifiés par script (comparaison des rectangles DOM du titre et
  de l'image) plutôt qu'au jugé : le bug de chevauchement rencontré à
  l'itération précédente (image ancrée en bas qui mange la dernière ligne du
  titre) s'est reproduit une première fois pendant les réglages — cette fois
  détecté et corrigé avant livraison, pas après un nouveau retour client.

  Jugée ensuite "beaucoup trop imposante" — traitée comme un hero de fond
  plutôt que comme une "frise paysagère discrète" (mot du client) en bas de
  section. Cahier des charges très précis fourni, y compris un extrait CSS
  de référence (`height: 32%`, `object-fit: cover`, masque 4-arrêts,
  `opacity: 0.72`) : repris dans l'esprit plutôt que copié tel quel (un
  `height` en `%` ne peut pas se résoudre sur un ancestor à hauteur `auto` —
  toute la section l'est, dictée par son contenu). Bande ramenée à
  ~150-190px (≈ 18-30% de la hauteur de section selon le viewport, mesuré),
  `z-index: 0` explicite sous le contenu (`z-10` sur le bloc de contenu),
  masque vertical à 4 arrêts beaucoup plus progressif que le fondu précédent
  (`transparent 0% → 15% à 20% → 80% à 50% → opaque 100%`, repris tel quel
  du CSS fourni), légère désaturation/contraste (`saturate-[.82]
  contrast-[.94]`, jamais de flou), aucune ombre. Masquée entièrement en
  dessous du breakpoint `sm` plutôt que réduite à une bande trop fine pour
  être lisible. `padding-bottom` de la section ramené à des valeurs proches
  du reste du site (`pb-24`/`sm:pb-40`/`lg:pb-40`, contre jusqu'à `40rem` à
  l'itération précédente) pour supprimer le grand vide entre texte et
  décor. Fichier image vérifié identique (`md5`) à celui déjà utilisé : ce
  n'était pas "la mauvaise image" comme d'abord suspecté par le client, seul
  l'habillage CSS était en cause. Recalibré par le même script de
  comparaison de rectangles DOM (titre vs image) qu'à l'itération
  précédente, cette fois avec une marge de sécurité plus généreuse.

  Retour inverse ensuite : "trop floue et trop basse", sapins et lac plus
  reconnaissables. Cause exacte identifiée : le masque 4-arrêts repris du
  CSS client restait sous 80% d'opacité jusqu'à 50% de la hauteur — combiné
  à `opacity: 0.72` et à la désaturation, la portion "nette" de la bande
  n'était en réalité jamais pleinement opaque, d'où le délavage. Masque
  simplifié à 2 arrêts (`transparent 0% → opaque 28%`, la quasi-totalité de
  la bande reste ensuite à 100%), opacité remontée à 0.95, désaturation
  quasi neutre (`saturate-[.94] contrast-[.98]`). Deuxième bug trouvé en
  vérifiant : à largeur de bande égale, `object-fit: cover` "zoome"
  d'autant plus fort verticalement que le viewport est large (l'image doit
  couvrir une largeur croissante, donc s'agrandit, donc sa portion visible
  en hauteur rétrécit proportionnellement) — la hauteur fixe qui montrait
  les sapins en entier sur tablette les faisait complètement sortir du
  cadre sur desktop. Recalibré séparément par breakpoint (350px sur
  tablette, 460px sur desktop — un compromis : monter à la hauteur qui
  montre les sapins en entier à 100% aurait ramené la bande à la taille du
  hero jugée trop imposante à l'itération précédente ; à 460px les sapins
  sont visibles avec seulement l'extrême pointe des deux plus hauts prise
  dans le fondu). `padding-bottom` recalculé en conséquence pour remonter
  la bande et resserrer l'écart avec le texte (vérifié par script : ~35px
  d'écart sur les deux breakpoints, contre 79-130px selon les réglages
  intermédiaires testés en cours de route).
- **Hero : bouton CTA jugé trop petit** — `text-sm` (14px) à côté d'un
  titre en `text-6xl`+ lisait comme sous-dimensionné pour l'action
  principale du hero. Remonté à `text-base` (16px) avec un padding
  légèrement plus généreux (`py-4 pl-8 pr-7`, contre `py-3.5 pl-7 pr-6`) ;
  l'icône flèche (`h-4 w-4`) restait déjà proportionnée au nouveau texte,
  pas touchée.

  **Pivot stratégique complet** ensuite : "j'ai l'impression que tu as posé
  une grande illustration derrière mon interface, ce n'est pas l'effet
  recherché". Quatre itérations de photo/illustration en fond de section
  (client → régénérée → annulée → régénérée pleine largeur → recadrée en
  frise) abandonnées entièrement au profit d'une direction "Apple
  2026"/less-is-more : le contenu (texte + carte + timeline) redevient le
  héros de la section, le décor n'apporte plus que de la profondeur
  (`<20%` de l'attention visuelle demandé).

  Décor entièrement refait à la main en SVG plutôt qu'en photo — même
  esprit que `PlantShadow` sur `ThreePiliers` (silhouette abstraite, pas
  une image) : une petite colline bas-gauche avec 2 pins minimalistes (deux
  triangles empilés, pas de détail réaliste), deux rochers, un chemin dont
  le trait s'estompe par dégradé de `stroke` plutôt que de s'arrêter net
  (`HillDecor`) ; une petite rive bas-droite avec de l'eau calme (quelques
  lignes fines, pas une surface pleine) et un reflet doré réduit à un
  simple trait dégradé de 3px (`ShoreDecor`, "extrêmement discret" — plus
  de soleil ni de grand miroir). Couleurs choisies proches du fond de
  section plutôt que puisées dans les tokens du site (`#EDE6D6`, `#5B6E56`,
  `#8FA0AC`…) : les tokens existants (`--foret`, `--laiton`) sont pensés
  pour un usage à pleine saturation (texte, accents), pas pour une touche
  quasi invisible qui se fond dans `--brume-2`. `z-index: 0` sous le
  contenu (`z-index: 10`), révélé au scroll comme le reste du site.

  Carte active reprise une nouvelle fois — le retour client était explicite
  : "surtout pas un rectangle blanc avec un fond vert". La teinte
  forêt/sauge reste (déjà validée), mais le fond passe de 0.55 à 0.24
  d'opacité et le blur de 20px à 30px : au-dessus d'un fond quasi neutre
  (`--brume-2`) et d'un décor lui-même très pâle, une opacité aussi réduite
  aurait auparavant fait disparaître la carte — désormais qu'il y a du
  décor (même discret) à réfracter derrière, la transparence peut
  vraiment se voir. Rayon de coin élevé à `32px` (coins "très doux"). Un
  halo interne ajouté en `box-shadow` `inset` (chaleur diffuse à
  l'intérieur du verre, sans consommer un troisième pseudo-élément — les
  deux existants, `::before`/`::after`, sont déjà pris par le reflet
  spéculaire statique et le halo externe). Troisième couche ajoutée,
  inédite sur le site : un reflet qui suit vraiment la souris. Techniquement
  impossible en CSS pur (il faut la position du curseur), donc un hook
  dédié (`useCardPointer`, même throttle `requestAnimationFrame` que
  `TiltCard.tsx` — coordonnées les plus récentes en ref, appliquées au
  plus une fois par frame) pilote un dégradé radial via
  `useMotionTemplate`, posé sur un calque séparé (`.figure-card-mouse-shine`,
  `mix-blend-mode: soft-light`). Les mêmes valeurs de pointeur pilotent
  aussi un tilt 3D très léger (±3.5°, `rotateX`/`rotateY`) directement sur
  la carte — pas besoin d'imbriquer le composant `TiltCard` existant
  puisque le pointeur est déjà suivi pour le reflet ; un second système de
  tracking séparé aurait été redondant. Le hook ne peut être appelé
  qu'une fois, en haut du composant (pas dans le `.map` des trois
  chiffres) : les règles de React interdisent les hooks conditionnels,
  et une seule carte est "active" à la fois de toute façon.

  **Bug réel trouvé en testant sous `prefers-reduced-motion`** : le reflet
  mouse-tracké était initialement rendu conditionnellement (`{!prefersReducedMotion
  && <motion.div ... />}`) puis, après un premier correctif, sa valeur de
  fond passait par un `style={{ background: prefersReducedMotion ? "none" :
  shineBackground }}`. Les deux versions cassaient l'hydratation React
  (avertissement `hydration mismatch` reproductible, visible dans la
  console) : `useReducedMotion()` peut se résoudre différemment entre le
  rendu serveur (toujours `false`, pas de `window`) et le tout premier
  rendu client — avant même que l'effet de correction ne s'exécute — si la
  préférence système est déjà active à ce moment-là. Tant que le
  conditionnel ne change que des *valeurs* passées à des props gérées par
  Framer Motion en interne (`transition`, motion values comme `rotateX`
  quand les deux branches convergent vers le même état neutre), pas de
  souci ; dès qu'il fait apparaître/disparaître un nœud DOM ou bascule un
  `style` entre une chaîne statique et une `MotionValue` sur la même
  propriété, le rendu HTML initial peut diverger. Corrigé en supprimant
  entièrement le conditionnel : le reflet et le tilt restent actifs même
  en `prefers-reduced-motion`, comme `TiltCard.tsx` déjà utilisé partout
  ailleurs sur le site sans ce genre de garde — cohérent avec le fait
  qu'un effet piloté directement par la souris (pas une animation qui se
  déclenche toute seule) n'est pas ce que ce réglage d'accessibilité vise.

  Section rétrécie (25-30% demandé) : plus de réservation géante pour une
  image (jusqu'à `40rem` de `padding-bottom` à l'itération précédente),
  retour à un `padding` symétrique modeste (`py-20`/`sm:py-24`, contre
  `py-28` avant même la toute première image). Typographie légèrement
  agrandie comme demandé : titre `text-3xl/text-4xl` → `text-4xl/text-5xl`,
  carte `w-[168px]/232px` → `w-[176px]/248px` avec texte
  `text-xl/text-3xl` → `text-2xl/text-4xl`, timeline (point, texte inactif,
  libellés) montée d'un cran. `public/images/notre-histoire-landscape.png`
  supprimé.

  **Deuxième retour en arrière sur le décor**, cette fois définitif : le
  low-poly SVG (colline, pins, rochers, rive — remplaçant censé corriger le
  "hero de fond" de l'itération précédente) est jugé "toujours forcé, pas à
  sa place ici", avec une remarque de direction artistique explicite —
  peut-être ailleurs sur le site (transition entre sections, footer,
  animation au scroll), mais pas derrière cette timeline. `HillDecor` et
  `ShoreDecor` entièrement supprimés, pas archivés ni commentés — repartis
  d'une section sans aucun élément figuratif. Remplacés par un système
  volontairement non-figuratif, pensé pour tenir seul dans les deux sens
  (test explicite du client : sans la carte, la section doit rester
  élégante ; sans le fond, la carte doit toujours fonctionner) —
  `.notre-histoire-surface` dans `globals.css` : un dégradé crème → sable
  très doux sur la section entière, une lumière chaude diffuse en coin
  bas-droit (`radial-gradient` à faible opacité, pas un halo qui se
  remarque), un grain de papier calqué sur la même technique `feTurbulence`
  déjà utilisée sur `.figure-card` mais à une opacité encore plus faible
  (quasi invisible, juste de quoi casser la platitude numérique d'un
  dégradé CSS pur).

  Carte retravaillée une troisième fois — retour client : "aujourd'hui elle
  ressemble à un simple rectangle gris". Cause : un dégradé à une seule
  teinte (vert forêt) dilué à faible opacité sur un fond clair se lit
  presque toujours comme du gris désaturé, quelle que soit la teinte de
  départ — il manque du contraste de teinte, pas seulement de la
  transparence. Dégradé remplacé par 3 arrêts avec une vraie variation
  chromatique (doré chaud en haut → vert sauge au milieu → vert forêt
  profond en bas), qui se lit comme du verre fumé teinté plutôt que comme
  un aplat gris. Coins rendus "organiques" via un unique raccourci
  `border-radius` à 4 valeurs différentes (`rounded-[42px_30px_46px_26px]`)
  plutôt que quatre classes séparées — nécessaire pour que
  `border-radius: inherit` sur les pseudo-éléments (`::before`, halo
  externe, reflet mouse-tracké) suive correctement les 4 coins. Ombre
  d'élévation assouplie et dé-teintée (moins verte, plus neutre/chaude,
  deux couches au lieu d'une) pour lire comme une vraie ombre portée douce
  plutôt que comme un glow coloré. Reflet mouse-tracké et tilt léger
  (ajoutés à l'itération précédente) conservés tels quels — déjà validés,
  pas concernés par ce retour.

  Timeline "plus élégante" : le point simple (cercle plein/vide) devient un
  repère à deux niveaux — un anneau fin toujours visible, un point doré
  intérieur qui apparaît en `scale` (ressort Framer Motion) uniquement sur
  l'étape active, plutôt qu'un remplissage de couleur binaire. Piste et
  remplissage légèrement affinés. Animation de la carte entre les étapes
  revue pour un ressort plus doux (`stiffness`/`damping` réduits) et un
  léger fondu-décalage du contenu (valeur + libellé, `key={active}`,
  `opacity`/`y` avec un court délai après que la carte a fini de se
  déplacer) — un temps de lecture avant que le nouveau chiffre n'apparaisse
  plutôt qu'un remplacement instantané du texte pendant que la carte est
  encore en mouvement.

  **Fond encore retouché** : le dégradé/lumière/grain custom
  (`.notre-histoire-surface`) est jugé toujours en trop — "ne crée pas un
  nouveau fond, réutilise exactement la couleur de la section Gammes".
  Classe entièrement supprimée de `globals.css` ; la section utilise
  directement `bg-ciel` (`#e8eee8`, le même token que `GammesPreview.tsx`
  et `GammeDetail.tsx`), sans dégradé ni halo ni texture — la seule façon
  de garantir "aucune différence de teinte" avec la section Gammes est de
  partager littéralement la même classe utilitaire plutôt que d'essayer de
  recréer la couleur à l'œil.

  **Carte retravaillée une quatrième fois** : le verre fumé teinté forêt
  (ajouté pour répondre au tout premier "pas un rectangle blanc avec un
  fond vert") est toujours perçu comme "un simple rectangle gris avec un
  blur", cette fois avec une consigne plus précise — un verre CLAIR à
  peine teinté de crème, pas une couleur qu'on dilue à faible opacité.
  Fond changé de `rgba(36,46,36,…)` (vert forêt) à `rgba(255,253,247,…)`
  (blanc cassé/ivoire) : contrairement à une teinte saturée diluée (qui se
  grise mathématiquement en perdant de l'opacité), un blanc cassé reste un
  blanc cassé quelle que soit son opacité — c'est ce qui permet un rendu
  "verre clair" plutôt que "couleur fanée". Bordure passée de 0.2 à 0.65
  d'opacité (le "bord lumineux très fin" demandé), blur réduit (32px →
  20px, "pas un gros blur"). Corollaire obligatoire : le texte de la carte,
  ivoire clair sur fond sombre jusque-là, repasse en encre foncée
  (`text-encre`/`text-encre-douce`) — illisible sur un verre aussi clair
  sinon. Halo externe et halo interne adoucis en conséquence (moins de
  contraste nécessaire sur un fond déjà clair). Reflet mouse-tracké et
  tilt inchangés — c'est la seule partie de "plusieurs couches qui bougent
  avec la souris" déjà acquise, le reste de la demande (bord lumineux,
  lumière interne, légère distorsion, coins organiques) porte sur la
  matière statique du verre, pas sur l'interaction.

  **Retour du paysage, cette fois comme scène animée** : après deux allers-
  retours sur le décor (ajouté en photo, remplacé par un SVG low-poly jugé
  "forcé", puis supprimé entièrement), demande finale du client de le
  réintroduire mais reconçu comme une "scène 3D" vivante plutôt qu'une
  illustration statique — colline, pins minimalistes, rochers facettés,
  rive avec reflet d'eau, lumière basse qui évolue, tout en restant
  "extrêmement discret". Nouveau composant `LandscapeScene` dans
  `NotreHistoire.tsx` : SVG pur (`viewBox`, pas d'image bitmap) plutôt que
  photo ou export low-poly figuratif comme les tentatives précédentes —
  choix déterminant, puisque le bug de compression verticale rencontré sur
  la toute première intégration photo (`object-fit: cover` qui montre une
  tranche verticale différente selon la largeur de viewport, nécessitant un
  réglage de hauteur par breakpoint) est structurellement impossible avec
  un SVG mis à l'échelle en CSS : le ratio du contenu suit toujours
  fidèlement le ratio du conteneur, à toutes les largeurs, sans réglage
  manuel. Animations ambiantes (pulsation du halo solaire, léger
  frémissement du reflet sur l'eau) en pur CSS (`@keyframes` +
  `@media (prefers-reduced-motion: reduce) { animation: none }`) plutôt
  qu'en JS/Framer Motion — délibéré : ça élimine par construction tout
  risque de désaccord SSR/client sur ces éléments, puisqu'aucune valeur
  calculée côté client n'entre en jeu.

  Le fil explicitement demandé entre la scène et la timeline — "le soleil
  se décale imperceptiblement selon l'étape active" — est porté par un
  `motion.g` dont la position anime vers `SUN_OFFSETS[active]` (ressort
  Framer Motion) : le seul point où la scène "sait" quelle étape est
  active, vérifié en cliquant sur chaque point de la timeline et en
  contrôlant la transform du groupe SVG (décalage confirmé de -14.7 à
  +12.7 entre la première et la dernière étape).

  "La caméra respire avec un très léger mouvement de parallaxe" au
  mouvement de la souris : nouveau hook `useScenePointer()`, structurellement
  identique à `useCardPointer()` (déjà utilisé pour le reflet de la carte)
  mais mesuré contre le `<section>` entier plutôt que contre la carte —
  gardé comme un hook séparé plutôt que fusionné, les deux mesurant contre
  des repères différents. Applique une translation discrète (±6px en x,
  ±4px sur y, ressort amorti) sur le calque de la scène. En écrivant ce
  hook, un risque de mismatch d'hydratation identique à deux bugs déjà
  rencontrés sur cette même section a été repéré et corrigé avant même de
  tester : la tentation initiale d'écrire
  `style={{ x: prefersReducedMotion ? 0 : parallaxX }}` a été abandonnée au
  profit de `style={{ x: parallaxX }}` toujours — cette section avait déjà
  appris deux fois que faire dépendre le *type* d'une valeur `style` de
  `prefersReducedMotion` (motion value vs littéral statique) provoque un
  mismatch SSR/client, alors que ne faire dépendre que la config de
  `transition` ne pose aucun problème.

  Interface simplifiée comme demandé ("supprimer les grosses cartes
  blanches classiques") : les étapes inactives de la timeline
  n'affichent plus leur valeur/libellé, seulement un point — une seule
  carte reste visible à l'écran à la fois, celle de l'étape active,
  renforçant l'impression d'un objet unique qui "flotte" plutôt que d'une
  rangée de cartes. Reflet de la carte (`.figure-card::before`) enrichi
  d'une bande diagonale (`linear-gradient` à 118°) en plus du halo radial
  déjà présent en haut à gauche, pour lire comme un reflet de lumière qui
  balaie une surface incurvée plutôt qu'un simple gradient de coin.

  En simplifiant la timeline, la colonne de droite est devenue plus courte,
  ce qui — combiné à `lg:items-center` sur la grille — a réduit l'espace
  naturel sous le texte de gauche. Avec la scène à sa hauteur initiale
  (`h-40 sm:h-52 lg:h-64`), elle chevauchait le dernier paragraphe de 34px
  en desktop, 22px en tablette et 6px en mobile — détecté avec un nouveau
  script de mesure géométrique (`check-scene-geom.mjs`, même méthode que
  pour les chevauchements précédents : comparaison de `getBoundingClientRect()`
  entre la scène et le dernier texte à trois largeurs). Corrigé en réduisant
  la scène à `h-32 sm:h-40 lg:h-48` ; ré-exécution du script confirmant une
  marge saine (25 à 30px) aux trois largeurs. Vérifié en parallèle :
  `check-reduced-motion2.mjs` ne fait apparaître aucun mismatch
  d'hydratation propre à cette section (le seul mismatch détecté reste
  celui, pré-existant et hors scope, du `Hero`), et `check-shine.mjs` /
  la mesure de transform confirment que le reflet et le tilt de la carte
  continuent de suivre la souris indépendamment du nouveau parallaxe de
  la scène.
  fond de section est passé par plusieurs itérations décoratives — cadrage
  feuillage (fond flou, branches détourées, photos réelles), puis des
  silhouettes de plantes abstraites en SVG (`PlantShadow`, ombre portée
  floutée, calibrée en opacité/nombre puis rendue responsive et révélée
  une par une) — jugées à chaque fois "cheap" ou, en bout de course,
  gratuites : ça ne disait rien sur la gamme elle-même. Tout ce chantier a
  été abandonné et remplacé par quelque chose de fonctionnel plutôt que
  décoratif : au survol de chaque carte, deux pastilles liquid glass
  apparaissent au-dessus du tarif, listant les deux équipements qui
  distinguent le plus concrètement cette gamme des deux autres (cuisine et
  salle de bain — les postes où le texte des pages gamme décrit déjà les
  écarts les plus nets : "équipée de base" / "équipée premium" /
  "sur-mesure haut de gamme"). Champ `highlights` ajouté à `Gamme`
  (`src/lib/gammes.ts`), affiché via `GlassPanel` (`tone="dark"`) dans
  `GammesPreview.tsx`. Une vraie plus-value informative — pas une
  animation de plus — qui reste discrète (cachée jusqu'au survol/focus,
  transition opacité + hauteur) pour ne pas alourdir la carte au repos.
- **Reflets liquid glass mis à niveau sur tout le site** (`.glass-sheen` /
  `.glass-sheen-hover`, utilisés par la nav, les panneaux CTA, Chiffres
  clés, le calculateur de rentabilité et les cartes Modèles) : ils
  utilisaient encore l'ancien mécanisme (pseudo-élément `::before`
  surdimensionné en `inset: -50%`, animé en `transform`) — exactement la
  combinaison qui causait le bug de débordement découvert sur le bouton
  hero, jamais déclenché ailleurs mais latent partout où ces classes sont
  posées. Basculé sur le même mécanisme que `.hero-cta` : le reflet est
  porté par `background-position` sur un pseudo-élément calé exactement
  sur les bords (`inset: 0`, `border-radius: inherit`) plutôt qu'un
  transform — plus besoin de le surdimensionner, donc plus aucun risque
  de débordement, sur un dégradé diffus à 5 arrêts au lieu d'une bande
  nette. Au passage, un vrai bug a été trouvé sur `.glass-graphite` (le
  panneau du calculateur) : son halo doré était un `box-shadow` non-inset
  (`0 0 140px`), or tout `GlassPanel` a `overflow: hidden` par défaut —
  qui clippe aussi bien le contenu que les box-shadow non-inset à la
  frontière de l'élément. Ce halo était donc probablement invisible à
  pleine intensité depuis toujours. Remplacé par un `::after` séparé
  (`::before` porte déjà le reflet) en `z-index: -1` qui déborde
  volontairement, avec `overflow: visible` sur l'élément pour le laisser
  sortir — même procédé que le halo du bouton hero.
- **Ombres de plantes à gauche et à droite de la section Concept**
  (3 piliers) : sur référence visuelle du client, deux silhouettes de
  plante (même composant `PlantShadow` qu'utilisé — puis retiré — sur
  Gammes, réintroduit ici) débordent depuis les bords gauche et droit de
  la section, floutées, à faible opacité. Restreint à ces deux zones
  précises plutôt que dispersé façon l'essai Gammes (4 silhouettes
  scattered, jugées gratuites sur les cartes) : ici la référence montrait
  un feuillage qui déborde des deux bords, pas un décor semé au hasard.
  Tailles responsive (base mobile → `sm:` → `lg:`), révélées au scroll
  (`whileInView`, une fois). Vérifié en mobile (390px) : proportionné,
  lisible, pas d'aplat flou pixelisé. Flou revu ensuite (`blur-md` 12px
  → `blur-sm` 4px) : jugé trop flou, une silhouette à peine adoucie plutôt
  qu'une tache diffuse.
- **Calculateur de rentabilité : tilt trop marqué et pas fluide** :
  `TiltCard` applique un tilt 3D (`rotateX`/`rotateY`) au survol sur tous
  les panneaux glass du site ; le calculateur utilisait déjà le réglage
  le plus bas (`strength={1.5}`, contre 2 à 2.5 ailleurs), mais sur un
  panneau aussi large (`max-w-4xl`) le même angle produit un débattement
  bien plus marqué aux bords qu'sur une petite carte — d'où l'impression
  de mouvement excessif. Réduit à `strength={0.6}`. Le manque de fluidité
  venait probablement d'ailleurs : le `mousemove` brut peut se déclencher
  plus souvent qu'une frame d'écran, et chaque appel recalculait aussitôt
  la rotation — sur un panneau avec un `backdrop-filter: blur(26px)`
  (déjà coûteux à recalculer à chaque frame dès que la géométrie de
  l'élément change), ces recalculs redondants ajoutaient du travail
  inutile. `TiltCard.tsx` throttle maintenant les coordonnées à une seule
  mise à jour par frame via `requestAnimationFrame` (les coordonnées les
  plus récentes sont conservées dans une ref, appliquées au prochain tick
  plutôt qu'à chaque événement) — bénéficie à toutes les cartes du site,
  pas seulement au calculateur.

## Audit du 2026-07-17 : bugs et corrections

Passage complet du code (tous les composants, pages, lib) à la recherche de
failles de sécurité, bugs et erreurs, sur demande explicite. Aucune faille de
sécurité trouvée — le site est intégralement statique côté client (aucun
`dangerouslySetInnerHTML`, `eval`, endpoint API, variable d'environnement
exposée ; `next.config.ts` restreint `images.remotePatterns` à un seul
hostname précis, pas de wildcard). `npm audit` remonte une alerte modérée sur
`postcss` mais elle vient d'une dépendance interne à `next` lui-même (outil
de build, jamais exposé au visiteur) ; le correctif proposé (`npm audit fix
--force`) rétrograderait `next` vers une version `9.x` — un downgrade
massif et cassant, pas appliqué. Bugs réels trouvés et corrigés :

- **Bug de cascade CSS sur `.hero-cta`** (déjà détaillé plus haut) : la
  classe était déclarée avant le bloc `@supports` qui redéclare le
  `backdrop-filter` de `.glass-dark` — invisible dans ce bac à sable
  (Chromium ici échoue le test `@supports`) mais actif sur tout navigateur
  qui le supporte. Corrigé en réordonnant le fichier.
- **`Nav.tsx` : `aria-label` du bouton menu mobile figé** sur "Ouvrir le
  menu" même une fois le menu ouvert (où cliquer dessus le referme) — un
  lecteur d'écran annonçait donc l'action inverse de ce que le bouton fait
  réellement. Rendu dynamique : `aria-label={open ? "Fermer le menu" :
  "Ouvrir le menu"}`.
- **Incohérence de contenu "dix" vs 9 configurations réelles** : le hero
  (`ThreePiliers.tsx`), la page Modèles (`ModelesClient.tsx` + ses
  métadonnées) annonçaient "dix maisons" / "dix configurations" partout,
  alors que `GAMMES` dans `lib/gammes.ts` n'en définit que 9 au total (2 en
  Primaire + 3 en Premium + 4 en Prestige) — confirmé par le README
  lui-même, qui documentait déjà "grille filtrable des 9 configurations"
  plus haut. Un chiffre affiché aux visiteurs qui ne correspondait pas au
  contenu réel du site. Corrigé partout ("neuf" à la place de "dix", 4
  occurrences).
- **Widgets custom sans nom accessible** : le slider de surface du
  calculateur (`PremiumSlider.tsx`, `role="slider"` fait main) n'exposait
  aucun `aria-label` — un lecteur d'écran l'annonçait comme "slider" sans
  préciser lequel. Prop `label` ajoutée et branchée ("Surface du module").
  Les boutons de sélection en groupe (gamme/surface dans le tunnel de
  contact, filtres de la page Modèles, région/type dans le calculateur,
  cartes d'options du tunnel) changent visuellement d'état au clic mais ne
  l'exposaient pas non plus aux technologies d'assistance — `aria-pressed`
  ajouté sur chacun.

Le formulaire de contact (`ContactClient.tsx`) n'envoie volontairement rien
à un backend pour l'instant (commentaire `TODO prod` explicite dans le
code) — ce n'est pas un bug, juste un chantier non démarré (branchement à
un vrai endpoint email/CRM), déjà remonté dans la section suivante.

## À faire avant la mise en prod

- **Si la vidéo du hero est toujours saccadée** malgré le changement de
  technique : passer à une séquence d'images (frames extraites, swap sur
  scroll) plutôt qu'un `<video>` — c'est la technique la plus fiable
  cross-navigateur pour du scroll-scrub, mais demande d'extraire des frames
  (ffmpeg) que je ne peux pas faire depuis cet environnement.
- **Netteté du hero** : la vidéo source est en 720p ; à l'échelle d'un hero
  plein écran, ça reste visiblement moins net qu'un contenu premium
  l'exigerait, quelle que soit la technique de lecture/dessin utilisée. Un
  ré-encodage/upscale IA a été tenté et a empiré le rendu — la vraie
  solution est un nouveau tournage/rendu en plus haute résolution.
- **Rapatrier les médias** (hero, visuels de gammes) : `src/lib/media.ts`
  et `src/lib/gammes.ts` référencent des images/vidéo générées (Higgsfield
  CDN, `d8j0ntlcm91z4.cloudfront.net`) — ce sont des liens de génération,
  pas un stockage permanent. À télécharger et héberger dans `public/` (ou
  le futur CMS) avant lancement.
- **Formulaire de contact non branché** : `ContactClient.tsx` affiche une
  confirmation mais n'envoie rien nulle part (pas d'endpoint email/CRM). Les
  demandes ne sont pas capturées tant que ce n'est pas câblé.
- **Vrai shooting photo des 3 gammes** — les visuels actuels sont des rendus
  IA de placement, cohérents mais pas des photos réelles des maisons
  Bellora. Priorité Prestige.
- **Tour 360° et matrice des gammes** (présents sur le site actuel) : pas
  reconstruits dans cette passe.
- **Page Notre atelier** (`/atelier`) : stub, contenu à écrire — n'existe pas
  sur le site actuel.
- **CMS** (Sanity ou Payload) : pas branché, contenu en dur dans
  `src/lib/gammes.ts` et les composants.
- Compléter SIRET/raison sociale/hébergeur dans
  `src/app/mentions-legales/page.tsx` et les coordonnées (téléphone, adresse)
  dans `src/components/Footer.tsx`.
