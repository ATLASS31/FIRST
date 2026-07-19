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

  **De la scène figurative à une composition architecturale abstraite** :
  retour client sur la "scène 3D" (colline/pins/rochers/rive) du tour
  précédent — un concept gardé ("le soleil se décale selon l'étape active"),
  mais un rendu jugé "pas assez premium", trop proche d'une illustration de
  paysage low-poly classique et donc en décalage avec "l'univers
  architectural de Bellora". Consigne explicite : quelques grands volumes
  très épurés (3 à 4, pas plus), des reliefs géométriques sobres, des
  surfaces à teinte minérale, des plans superposés pour la profondeur, une
  lumière chaude qui traverse la scène, des reflets sur des surfaces sans
  jamais représenter littéralement une eau ou une forêt — inspiration
  maquette architecturale / keynote Apple plutôt que décor low-poly.
  `LandscapeScene` (colline, pins, rochers, rive, brume) entièrement
  remplacé par `AbstractScene` : deux "monolithes" en aplat à deux facettes
  chacun (une face éclairée, une face en ombre — c'est le contraste net
  entre deux teintes plates, pas un dégradé lissé, qui suggère une surface
  minérale taillée), un plan de sol qui les unifie, un plan lointain à
  peine perceptible pour la sensation d'espace au-delà. Les faîtages sont
  volontairement coupés à deux points plutôt qu'un seul pic (`92,98` →
  `128,108` plutôt qu'un unique sommet) : un seul point de faîte lisait
  comme un sommet de montagne, la même silhouette avec un court plateau
  incliné lit comme un bloc massif taillé. Les "reflets subtils sur des
  surfaces" demandés sont deux ellipses à dégradé radial très discrètes à
  la base des monolithes (lumière qui rebondit sur le plan de sol), sans
  aucune ligne d'eau ni ondulation. La "lumière chaude qui traverse la
  scène" est un large voile radial en surimpression, qui respire très
  lentement (`@keyframes scene-light-breathe`, 14s) plutôt que le
  frémissement de reflet sur l'eau supprimé avec la rive.

  Un vrai bug de mise à l'échelle a été débusqué en construisant cette
  version, latent depuis la toute première scène SVG mais resté invisible
  jusqu'ici : le `<svg viewBox="0 0 800 220">` n'avait pas de
  `preserveAspectRatio` explicite, donc navigateur applique la valeur par
  défaut (`xMidYMid meet`), qui centre le contenu en préservant son ratio
  plutôt que de remplir le conteneur. Comme la bande de scène est bien plus
  large que haute (jusqu'à ratio 7:1 en desktop, largeur de section entière
  pour une hauteur de quelques dizaines de pixels), "meet" la scène est
  restée cantonnée à une bande centrée, avec des marges vides invisibles de
  chaque côté puisqu'elles sont de la même couleur que le fond. Sans
  conséquence tant que le contenu du SVG restait symétrique et loin des
  bords (les pins/rochers de la scène figurative), le défaut est devenu
  visible dès que le soleil — élément ponctuel et lumineux — s'est retrouvé
  décalé vers le centre par ce recentrage, jusqu'à passer sous le dernier
  point de la timeline (chevauchement confirmé par script : centre du
  soleil à 33px du centre du point, avec un rayon de halo de ~40px).
  Corrigé avec `preserveAspectRatio="none"` : la scène remplit maintenant
  exactement la largeur du conteneur à chaque largeur d'écran, sans marge
  ni recentrage — un choix qui n'a pas de coût visuel ici puisque les
  volumes sont des aplats géométriques simples (une légère mise à l'échelle
  non uniforme ne se remarque pas), contrairement à un décalage
  d'alignement avec le texte et la carte au-dessus. Une fois ce recentrage
  supprimé, la position verticale du soleil a aussi été revue (`cy=146`,
  contre une valeur initiale trop haute dans le "ciel" du viewBox) pour
  garder une marge confortable avec la timeline — revérifié avec un script
  dédié (`check-sun-overlap.mjs`) comparant le centre rendu du soleil à
  celui du dernier point de la timeline à chaque étape.

  **Quatrième refonte de la matière de la carte** : toujours perçue comme
  "un rectangle blanc avec un effet de glow" malgré le verre clair du tour
  précédent — le problème identifié n'est plus la teinte mais l'absence de
  présence physique. Un second calque de dégradé vertical (clair en haut,
  plus dense en bas) s'ajoute au dégradé diagonal existant, pour que la
  carte lise comme un objet éclairé d'en haut plutôt qu'un aplat orienté au
  hasard. L'ombre portée passe de deux à trois couches de tailles
  différentes (contact serré, ombre moyenne, halo large) plutôt qu'une
  seule paire valeur/flou — c'est la superposition d'échelles qui donne
  l'impression d'un objet réellement posé sur la scène. Un anneau interne
  (`inset 0 0 0 1px`) simule une deuxième épaisseur de verre légèrement en
  retrait du bord. Le halo externe (`::after`) est recentré vers le bas de
  la carte plutôt que diffus tout autour : la scène en fond de section est
  la source de lumière de la composition, la carte doit sembler capter
  cette lumière par en dessous. Le reflet mouse-tracké passe d'une seule
  tache diffuse à deux couches superposées (un point chaud étroit à 70px +
  un halo large à 260px) pour lire comme un vrai spéculaire physique.
  Coins organiques accentués (`48px_26px_52px_20px`, contre `42/30/46/26`
  avant) pour une silhouette moins immédiatement identifiable comme un
  rectangle arrondi.
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
- **Notre histoire : repartir de zéro plutôt que d'itérer encore.** Après
  la composition architecturale abstraite du tour précédent (volumes
  low-poly + carte), retour client sans détour : "les volumes en bas
  paraissent posés là sans réelle intention... je ne ressens ni
  l'architecture, ni le luxe, ni l'élégance", la carte "un rectangle blanc
  avec des ombres et des dégradés, mais pas un matériau exceptionnel", et
  la demande explicite d'arrêter d'itérer sur cette version pour repartir
  d'une page blanche, en ne gardant que l'idée de la lumière qui se décale
  selon l'étape active ("le seul élément que j'aime vraiment"). Toute
  forme géométrique figurative disparaît (`AbstractScene`, ses volumes,
  son plan de sol, sa réflexion d'eau) ; il ne reste qu'une source de
  lumière et une seule carte, sur lesquels le brief suivant demandait
  explicitement de pousser l'exécution : plus de travail sur la lumière,
  matières comme un rendu architectural, vraie présence physique aux
  volumes, meilleur Liquid Glass ("le point le plus faible"), micro-
  animations soignées.

  **Timeline simplifiée en rail de progression.** La carte ne "flotte"
  plus entre trois emplacements liés à la timeline (`layoutId` + FLIP) :
  c'est maintenant un objet fixe dont seul le contenu change au clic/à
  l'autoplay ("je préfère une seule carte absolument parfaite plutôt que
  plusieurs bonnes idées"), et la timeline devient un simple rail sous la
  carte — une piste fine, un marqueur lumineux (même teinte que la source
  de lumière au-dessus, pour que les deux se lisent comme une seule chose)
  qui glisse entre trois positions, trois cibles de clic invisibles.

  **La carte, cinquième refonte de matière — la première à utiliser une
  vraie réfraction.** Le site a déjà un filtre SVG de réfraction réelle
  (`feTurbulence` + `feDisplacementMap`, `GlassFilter.tsx`, `url(#glass-
  distortion)`), utilisé depuis longtemps sur la nav et les boutons glass
  — jamais sur cette carte, puisque `.figure-card` réécrivait entièrement
  `backdrop-filter` sans jamais inclure la référence au filtre. Sans
  intérêt tant que le fond derrière la carte était un aplat `bg-ciel`
  uniforme (rien à distordre) ; maintenant qu'un champ de lumière se
  trouve juste derrière, la réfraction déforme visiblement ce halo — c'est
  ce qui fait enfin lire "verre qui courbe la lumière" plutôt que "panneau
  flou avec un dégradé peint dessus". Présence physique renforcée par un
  second panneau (`.hs-card-base`), un jumeau décalé derrière le coin
  bas-droit qui simule l'épaisseur réelle du verre — **un vrai bug trouvé
  et corrigé pendant la construction** : le premier essai positionnait ce
  jumeau avec un `inset` asymétrique (`6px -4px -8px 4px`), qui change à
  la fois la position ET la taille de la boîte ; un rayon de bordure en
  valeurs fixes ne suit correctement un contour que si la boîte a
  exactement la taille pour laquelle il a été réglé, donc les coins
  rendaient visiblement décalés/pointus. Corrigé en gardant `inset: 0`
  (boîte identique à la carte) et en déplaçant le jumeau via `transform:
  translate()` à la place. Reflet mouse-tracké enrichi (deux couches
  spéculaires : point chaud étroit à 64px + halo large à 240px, contre une
  seule couche avant) et léger fil chromatique (bordures rouge/bleu à
  ±0.6px et 0.05 d'opacité) sur les arêtes à fort contraste — un détail
  d'optique réelle, volontairement au bord du perceptible.

  **La lumière — poussée bien plus fort, et un vrai bug de position
  corrigé.** Premier essai : cœur + halo positionnés en coordonnées de la
  section entière (`right/top` en %), à une intensité calquée sur les
  habitudes du reste du site (halo à 0.16 d'opacité) — quasiment invisible
  une fois vérifié à l'écran, et en plus positionné dans le vide au-dessus
  de la carte plutôt que collé à elle. Deux corrections : la source de
  lumière (cœur + halo proche) devient un enfant direct du conteneur de la
  carte (`-right-10 -top-14`), garantissant qu'elle reste collée à son
  coin quelle que soit la largeur d'écran — c'est elle qui porte le
  décalage entre étapes ; et son intensité est nettement relevée (`box-
  shadow` à trois rayons superposés sur le cœur, dégradé à trois arrêts
  sur le halo) puisque, contrairement à un fond sombre, une source de
  lumière crédible a besoin de beaucoup plus d'intensité pour se voir du
  tout sur un fond aussi clair que `bg-ciel`. Un second voile, très
  discret et à l'échelle de toute la section (`.hs-light-halo`), reste à
  taille fixe (`clamp()`) et à opacité basse pour teinter légèrement l'air
  ambiant sans rien éclairer précisément.

  **Un vrai bug de débordement mobile trouvé et corrigé.** Ce second voile
  ambiant (`.hs-light-halo`), à 720px fixes, débordait largement d'un
  viewport mobile de 390px et traversait le titre en haut de section — 
  visible et confirmé par capture d'écran (le halo passait littéralement à
  travers "Le modulaire bois"). Masqué sous `sm:` (`hidden sm:block`) et
  borné par `clamp(360px, 55vw, 720px)` au-delà, pour qu'il reste
  proportionné à des largeurs intermédiaires (tablette) sans jamais
  redevenir plus grand que le viewport qui le contient.

  **Entrée choreographiée.** La carte se matérialise au scroll
  (`whileInView`, une fois) plutôt que d'être statique au chargement :
  échelle 0.94→1, flou 14px→0, fondu, easing "expo-out"
  (`[0.16, 1, 0.3, 1]`, la même famille de courbe que beaucoup de sites à
  forte finition utilisent pour une décélération qui ne se sent jamais
  mécanique). Pattern d'hydratation déjà établi et sûr (`whileInView`
  démarre toujours dans l'état `initial`, identique sur le rendu serveur
  et le premier rendu client avant hydratation, quel que soit
  `prefers-reduced-motion` — aucun risque du type déjà rencontré/corrigé
  sur le reflet mouse-tracké). Reconfirmé par `check-reduced-motion2.mjs` :
  aucun nouveau mismatch d'hydratation propre à cette section.
- **Notre histoire : passe de finition sur la timeline et la carte** —
  retour client après la refonte lumière/carte : "clairement mieux", mais
  toujours pas l'effet "wow" recherché, avec deux points précis pointés du
  doigt. "La timeline en bas est très faible visuellement, elle ressemble
  à un composant de maquette Figma" et "le matériau [de la carte] peut
  encore énormément progresser". Consigne explicite : ne plus chercher de
  nouvelles idées, uniquement pousser la qualité d'exécution des deux
  éléments existants — et s'inspirer de références premium (dont
  Higgsfield) avant d'itérer.

  **Recherche visuelle via Higgsfield, avec une limite technique
  rencontrée et documentée** : une image de référence (rendu macro d'un
  objet en verre premium, éclairage studio, style photographie produit
  Apple) a été générée via `mcp__higgsfield__generate_image`
  (`nano_banana_pro`). Le job aboutit bien côté Higgsfield (URL renvoyée),
  mais le CDN qui héberge le résultat (`*.cloudfront.net`) est bloqué par
  la politique réseau de cet environnement sandboxé — confirmé via
  `/root/.ccr/__agentproxy/status` (`connect_rejected`, 403 sur le CONNECT)
  aussi bien en `curl` direct qu'en `WebFetch`. Une limitation déjà
  documentée plus haut dans ce fichier pour d'autres visuels Higgsfield du
  site, ici rencontrée pour la première fois sur une image générée comme
  simple référence de travail plutôt que comme asset destiné au site.
  Plutôt que de bloquer sur cette étape, la suite s'appuie directement sur
  la connaissance du rendu du verre premium et de la photographie produit
  haut de gamme plutôt que sur l'inspection pixel de l'image générée.

  **Timeline — pourquoi elle lisait comme un composant de maquette.** Le
  diagnostic : ce n'est pas la piste qui trahit un "pattern UI", ce sont
  les points. Trois cercles discrets côte à côte est un vocabulaire
  d'interface immédiatement reconnaissable (stepper/wizard), quel que soit
  le soin apporté au reste. Les points disparaissent entièrement (les
  cibles de clic restent, invisibles, `h-8 w-8` par-dessus la piste). La
  piste elle-même passe d'un trait plat (`bg-encre/8`, 1px) à une rainure
  gravée : `box-shadow` interne seul (`.hs-rail-track`), qui lit comme un
  creux dans la matière plutôt qu'une ligne dessinée par-dessus. Le
  marqueur passe d'un aplat radial à une bille de verre à deux couches
  (dégradé de base + reflet interne décalé en haut-gauche,
  `.hs-rail-marker-shine`, séparé pour pouvoir ajuster sa position
  indépendamment) avec une ombre qui l'ancre dans la rainure. Le "01/03"
  quitte sa position isolée au-dessus de la carte pour venir se poser à
  côté du rail — un seul repère de progression plutôt que deux qui se
  répètent (nombre en haut + timeline en bas, doublon supprimé).

  **Carte — l'anneau de bord, ce qui manquait pour "un vrai objet en
  verre".** Diagnostic : le reflet diagonal existant (`.hs-card::before`)
  traverse toute la face de la carte à 118°, une bande large qui lit comme
  "reflet peint sur une surface plate" plutôt que "bord qui capte la
  lumière" — un vrai bord de verre s'éclaire sur son pourtour, pas en
  diagonale à travers le centre. Nouvelle couche, `.hs-card-rim` : la
  technique du "gradient border" (`padding` égal à l'épaisseur voulue,
  `mask-composite: exclude` entre la boîte pleine et la boîte réduite du
  padding) fait apparaître un anneau fin qui suit exactement le contour —
  y compris les quatre rayons différents de `rounded-[52px_28px_56px_22px]`,
  vérifié à l'écran sans couture ni décalage visible à aucun des quatre
  coins. Un `conic-gradient` fait varier l'intensité tout autour plutôt
  qu'un anneau uniforme : un pic net orienté vers `.hs-light-group` (la
  lumière, en haut à droite), une tombée rapide de part et d'autre — le
  bord ne s'illumine fortement que du côté qui fait face à la lumière,
  comme un vrai chant de verre, confirmé visuellement au coin opposé
  (bas-gauche) qui reste discret sans jamais paraître coupé net.

  **Micro-interaction ajoutée** : au changement de contenu (chiffre/
  libellé), un léger rebond d'échelle (0.985 → 1, ressort
  `stiffness: 300, damping: 14`) se superpose au fondu/décalage vertical
  déjà en place — un temps de rebond très bref qui simule une impulsion
  physique reçue par un objet réel, plutôt qu'un simple changement d'état
  d'interface.
- **Notre histoire : le soleil retiré, un vrai objet 3D à la place ;
  navigation entièrement repensée.** Retour client honnête : "je ne
  trouve toujours pas ça beau" pour la version précédente n'était que la
  moitié du message — cette fois le champ de lumière lui-même est mis en
  cause ("un gros halo jaune posé sur le fond... attire l'œil mais
  n'apporte pas de valeur"), alors que c'était l'unique élément conservé
  du tour d'avant. Consigne : le retirer complètement, le remplacer par un
  "véritable objet 3D" qui change d'orientation à chaque étape plutôt
  qu'un halo qui se décale — et repenser entièrement la navigation, jugée
  illisible ("on ne comprend pas immédiatement combien il y a d'étapes, où
  l'on se situe").

  **Objet 3D — un vrai prisme, pas une image qui simule la 3D.** Construit
  en CSS 3D pur (`transform-style: preserve-3d`, `rotateY`/`translateZ` —
  aucune dépendance WebGL/Three.js ajoutée : le projet n'en avait aucune,
  et un moteur 3D complet pour un seul élément décoratif aurait été
  disproportionné face à ce qu'un prisme CSS peut déjà livrer
  honnêtement). Trois faces rectangulaires disposées à 120° les unes des
  autres (rayon `R = largeur / (2 × tan 60°)`, la formule standard pour un
  triangle équilatéral régulier), chacune dans une matière différente
  (verre clair, bronze chaud écho du laiton, pierre neutre) — une
  variation qui évite la répétition sans devenir kitsch ni reproduire
  littéralement un grain de bois. Trois couches de rotation superposées,
  chacune sur son propre axe pour ne jamais entrer en conflit : inclinaison
  au mouvement de la souris (`rotateX` en `style`, MotionValue externe),
  rotation d'étape (`rotateY`, `animate`, ressort, exactement 120° par
  étape — une face différente fait face à l'écran à chaque changement,
  "révéler une autre face" au sens propre plutôt qu'en métaphore), rotation
  d'ambiance continue très lente en CSS pur (`@keyframes`, 48s par tour,
  coupée sous `prefers-reduced-motion` sans risque d'hydratation puisque
  purement CSS). Vérifié à l'écran sur les trois étapes : chaque face se
  distingue nettement (glass/bronze/stone), et le changement d'étape laisse
  voir un fin liseré de la face adjacente sur le bord — la confirmation que
  c'est un vrai volume tourné, pas un simple fondu entre trois images.

  **Navigation — troisième refonte, cette fois autour de la lisibilité
  plutôt que de l'esthétique seule.** Le rail à bille de verre du tour
  précédent était visuellement raffiné mais n'affichait aucun repère
  numéroté : il fallait deviner combien d'étapes existaient. Remplacé par
  trois segments numérotés (`01`/`02`/`03`), toujours visibles, qui
  répondent aux trois questions posées explicitement par le client dans
  le même ordre : le nombre total d'étapes (trois segments, lisible en
  un coup d'œil, sans avoir à lire quoi que ce soit), l'étape active
  (contraste net `.hs-step` / `.hs-step-active` — fond, halo, couleur du
  chiffre), la progression (`.hs-step-progress`, un liseré qui se remplit
  sous le segment actif, calé sur `AUTOPLAY_MS`, remis à zéro à chaque
  changement qu'il vienne du clic ou de l'autoplay — vérifié par script,
  largeur croissante confirmée entre `t=0` et `t=2300ms`). Le "01/03"
  textuel séparé, déjà présent dans les deux versions précédentes de ce
  composant, disparaît : les segments numérotés portent maintenant
  eux-mêmes cette information, pas de répétition entre deux éléments.

  **Recherche visuelle Higgsfield, même limitation que le tour
  précédent** : nouvelle tentative de génération de référence
  (composants d'interface premium, objets 3D haut de gamme) avant
  d'itérer, comme demandé explicitement. Le CDN qui héberge les résultats
  Higgsfield reste bloqué par la politique réseau de ce sandbox (déjà
  documenté juste au-dessus pour la première tentative) — l'implémentation
  s'appuie donc à nouveau directement sur la connaissance du sujet
  (construction d'objets 3D en CSS, patterns de navigation premium)
  plutôt que sur l'inspection d'images générées.
- **Notre histoire : l'objet 3D devient la carte, plus aucune navigation
  séparée.** Retour client positif et explicite sur la direction ("l'objet
  3D fonctionne beaucoup mieux que le soleil") avec la consigne de la
  pousser jusqu'au bout plutôt que de la garder comme accompagnement à
  côté d'une carte séparée : toutes les faces dans le même matériau Liquid
  Glass (plus de variantes bronze/pierre), le contenu directement gravé
  sur chaque face, suppression complète de la barre de navigation en
  dessous.

  **Un vrai bug trouvé et corrigé pendant la construction** : au premier
  rendu, le texte des trois faces apparaissait superposé et mélangé,
  certains fragments inversés en miroir ("4-12 semaines" lisible à
  l'envers par-dessus "20 ans"). Cause : `.hs-object-face` n'avait pas
  `backface-visibility: hidden`, donc le dos de chaque face tournée à
  l'opposé de l'écran restait rendu — et comme le matériau Liquid Glass
  est volontairement translucide, ce dos (avec son texte en miroir) se
  voyait par transparence à travers la face avant. Corrigé en une ligne
  (`backface-visibility: hidden` + préfixe `-webkit-`), revérifié à
  l'écran sur les trois faces : plus aucun texte parasite.

  **Unification du matériau.** L'ancienne carte séparée (`.hs-card`,
  `GlassPanel`) disparaît ; sa recette complète (double dégradé,
  réfraction SVG réelle `url(#glass-distortion)`, ombre à cinq couches,
  fil chromatique, anneau de bord en gradient-border, reflet mouse-tracké)
  est reprise telle quelle par `.hs-object-face`, appliquée identiquement
  aux trois faces — plus aucune variation de teinte entre elles. L'objet
  grandit en conséquence pour porter le texte (204px/280px de large,
  mêmes dimensions que l'ancienne carte ; hauteur et rayon du prisme
  recalculés en conséquence, `R = largeur / (2 × tan 60°)`).

  **Navigation totalement absorbée par l'objet.** Les trois segments
  numérotés du tour précédent disparaissent ; l'objet entier devient un
  `<button>` — cliquer fait avancer d'une étape, la rotation de 120° est
  elle-même la transition de contenu. Conséquence directe : le fondu/
  rebond de texte qui accompagnait le changement de contenu sur l'ancienne
  carte est retiré, il n'a plus de raison d'être quand le changement de
  face fait déjà tout le travail visuel. Accessibilité : `aria-label`
  dynamique sur le bouton décrivant l'étape courante et l'action
  ("Étape 2 sur 3 : ... Cliquer pour voir l'étape suivante"), contenu de
  chaque face marqué `aria-hidden` (redondant avec le label, et le texte
  des faces non visibles ne doit pas être exposé aux lecteurs d'écran).

  **Rotation d'ambiance retirée.** Le lent tour perpétuel du tour
  précédent (48s par tour) avait du sens sur un petit objet purement
  décoratif ; il n'en a plus sur l'élément qui porte maintenant le texte à
  lire — un objet qui dérive en permanence aurait rendu la lecture
  inconfortable. L'objet reste donc parfaitement stable entre deux
  étapes ; seule l'inclinaison bornée au mouvement de la souris continue
  de bouger.

  **Passe de polish via les compétences `make-interfaces-feel-better` et
  `frontend-design`** (ajoutées par le client en cours de session, avec
  consigne explicite de les exploiter) : `-webkit-font-smoothing:
  antialiased` ajouté globalement sur `html` (absent jusqu'ici, recommandé
  pour un rendu net des polices sur macOS) ; `text-balance` sur le chiffre
  de chaque face pour un retour à la ligne plus équilibré quand le texte
  est long ("4–12 semaines") ; état tactile ajouté sur le bouton-objet,
  absent jusqu'ici alors qu'il porte maintenant toute l'interaction
  (`whileHover` léger agrandissement, `whileTap` compression — non
  soumis à `prefers-reduced-motion`, cohérent avec le reste du site où un
  effet piloté directement par la souris/le clic n'est pas ce que ce
  réglage d'accessibilité vise). Vérifié qu'aucun `transition: all` ne
  s'était introduit dans le CSS ajouté cette session (déjà absent).
- **Notre histoire : abandon complet de l'objet 3D CSS, pivot vers une
  scène Three.js/React Three Fiber en temps réel — le tour le plus profond
  sur cette section.** Trois échanges successifs avant la moindre ligne de
  code.

  **1. Critique stratégique, sans filtre.** Sur demande explicite du
  client ("mets-toi à la place d'un juré Awwwards/FWA", "oublie les
  contraintes actuelles, ne parle pas de faisabilité, arrête de penser
  landing page"), audit honnête de pourquoi "Notre histoire" ne produisait
  pas de "wow en 5 secondes" malgré plusieurs tours de polish : la section
  restait fondamentalement une mise en page classique (texte + objet
  décoratif) habillée de bons matériaux, pas une expérience. Proposition de
  trois directions radicales inspirées d'un dream-team fictif
  (Jony Ive/Apple Design, Active Theory, Dogstudio, Resn), puis reformulée
  comme un moment de keynote Apple de 60 secondes.

  **2. Premier concept retenu, puis corrigé sur le fond.** Un premier
  concept ("anatomie du mur" : une coupe qui révèle couche par couche
  l'ossature Douglas, l'isolant, le bardage) a été jugé "probablement la
  meilleure proposition jusqu'ici" côté exécution, mais rejeté sur le fond
  : "Bellora ne vend pas des matériaux. Bellora vend une maison. Bellora
  vend une émotion, une nouvelle vie. Les matériaux doivent soutenir cette
  émotion, pas devenir le sujet principal." Recentré sur ce qui fait rêver
  un futur propriétaire plutôt qu'un architecte, tout en gardant la
  philosophie de "démonstration physique" jugée juste — devenu
  **"La maison qui vous ressemble"** : une séquence pilotée par le scroll
  qui montre une pièce vide qui prend progressivement vie (première lumière
  d'aube, un fauteuil qui capte la lumière, un module qui s'attache,
  saisons qui défilent en accéléré pendant que la structure reste intacte,
  une phrase finale unique). Validé ("ça me parle oui").

  **3. Fondations avant construction.** Le client a explicitement demandé
  de poser "les bonnes fondations pour ce chantier" avant toute
  implémentation. Trois options de source de contenu ont été proposées
  (visuels fixes organisés, tournage réel externe, vidéo continue générée
  par IA) — toutes rejetées. Le client a lui-même proposé une quatrième
  option : une véritable scène Three.js/React Three Fiber en temps réel,
  "optimisée, avec quelques éléments seulement", et a demandé une
  évaluation honnête (faisabilité, avantages/inconvénients, recommandation
  personnelle pour un niveau Awwwards). Réponse : oui, c'est réaliste (React
  19 du projet est compatible avec les dernières versions de `three` et
  `@react-three/fiber` — vérifié via `npm view` avant toute installation ;
  la contrainte webpack/StackBlitz du projet cible les bindings natifs, pas
  les dépendances JS pures, donc aucun conflit), et c'est bien la
  recommandation propre à privilégier pour viser Awwwards plutôt qu'une
  vidéo pré-rendue qui ne serait jamais interactive. Validation explicite :
  *"Oui, lance-toi sur le squelette minimal. Je valide clairement la
  direction Three.js / React Three Fiber en temps réel, mais je veux qu'on
  avance de manière très contrôlée."*

  **Squelette minimal — phase 1 seulement, rien de plus.** Toute l'ancienne
  mise en page (texte + carte/objet 3D CSS) est retirée, aucune ligne
  gardée pour une direction explicitement abandonnée. `HouseScene.tsx`
  (nouveau fichier, `src/components/notre-histoire/`) construit uniquement
  le premier temps du storyboard validé : une coquille architecturale vide
  (cinq plans en primitives — sol, mur du fond, deux murs latéraux, aucune
  géométrie importée ni texture, dans l'esprit abstrait déjà établi sur le
  reste du site) sous une lumière d'aube (une directionnelle chaude et
  basse, une hémisphère douce, un ambiant faible), avec une caméra qui
  dérive très légèrement selon la progression du scroll dans la section —
  juste de quoi prouver que le pipeline scroll → scène 3D fonctionne
  réellement, avant de lui confier la mise en scène complète des six temps
  dans une phase ultérieure. Pas de fauteuil, pas de module qui s'ajoute,
  pas de cycle des saisons à ce stade.

  Trois décisions techniques structurent ce socle : import dynamique sans
  SSR (`next/dynamic(..., { ssr: false })`, WebGL n'existe pas côté
  serveur) ; isolation du poids (`HouseScene.tsx` est le seul fichier du
  projet à importer `three`/`@react-three/fiber` — vérifié après un
  build de production que les deux chunks concernés, ~730 Ko à eux deux,
  n'apparaissent que dans le manifeste de chargement différé de
  `NotreHistoire`, jamais dans le bundle d'aucune autre route) ; repli en
  cascade avant même de tenter de charger la scène (`prefers-reduced-motion`
  actif OU `getContext("webgl")` indisponible → panneau statique neutre à
  la place, testé une seule fois au montage). Cohérent avec la règle déjà
  établie sur ce projet : ne jamais faire dépendre la présence d'un nœud
  DOM d'une valeur résolue différemment entre le rendu serveur et le
  premier rendu client avant hydratation (`canRender3D` initialisé à
  `false`, basculé uniquement dans un `useEffect` post-montage).

  **Un bug de cadrage caméra trouvé et corrigé pendant la construction.**
  Le premier essai de proportions (sol 9×7, caméra à distance 5.5, fov 38)
  produisait un rendu illisible — deux aplats de couleur sans profondeur
  visible, capturé à l'écran. Cause identifiée par le calcul : à cette
  distance/fov, le mur du fond remplissait presque tout le cadre,
  repoussant les murs latéraux hors champ ou à l'extrême bord. Corrigé en
  resserrant la pièce à une échelle de diorama plus humaine (sol 5×4, murs
  latéraux à x=±2.5, ouverture au premier plan en z=0) et en repositionnant
  la caméra (`[-0.5, 0.3, 3.4]`, fov 44) — revérifié à l'écran : une pièce
  intérieure correctement lisible, avec les deux murs latéraux qui
  convergent visiblement en perspective (un éclairé, un dans l'ombre de la
  directionnelle).

  **Vérifications de la phase 1, une par une :**
  - *Réactivité au scroll* : capture de la même zone de canevas à deux
    progressions de scroll différentes, diff pixel par pixel (`Pillow`) —
    différence confirmée (écart moyen 7.1, écart max 182 sur 0-255), la
    caméra dérive donc réellement en fonction du scroll, pas seulement au
    premier rendu.
  - *Repli `prefers-reduced-motion`* : `page.emulateMedia({reducedMotion:
    "reduce"})` — le panneau statique au dégradé neutre s'affiche à la
    place du canevas, confirmé à l'écran ; aucune erreur d'hydratation
    dans l'arbre `NotreHistoire`/`HouseScene` (la seule erreur d'hydratation
    présente dans les logs vient du `Hero`, déjà documentée comme bug
    pré-existant hors scope, tâche #94).
  - *Mobile* (390×844) : aucun débordement horizontal
    (`scrollWidth`/`clientWidth`), la coquille s'affiche correctement
    empilée sous le texte.
  - *Régression complète* : les 10 routes du site chargées en séquence,
    zéro nouvelle erreur console — les seules erreurs restantes
    (`ERR_TUNNEL_CONNECTION_FAILED`, `403`) viennent de médias Higgsfield
    déjà générés avant ce tour et bloqués par la politique réseau de ce
    sandbox (limitation déjà documentée), confirmé en isolant la requête en
    échec (`d8j0ntlcm91z4.cloudfront.net/.../*.mp4`) — sans rapport avec
    Three.js.
  - *Build de production* : `next build` échoue sur une erreur TypeScript
    dans `GlassPanel.tsx` (`TS2322`) — confirmé pré-existant et sans
    rapport avec ce tour en rejouant le même build sur le commit d'avant
    (`git stash` puis build : échec identique, ligne par ligne). Pour
    quand même vérifier l'isolation du bundle malgré ce blocage,
    `typescript.ignoreBuildErrors` a été activé temporairement le temps
    d'un seul build d'inspection, puis immédiatement annulé (`next.config.ts`
    revenu à l'identique, vérifié par `git diff` sans écart) — ce n'est pas
    une correction, seulement un contournement local et non committé pour
    lire le manifeste de chunks.

  Le texte à gauche de la section (deux paragraphes sur l'ossature Douglas
  et l'isolation RE2020) reste pour l'instant celui de l'ancienne version :
  explicitement documenté en commentaire comme un placeholder temporaire,
  pas la maquette finale — la vraie mise en page ("une seule phrase à la
  fin", plein cadre) et les cinq temps restants du storyboard (premier
  signe de vie, chaleur qui s'installe, module qui s'attache, saisons
  accélérées, révélation finale) sont volontairement reportés à une
  prochaine étape contrôlée, sur confirmation du client.
- **Notre histoire : validation technique de la phase 1, mais refus de la
  direction artistique — retour en arrière volontaire avant de continuer à
  coder.** Le client a validé le socle Three.js sans réserve, mais a
  rejeté la coquille elle-même : *"ce que je vois aujourd'hui ressemble
  davantage à une boîte vide qu'à une expérience premium [...] le problème
  n'est pas Three.js, le problème est que cette scène ne raconte encore
  rien."* Consigne explicite : ne plus écrire une seule ligne de code
  avant de comparer quatre directions artistiques complètement
  différentes sous forme de croquis simples.

  **Comparatif présenté hors du dépôt, comme un Artifact HTML** — pas de
  code produit dans cette passe, uniquement quatre concepts sous forme de
  "planches" avec mini-storyboard en trois temps chacune (SVG, primitives
  géométriques simples, pas de mesh 3D) : *L'écrin* (un module qui s'ouvre
  comme un coffret précieux), *La coupe habitée* (une maison de poupée qui
  s'entrouvre sur une pièce vécue, pas sur ses matériaux — la version
  corrigée de l'idée "anatomie du mur" abandonnée plus haut), *La façade
  qui émerge* (la brume, déjà signature du site, se retire sur une vraie
  maison), *L'assemblage suspendu* (des modules qui s'assemblent en vol,
  seule direction montrant littéralement "modulaire"). Recommandation
  personnelle donnée en toute franchise à la fin du comparatif (penchant
  pour "la coupe habitée").
- **Direction retenue : fusion de deux concepts, sous contrainte de
  retenue absolue façon Apple.** Le client a choisi *L'écrin* et
  *L'assemblage suspendu*, avec un garde-fou explicite répété plusieurs
  fois dans le message : *"Apple, pas démonstration technique [...]
  Est-ce qu'Apple ferait ce choix si Apple vendait une maison ?"* — pas de
  meubles visibles à l'ouverture, pas de "notice IKEA" si des éléments
  s'assemblent. Proposition d'un récit fusionné en cinq temps validée
  telle quelle : **Objet → Mystère → Ouverture → Révélation → Maison**.
  Cahier des charges explicite pour toute la suite du chantier : très peu
  d'éléments, beaucoup d'espace vide, matériaux irréprochables, lumière
  exceptionnelle, mouvements extrêmement lents, aucun effet "wow" gratuit
  — et consigne de consacrer plusieurs itérations à la seule
  composition/matière/lumière avant d'ajouter la moindre narration.

  **Itération 1 : uniquement le premier temps, "Objet".** L'ancienne
  coquille architecturale (`HouseScene.tsx`) est entièrement supprimée,
  remplacée par `MonolithScene.tsx` — un unique volume élancé et fermé, au
  repos, sans couture visible (elle n'apparaîtra qu'à l'itération
  "Ouverture"). Géométrie construite via `THREE.Shape` (un rectangle à
  coins arrondis, quatre `quadraticCurveTo`) extrudée avec bevel
  (`ExtrudeGeometry`) plutôt qu'un `BoxGeometry` brut — les arêtes
  adoucies sont ce qui distingue un objet "irréprochable" d'un pavé
  générique. `MeshPhysicalMaterial` avec un `clearcoat` modéré pour une
  matière lisse et dense plutôt que plastique.

  **Un vrai bug de lumière trouvé et corrigé en cours de réglage.** Le
  premier rendu était uniformément "lavé" — un dégradé gris clair couvrant
  toute la face plutôt qu'un reflet contenu. Cause de fond : une lumière
  directionnelle (rayons parallèles) donne, sur une face plane, un reflet
  spéculaire strictement uniforme sur toute la surface — impossible d'y
  dessiner un reflet localisé comme en photographie produit. Remplacée par
  une **`RectAreaLight`** (source rectangulaire avec une vraie position et
  une vraie taille, via `RectAreaLightUniformsLib.init()`), dont le reflet
  se contient naturellement en un dégradé le long d'une arête. En isolant
  chaque source une par une (tout à zéro, puis une seule à la fois) pour
  diagnostiquer la persistance du "lavage", un second bug est apparu :
  `scene.environment` (un environnement de réflexion généré localement via
  `RoomEnvironment`/`PMREMGenerator`, sans HDRI externe) continuait
  d'éclairer fortement le matériau même avec `envMapIntensity={0}` sur le
  `MeshPhysicalMaterial` — retirer entièrement `scene.environment` a fait
  chuter l'objet à un noir quasi total, confirmant qu'il était le vrai
  responsable. Plutôt que de creuser plus loin cette interaction
  (`envMapIntensity` non respecté), l'environnement synthétique a été
  purement et simplement retiré du chantier : plus simple, entièrement
  déterministe, cohérent avec l'esprit "très peu d'éléments" appliqué
  aussi aux sources de lumière elles-mêmes. L'éclairage final ne repose
  que sur quatre sources explicites (`RectAreaLight` chaude en clé,
  directionnelle froide très faible en contre-jour, ambiante discrète,
  directionnelle zénithale douce pour l'ombre de contact).

  **Composition resserrée après un premier cadrage bien trop serré** — le
  tout premier essai remplissait ~93% de la hauteur du cadre, à l'opposé
  de "beaucoup d'espace vide" (demande explicite) ; caméra reculée
  (`fov 30`, distance 8.2 au lieu de 4.3) pour un objet qui n'occupe plus
  qu'une fraction du cadre, entouré de vide silencieux. Repli
  `prefers-reduced-motion`/sans WebGL mis à jour pour refléter le nouveau
  parti pris sombre (dégradé anthracite au lieu de l'ancien dégradé clair
  hérité de la coquille architecturale).

  **Vérifications :** `tsc --noEmit` et `eslint` propres (seule l'erreur
  `GlassPanel.tsx` déjà documentée comme pré-existante subsiste) ;
  vérifié à l'écran que le repli `prefers-reduced-motion` affiche bien le
  nouveau panneau sombre sans canevas dans la section (aucune régression
  d'hydratation propre à `NotreHistoire`) ; mobile 390×844 sans
  débordement horizontal ; régression complète sur les 10 routes du
  site, aucune nouvelle erreur console.
- **Notre histoire : deuxième passe de réglage sur le monolithe — "une
  planche, pas un objet iconique".** Retour détaillé du client sur cinq
  points précis après la première version de l'itération 1, plus une
  réserve conceptuelle de fond. Aucun changement de structure ni de
  narration — uniquement l'exécution, exactement le travail que le client
  avait demandé de faire avant d'ajouter la moindre animation.

  **Proportions et chanfreins.** Le volume est désormais construit en deux
  pièces plutôt qu'une seule : un corps élancé posé sur un socle légèrement
  plus large (1.24 contre 1.15 de largeur), séparés par un fin joint creux
  — une proportion de plinthe classique en architecture/ébénisterie.
  Chanfreins multipliés par ~3 (`bevelSize`/`bevelThickness` 0.05 contre
  0.016) et segments de courbure doublés (10 contre 6) pour une arête qui
  accroche vraiment la lumière plutôt que d'exister à peine.

  **Réserve conceptuelle — "il y a quelque chose d'architectural
  là-dedans".** Le socle plus large que le corps est la réponse directe à
  cette demande : ni une maison ni une façade dessinée ("pas besoin d'être
  littéral", demande explicite), juste la proportion qu'un œil reconnaît
  inconsciemment comme relevant du bâti plutôt que de l'objet manufacturé
  pur (boîte, livre, enceinte).

  **Matière — grain de bois procédural.** Un `THREE.CanvasTexture` généré
  une fois en mémoire (fond gris neutre, traits verticaux clairs/sombres à
  très faible opacité, tracé en `bezierCurveTo` pour un veinage légèrement
  irrégulier plutôt que des lignes droites mécaniques) branché à la fois
  en `roughnessMap` et en `bumpMap` (`bumpScale` 0.0015, quasi
  imperceptible en lumière plate, mais qui accroche différemment sous un
  éclairage rasant) — toujours zéro dépendance réseau, cohérent avec le
  choix déjà fait pour l'éclairage. `clearcoat` remonté à 0.55 avec un
  `clearcoatRoughness` abaissé à 0.12 pour un vernis plus net.

  **Lumière — dramaturgie façon photographie produit.** La clé
  (`RectAreaLight`) resserrée à une largeur de 0.16 (contre 0.9) pour
  devenir une lame de lumière plutôt qu'un panneau large, intensité
  fortement relevée en compensation (jusqu'à 400) pour qu'elle reste
  perceptible malgré sa taille réduite. Contre-jour et ambiant — remontés
  à la passe précédente pour compenser un rendu jugé trop sombre — ramenés
  au contraire beaucoup plus bas (`ambientLight` 0.02, contre-jour 0.05) :
  le compromis clarté/contraste tranché cette fois nettement du côté du
  contraste, conformément à "laisser le reste disparaître".

  **Atmosphère — un halo, pas un élément.** Un unique sprite en dégradé
  radial (généré via `canvas.createRadialGradient`, fusion additive,
  `depthWrite={false}`) placé derrière l'objet du côté de la clé lumineuse
  — une ambiance, pas un objet supplémentaire, conformément à "je ne
  rajouterais surtout pas des éléments". Un vignettage en CSS pur (dégradé
  radial semi-transparent sur un calque superposé au canevas, aucun coût
  de rendu WebGL) referme le cadre vers le centre.

  **Tension — lévitation de quelques millimètres.** L'objet est surélevé
  d'un petit décalage constant au-dessus du sol (`levitate = 0.035`, à
  l'échelle de la scène), assez pour qu'un mince trait de vide sépare sa
  base de son ombre de contact — "comme s'il était précieux" — sans
  perdre l'ancrage au sol obtenu à la passe précédente.

  **Vérifié à l'écran** après chaque réglage plutôt qu'en une seule passe
  — un premier essai de resserrement de la clé lumineuse (largeur 0.16,
  intensité 130, position éloignée) n'a produit aucun reflet visible du
  tout sur l'objet (vérifié par échantillonnage de pixels sur toute la
  face : aucune variation), la lumière étant trop loin et trop étroite
  pour porter jusqu'à la surface ; repositionnée plus proche et intensité
  remontée à 400 pour obtenir un dégradé net et perceptible depuis l'arête
  gauche. `tsc --noEmit` et `eslint` propres, repli `prefers-reduced-motion`
  et rendu mobile revérifiés sans régression, régression complète sur les
  10 routes sans nouvelle erreur.
- **Notre histoire : les trois preuves fortes de l'ancien `KeyFigures`
  verrouillées dans la narration future — aucun code touché ce tour.** Le
  client a remarqué leur disparition (20 ans de garantie, 4–12 semaines de
  livraison, 100 % fabriqué en France — retirées avec le reste de l'ancien
  `KeyFigures` pendant le pivot vers la scène 3D) et a été clair : elles
  restent des arguments essentiels, mais ne doivent plus jamais revenir
  sous forme de bloc de statistiques alignées. Consigne : chacune doit être
  *découverte* au moment précis où elle prend sens dans le récit en cinq
  temps plutôt qu'énumérée sur la page — "20 ans" pendant "Mystère" quand
  la matière et la durabilité se ressentent, "4–12 semaines" pendant
  "Ouverture" au moment où le module s'assemble ou où le temps s'accélère,
  "100 % fabriqué en France" en toute fin de "Maison" comme une signature
  discrète gravée dans le bois plutôt qu'affichée. Racontées, pas
  énumérées. Comme le chantier en est toujours à l'itération 1
  (composition/matière/lumière de l'état "Objet" seul, aucune narration ni
  copie encore écrite), cette exigence est simplement consignée en
  commentaire dans `NotreHistoire.tsx` pour ne pas se perdre d'ici à ce que
  les temps "Ouverture"/"Révélation"/"Maison" soient construits — aucun
  changement de comportement ni de rendu dans ce tour.
- **Notre histoire : troisième passe sur "Objet" — "je ne ressens pas
  encore l'effet objet d'exception".** Le client valide la répartition des
  trois preuves fortes dans la future narration, mais refuse
  explicitement de passer à "Mystère"/"Ouverture" tant que ce premier
  temps n'est pas exceptionnel — pas pour ajouter des fonctionnalités,
  pour pousser l'exécution sur quatre axes (silhouette, matière, lumière,
  composition), plus une demande précise : trois variantes de silhouette
  réelles à comparer avant de choisir.

  **Matière et lumière poussées plus loin sur le volume déjà validé**
  (committé, applicable quelle que soit la silhouette retenue) : le grain
  de bois passe à deux fréquences superposées (larges bandes douces pour
  la profondeur du veinage + traits fins pour le micro-détail, toujours
  généré localement) ; `clearcoat` remonté à 0.68 avec `clearcoatRoughness`
  abaissé à 0.07 pour des micro-reflets plus nets ("les micro-reflets du
  vernis", demande explicite) ; une deuxième lame de lumière (`RimRectLight`,
  froide, très faible) ajoutée du côté opposé à la clé — la forme se lit
  maintenant par deux arêtes distinctes plutôt qu'un unique dégradé sur la
  face ("une lumière qui révèle les arêtes plutôt qu'elle n'éclaire
  l'objet", demande explicite). Caméra rapprochée (distance 6.7 contre
  8.2) pour donner plus de présence à l'objet dans le cadre sans perdre le
  vide qui l'entoure.

  **Trois silhouettes réelles construites pour comparaison, une seule
  committée.** Plutôt que des croquis abstraits comme pour le comparatif
  précédent, cette fois trois vrais volumes rendus dans la scène — même
  matière, même lumière, même composition, seule la géométrie change —
  pour que la comparaison soit honnête. *La Stèle* (A, la géométrie déjà
  en place, un rectangle élancé sur socle) ; *Le Fuseau* (B, le corps
  effilé progressivement vers le sommet via une manipulation directe des
  sommets du maillage — chaque vertex de `bodyGeometry` réévalué après
  extrusion, mis à l'échelle en X/Z selon sa hauteur normalisée,
  `geo.computeVertexNormals()` pour que l'éclairage reste correct sur la
  nouvelle forme) ; *Le Biseau* (C, un sommet tranché en un seul plan
  incliné — obtenu en dessinant directement un profil 2D asymétrique,
  `wedgeShape`, avec un coin supérieur plus haut que l'autre, plutôt qu'en
  déformant après coup). Les trois rendues et comparées côte à côte dans
  un second Artifact (même identité visuelle que le premier comparatif,
  cohérence de série). Recommandation personnelle donnée sur C — la seule
  des trois qui gagne à la fois sur la reconnaissance en silhouette pure
  et sur l'évocation architecturale sans dessiner littéralement une
  maison. Seule la géométrie A (déjà en place, avec la matière/lumière
  améliorées) reste committée à l'issue de ce tour : B et C existent
  uniquement comme code exploratoire non conservé, le temps de produire
  les captures — pas de code mort laissé dans le dépôt pour deux
  directions pas encore choisies.

  **Vérifié à chaque variante** avant de passer à la suivante (`tsc
  --noEmit`, `eslint`, capture d'écran) puis une dernière fois sur l'état
  final committé (A + matière/lumière/composition améliorées) : repli
  `prefers-reduced-motion` et rendu mobile toujours sans régression,
  régression complète sur les 10 routes sans nouvelle erreur.
- **Notre histoire : silhouette tranchée — "La Stèle" validée.** Réponse
  du client au comparatif des trois variantes : *"franchement je valide
  A"* — contre ma recommandation (qui penchait pour le Biseau). Rien à
  changer dans le rendu, la géométrie A était déjà la seule committée
  dans le dépôt ; les commentaires de `MonolithScene.tsx` sont mis à jour
  pour documenter la décision (nom "La Stèle" donné à la géométrie,
  recommandation notée, choix final du client explicite) plutôt que de
  laisser le fichier parler d'un choix encore ouvert.
- **Notre histoire : itération 2, premier temps scrollé — "Mystère →
  Ouverture".** Le client a confirmé être satisfait de l'état "Objet"
  ("oui go") : premier chantier de scroll réel depuis le pivot Three.js,
  construisant les deux temps suivants du récit — *"Une couture apparaît.
  Le volume s'ouvre très lentement. Une lumière chaude s'en échappe."*
  Rien au-delà : ni "Révélation" (les éléments qui s'assemblent en
  architecture) ni "Maison" (la signature finale), volontairement laissés
  à une prochaine itération contrôlée.

  **Le corps ("La Stèle") est scindé en deux moitiés** qui se touchent
  exactement au repos — indiscernables d'un seul volume plein tant que le
  scroll n'a pas commencé. Chaque moitié est un profil dessiné en 2D avec
  une arête de couture franche (x=0, sans courbure) et un bord extérieur
  arrondi, extrudé sans chanfrein de profondeur (voir bug ci-dessous).
  Rotation de chaque moitié autour de sa propre couture (l'origine locale
  de sa géométrie n'est pas recentrée en X, contrairement à `geo.center()`
  habituel) — comme deux portes qui s'entrouvrent, angle maximal
  volontairement faible (9°, "ce n'est que le tout début de l'ouverture").
  Progression de scroll réintroduite avec le même schéma que le squelette
  initial (`getBoundingClientRect` throttlé par `requestAnimationFrame`,
  lu dans `useFrame` plutôt que via un state React).

  **Trois bugs réels trouvés et corrigés en vérifiant à l'écran, pas
  seulement en théorie :**
  - *Aucune évolution visible malgré une progression de scroll
    correcte.* Premier essai à 9° : rotation et lueur strictement
    invisibles à l'écran quel que soit le scroll, alors que les logs de
    debug confirmaient des valeurs cohérentes. Angle temporairement monté
    à 35° pour isoler le problème : la rotation devenait visible, prouvant
    que le mécanisme fonctionnait — le seuil de 9° était simplement trop
    fin pour se voir sur une capture, pas un bug.
  - *La lueur elle-même restait invisible même à intensité 40 (au lieu de
    ~1.6 prévu).* La lame et le point light étaient positionnés légèrement
    à l'intérieur du chanfrein du volume fermé — donc occultés par la
    propre géométrie de l'objet. Repositionnés nettement en avant du plan
    frontal (`BODY_DEPTH / 2 + 0.08` plutôt que `+ 0.03`), confirmé visible
    à l'écran avant de rebaisser l'intensité à une valeur réellement
    subtile.
  - *Un trait clair permanent au centre de l'objet, identique à l'état
    fermé et à l'état ouvert* — donc indépendant de l'animation, la preuve
    qu'il venait de la géométrie et non du scroll. Cause : le chanfrein
    d'`ExtrudeGeometry` s'applique à tout le pourtour du profil, y compris
    l'arête de couture (pourtant droite dans le tracé 2D) ; deux moitiés
    dont les chanfreins de couture se touchent forment une arête convexe
    qui accroche fortement la lumière. Corrigé en désactivant
    `bevelEnabled` sur les moitiés — l'arrondi des coins extérieurs dans
    le tracé 2D suffit à garder une arête douce vue de face.
  - *Une "lueur" visible même avant tout scroll*, qui a fait suspecter un
    autre bug — en réalité un artefact de méthode de test :
    `elementHandle.screenshot()` de Playwright fait défiler l'élément
    entièrement dans le cadre avant de capturer, changeant silencieusement
    la position de scroll réelle par rapport à celle vérifiée juste avant
    via les logs de debug. Confirmé en isolant un test par capture de page
    complète (sans laisser Playwright déplacer le scroll) : au repos réel,
    aucune lueur.
  - *Seuils de phase recalés après un vrai test de visibilité.* Le corps
    est centré verticalement dans la section : avec un premier découpage
    naïf (0→40 % pour "Mystère", 40→100 % pour "Ouverture" sur toute la
    traversée de la section), la couture était déjà à moitié allumée dès
    que l'objet devenait réellement visible à l'écran. Décalé à 35→65 %
    et 65→100 % : l'objet reste fermé un vrai moment après être devenu
    lisible, avant que "Mystère" ne commence — vérifié en calculant le
    scroll nécessaire pour que la carte (centrée dans la section) devienne
    pleinement visible, qui coïncide avec le nouveau seuil de 35 %.

  **Nettoyage** : le grain de bois et le matériau, dupliqués entre le
  corps et le socle dans un premier temps, sont maintenant générés une
  seule fois dans `MonolithScene` et partagés par les deux.

  **Vérifications** : `tsc --noEmit`/`eslint` propres (seule l'erreur
  `GlassPanel.tsx` déjà documentée comme pré-existante subsiste) ; repli
  `prefers-reduced-motion` et rendu mobile revérifiés après le refactor
  du matériau partagé, régression complète sur les 10 routes sans
  nouvelle erreur.

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
