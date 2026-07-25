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

## Pivot complet : "Traverser la forêt Bellora" (prototype)

Demande explicite et sans ambiguïté du client, après validation de l'objet
("La Stèle") et du début de narration "Mystère → Ouverture" : abandon total
de toute la direction "monolithe" — *"Je veux qu'on abandonne complètement
la direction actuelle avec le monolithe sombre, la couture lumineuse et
l'ambiance presque noire. Je ne veux plus essayer de réparer cette idée."*
`MonolithScene.tsx` est supprimé dans son intégralité (`rm`), aucune ligne
réutilisée — la direction elle-même était rejetée, pas seulement son
exécution.

**Nouveau concept** : le visiteur ne regarde plus un objet isolé, il
traverse un paysage. Séquence en quatre temps pilotée en continu par le
scroll : la forêt → le passage qui s'ouvre (les arbres s'écartent, avancée
caméra) → la clairière et le lac → les informations Bellora en panneaux
Liquid Glass "flottants" dans le paysage. Direction artistique : lumineuse,
naturelle, premium, apaisante — référence Apple pour la précision et le
contrôle du mouvement, mais une identité organique/architecturale plutôt
que minérale. Liste d'exclusion explicite du client, à ne jamais
réintroduire : fond noir, ambiance mystérieuse, monolithe, scène produit
sombre, forêt cartoon/jeu vidéo, excès de détails, cartes blanches
classiques, animations rapides.

**Portée volontairement limitée à un prototype**, demande explicite avant
de construire toute la scène : caméra + une quinzaine d'arbres + une
lumière + le lac + un seul panneau Liquid Glass (sur les trois prévus à
terme), pour valider la sensation de déplacement, la lumière, la
profondeur et le comportement du scroll avant d'ajouter le reste.

**Section épinglée** (`NotreHistoire.tsx`) : technique standard sans
dépendance supplémentaire — un conteneur `height: 400vh` enveloppe un
panneau `sticky top-0 h-screen`. Tant que le conteneur défile, le panneau
reste collé en haut du viewport ; une fois son bas atteint, il se détache
naturellement et le scroll normal reprend — ce qui satisfait directement
l'exigence du client ("libération de la section une fois la séquence
terminée") sans code dédié. Un seul `progressRef` (0→1 sur toute la course
de la section) est calculé une fois par un handler de scroll throttlé en
`requestAnimationFrame`, puis distribué par deux canaux qui contournent
tous les deux le state React (même discipline que sur tout le reste du
site — jamais de re-render au pixel scrollé) : lu dans `useFrame` côté
scène R3F, et appliqué en mutation directe de style (`opacity`/`transform`)
sur le panneau Liquid Glass, un élément DOM ordinaire superposé au canvas.

**Le panneau Liquid Glass n'est pas en 3D.** Refaire la transparence, le
flou d'arrière-plan et les reflets subtils en WebGL (matériaux de
transmission + render target) aurait été une reconstruction coûteuse d'un
système déjà approuvé et utilisé partout ailleurs sur le site. Le panneau
réutilise directement `GlassPanel` (`tone="light"`, classe `.glass` :
`backdrop-filter: blur(13px) saturate(180%)`), positionné en overlay
absolu au-dessus du `<canvas>`.

**Scène 3D** (`ForestScene.tsx`, nouveau fichier) : arbres low poly traités
de façon architecturale plutôt que jeu vidéo — tronc en cylindre à 5
segments, double cône à 6 segments pour la canopée, `flatShading` partout,
palette naturelle sourde. Chaque arbre a une position de repos et un
`useFrame` qui l'écarte progressivement (écartement asymétrique par arbre
via un `partAmount` aléatoire, pas un mouvement uniforme mécanique) sur la
tranche de progression 0.20–0.55. La caméra avance en ligne continue de
`z=6.5` à `z=-15` sur 85 % de la progression puis se stabilise pendant que
le panneau glass apparaît. Un brouillard linéaire (`THREE.Fog`) recule
(`far` 15→42) entre 0.30 et 0.75 pour donner la sensation d'ouverture vers
la clairière. Éclairage naturel : un soleil directionnel qui se réchauffe
et s'intensifie à l'approche du lac, une hémisphère (ciel/sol) pour le
rebond extérieur, un ambiant très faible en appoint — volontairement aucune
source "spectaculaire".

**Repli adapté à une section épinglée.** Contrairement aux itérations
précédentes, le repli `prefers-reduced-motion`/pas de WebGL ne peut pas se
contenter de remplacer le contenu 3D à l'intérieur du même conteneur
`400vh` — ça forcerait un utilisateur en repli à défiler quatre écrans
vides pour rien. `canRender3D === false` fait donc bifurquer tout le
rendu vers une section de hauteur normale, non épinglée, avec les 3 preuves
en pastilles `GlassPanel` — une branche de retour anticipé, pas juste un
enfant conditionnel.

**Deux bugs réels trouvés et corrigés en vérifiant à l'écran :**
- *Le lac n'apparaissait dans aucune capture, à aucun moment de la
  séquence.* Le plan de sol (`Ground`, opaque, `y=0`) recouvrait
  entièrement l'emplacement du lac (`y=-0.02` à l'origine, donc *en
  dessous* du sol) depuis l'angle de vue plongeant de la caméra — le sol
  passait devant, jamais le lac derrière. Corrigé en remontant le lac à
  `y=0.03`, légèrement au-dessus du sol, pour qu'il le recouvre
  visuellement comme un vrai plan d'eau.
- *Une ligne d'horizon dure entre le ciel pâle et le sol sombre*, au lieu
  d'un fondu atmosphérique progressif. Cause identifiée à tort au premier
  passage comme un problème de brouillard (le sol s'arrêtait à une
  distance encore dans la plage active du brouillard, créant un bord net) —
  corrigé une première fois en agrandissant le sol (`PlaneGeometry(70,
  130)`) pour que son bord physique tombe toujours bien au-delà de la
  portée maximale du brouillard. La bande dure a persisté malgré tout : la
  vraie cause était le frustum de la `shadow-camera` du soleil directionnel,
  resté sur ses valeurs par défaut Three.js (une boîte orthographique
  d'environ ±5 unités) — minuscule face à un sol de 70×130 et à une caméra
  qui parcourt une trentaine d'unités en z. Tout ce qui tombait hors de
  cette petite boîte échantillonnait un texel de bord de la shadow map,
  produisant une bande sombre nette exactement à la frontière du frustum.
  Corrigé en donnant des bornes explicites et généreuses
  (`shadow-camera-left/right/top/bottom/near/far`) couvrant toute
  l'étendue visible de la scène — revérifié à `0.5`, `0.7`, `0.9` et `1.0`
  de la progression : fondu doux, plus de ligne dure.

**Vérifications** : `tsc --noEmit`/`eslint` propres (seule l'erreur
`GlassPanel.tsx` déjà documentée comme pré-existante subsiste) ; séquence
complète revérifiée à l'écran sur `[0, 0.1, 0.3, 0.5, 0.7, 0.9, 1.0]` de la
progression (lac visible, horizon adouci, panneau glass qui apparaît
progressivement en fin de course) ; repli `prefers-reduced-motion` revérifié
(section normale, non épinglée, 3 pastilles glass, aucun canvas forêt) ;
rendu mobile (390×844) revérifié ; régression complète sur les 10 routes
sans nouvelle erreur.

**Portée non construite à ce stade, sur demande explicite** : les deux
autres panneaux Liquid Glass ("4–12 semaines", "100 % France"), tout
raffinement supplémentaire sur la lumière/la matière/la composition — en
attente du retour du client sur ce premier prototype avant d'aller plus
loin.

## Forêt Bellora : passe qualité ("ça fonctionne" → "c'est beau")

Retour du client sur le prototype : la sensation de déplacement et le
principe de la traversée sont validés ("pour la première fois, je comprends
pourquoi la 3D est présente"), mais l'exécution visuelle ne l'est pas —
arbres "très Unity 2015", sol plat et gris, lumière blanche et uniforme,
ombres dures, Liquid Glass qui ne dialogue pas avec le décor. Rôle donné
explicitement pour cette passe, via le nouveau skill `3d-web-experience` :
matériaux, lumière, atmosphère, profondeur, performance — jamais de
particules, de bloom, de lens flare ni d'animation gadget. Direction
demandée : *"visualisation d'architecture premium, pas jeu vidéo low
poly"*, palette scandinave (ciel crème, brume chaude, verts désaturés,
troncs chauds, lumière de fin d'après-midi).

**Palette repensée** : ciel `#f4ead9` (crème chaud, contre `#eef2ea`
froid), sol `#8c8a70` (khaki désaturé, contre le vert sombre `#4a5240`
précédent), canopées en verts sourds (`#78876a`/`#8c9a7c`/`#828f6e`),
troncs plus chauds (`#8a6a4a`). Le brouillard suit la même teinte que le
ciel, comme avant.

**Lumière** : le soleil directionnel passe d'une position haute et neutre
à une position basse et dorée (fin d'après-midi, `position={[-9, 3.6,
4]}`), avec deux teintes chaudes (jamais froides) entre lesquelles il
transitionne selon le scroll — seules l'intensité et l'ampleur changent à
l'approche de la clairière, jamais la "température". `ambientLight` et
`hemisphereLight` relevés pour adoucir le contraste des ombres, jugées
trop dures ; `shadow-radius` + `Canvas shadows="soft"` (PCFSoftShadowMap)
pour un flou d'ombre au lieu d'un bord dur.

**Arbres — trois archétypes au lieu d'un seul gabarit répété**
(`ForestScene.tsx`) : conifère (double cône affiné), feuillu arrondi
(icosaèdre bas-poly sur tronc court — silhouette ronde inédite jusqu'ici),
colonnaire élancé (cône unique haut et fin). Répartition aléatoire
pondérée (58 % / 24 % / 18 %) plus une rotation Y aléatoire par arbre pour
casser l'effet "copié-collé" des facettes. Géométries et matériaux
définis une seule fois au niveau du module et partagés par toutes les
instances plutôt que recréés par arbre (perf : un seul jeu de buffers GPU
par archétype, pas quinze jeux dupliqués — l'occasion de corriger au
passage un gaspillage déjà présent dans le prototype).

**Le lac devient le point focal**, demande explicite du client ("le lac
pourrait devenir le héros") : `MeshReflectorMaterial` (`@react-three/drei`,
nouvelle dépendance) remplace le `MeshStandardMaterial` plat du prototype
— un miroir qui reflète en temps réel le ciel et les arbres, flouté pour
rester calme plutôt que net. **Premier réglage trouvé trop flou à
l'écran** (`mixBlur={9}`) : le lac ne se distinguait plus du sol, juste un
ovale pâle sans aucun reflet visible — corrigé en ramenant `mixBlur` à
`2.2` et en resserrant le blur du reflet (`[140, 70]`), ce qui laisse
apparaître les silhouettes des arbres reflétées, vérifié à l'écran.
Teinte du lac volontairement plus fraîche/bleutée (`#a9c2bd`) que le reste
de la palette chaude — un vrai plan d'eau lit plus froid que la terre et
le ciel autour, ce contraste doux le rend lisible comme eau plutôt que
comme un patch de terrain pâle voisin de la même couleur.

**Le panneau Liquid Glass "flotte"** (`NotreHistoire.tsx`) : un bob
vertical très lent (`forest-panel-float`, 7 s, ±7 px, `globals.css`) sur
un conteneur séparé du transform piloté par le scroll (JS, sur le parent),
pour que les deux animations ne s'écrasent pas l'une l'autre. Un reflet
sous la carte évoque sa présence au-dessus du lac sans reconstruire de
synchronisation 3D-DOM complexe : un second bloc `aria-hidden`, stylé avec
la même classe `.glass`, inversé verticalement (`scale-y-[-1]`, via la
propriété CSS `scale` en Tailwind v4 — pas `transform`, vérifié par
`getComputedStyle`), flouté et estompé en dégradé — vide de tout contenu
pour ne jamais dupliquer de texte lisible à l'envers.

**Vérifications** : `@react-three/drei` ajouté (`npm install`) ;
`tsc --noEmit`/`eslint` propres (seule l'erreur `GlassPanel.tsx`
pré-existante subsiste) ; séquence complète revérifiée à l'écran sur
`[0, 0.1, 0.3, 0.5, 0.7, 0.9, 1.0]` de la progression après le réglage du
lac (reflets des arbres visibles, panneau qui apparaît en fin de course) ;
classe d'animation et bloc de reflet confirmés présents et actifs dans le
DOM via `getComputedStyle` (nom d'animation, durée, itération infinie,
`scale` calculé) plutôt que supposés à partir du seul code source ; repli
`prefers-reduced-motion` et rendu mobile (390×844) revérifiés ; régression
complète sur les 10 routes sans nouvelle erreur.

## Forêt Bellora : refonte "visualisation architecturale" + transition vers les gammes

La narration est validée par le client ("pour la première fois, je
comprends pourquoi la 3D est présente"), mais l'exécution reste jugée trop
"prototype Blender ou Unity". Nouvelle référence donnée explicitement :
visualisation d'architecture premium (Apple, studios comme Luxigon), plus
jamais "low poly" comme horizon. Deux décisions structurantes en plus de
la question esthétique, toutes deux appliquées dans ce round :

**1. Fin de séquence entièrement repensée.** Le panneau Liquid Glass "20
ans de garantie" disparaît — ce chiffre existe déjà ailleurs sur le site
(`SavoirFaire.tsx`, `Procede.tsx`), rien n'est perdu à l'enlever d'ici. À
la place, la scène se termine sur **trois volumes architecturaux qui
émergent dans la clairière**, au-delà du lac, sans aucune étiquette ni
texte — *"je ne veux pas d'un décor, je veux une ambiance"*.
`NotreHistoire.tsx` place cette section juste au-dessus de
`GammesPreview` sur `page.tsx` : la traversée devient la transition
naturelle vers les trois vraies fiches gamme (nom, visuel, lien) plutôt
qu'un doublon d'information — confirmé en lisant l'ordre des sections sur
la page d'accueil avant de coder quoi que ce soit. Le panneau `panelRef`
et son canal de scroll séparé disparaissent avec lui : un seul
`progressRef` suffit maintenant.

**2. Les arbres ne glissent plus latéralement.** Demande explicite :
*"imagine que la caméra avance, et que les arbres s'écartent naturellement
comme si le chemin existait déjà"*. Le corridor est donc **statique** —
chaque arbre a une position fixe (resserrée près de l'entrée, de plus en
plus large en profondeur) — et seule la caméra avance sur toute la course
du scroll, avec une légère montée en fin de parcours. Aucun `useFrame` par
arbre : le mouvement perçu vient uniquement du déplacement de la caméra à
travers un lieu qui existait déjà, jamais d'un objet qui s'anime
lui-même — plus sobre, et concrètement moins de travail par frame (neuf
arbres statiques plutôt que quinze qui écrivaient leur position à chaque
frame).

**Les arbres deviennent des "objets de design"** plutôt que des
empilements de primitives standard : chaque tronc et chaque couronne est
un seul profil 2D révolu (`THREE.LatheGeometry`) — une silhouette
sculptée continue, dessinée une fois, plutôt que des pièces de kit
(cône + cône + cylindre) assemblées. Trois archétypes (conifère élancé,
forme arrondie, colonne fine) partagent leurs géométries/matériaux au
niveau du module. Le nombre d'arbres est réduit de quinze à neuf et
l'espacement augmenté — *"le paysage doit être extrêmement minimaliste"*
— pour que chaque silhouette se lise comme un objet posé avec soin plutôt
que comme un remplissage de décor.

**Trois volumes architecturaux très simples** (`HouseCluster`,
`ForestScene.tsx`) : jamais plus qu'une boîte + une dalle de toit fine,
walls pâles (`#e7ddc8`) contre une toiture sombre (`#3b3227`) — le
contraste clair/sombre d'une vraie photo d'architecture, qui les fait
ressortir nettement de la palette verte/khaki du paysage. Le plus grand
volume ("Prestige") a une aile attachée pour suggérer une composition
plus sophistiquée, toujours avec seulement des boîtes. Ils "émergent" :
opacité et une légère montée depuis le sol, toutes deux pilotées par la
progression (0.78→1.0), jamais avant que la clairière ne soit largement
ouverte.

**Bug trouvé et corrigé à l'écran** : au premier rendu du corridor
statique, l'arbre le plus proche de l'entrée occupait tout le bord gauche
de l'écran — un immense aplat sombre méconnaissable, pas un arbre. Cause :
le point de départ du corridor (`z = 5`) plaçait le premier arbre à
seulement 0.5–2.5 unités de la position de départ de la caméra (`z =
6.5`), largement trop près pour le champ de vision (52°) à cette
distance. Corrigé en reculant le point de départ du corridor (`z = 2.5`)
et en resserrant légèrement l'échelle maximale des arbres proches ; revérifié
à l'écran, cadrage normal restauré.

**Vérifications** : `tsc --noEmit`/`eslint` propres (seule l'erreur
`GlassPanel.tsx` pré-existante subsiste) ; séquence complète revérifiée à
l'écran sur `[0, 0.1, 0.3, 0.5, 0.7, 0.9, 1.0]` de la progression avant et
après le correctif de cadrage ; repli `prefers-reduced-motion` (inchangé,
toujours les preuves fortes en glass — un repli d'accessibilité n'a pas à
changer parce que la version animée ne montre plus les mêmes informations)
et rendu mobile (390×844) revérifiés ; régression complète sur les 10
routes sans nouvelle erreur.

## Forêt Bellora : exécution finale — retrait des maisons, vraies cartes gammes

Recadrage net du client après le round précédent, qui avait dérivé vers un
concept intermédiaire (montagnes, maisons simplifiées) non demandé :
*"le concept est déjà validé [...] je ne cherche plus une nouvelle idée
[...] ne cherche plus à inventer, cherche à perfectionner."* Un aller-retour
supplémentaire (concept statique publié en Artifact pour proposer une
nouvelle direction) a d'ailleurs été explicitement recadré par le client
comme une itération de trop — le déroulé (forêt → la caméra avance → les
arbres s'écartent → le lac → les trois cartes gammes au-dessus du lac →
le scroll continue) était déjà acquis depuis plusieurs rounds ; la seule
tâche restante était l'exécution.

**Les trois volumes architecturaux simplifiés disparaissent.** *"Les
espèces de cubes blancs [...] ça casse tout [...] soit on montre les
vraies maisons, soit on ne montre rien, mais certainement pas des
cubes."* `HouseCluster`, `House`, `wallMaterial`, `roofMaterial` sont
supprimés en bloc de `ForestScene.tsx` — c'était par ailleurs le poste le
plus coûteux de la scène (douze meshes, deux matériaux transparents mutés
à chaque frame), donc un gain de performance net au passage, pas seulement
un choix esthétique.

**Les vraies cartes gammes reviennent, au-dessus du lac.** *"Les cartes
existent déjà"* — `NotreHistoire.tsx` importe directement `GAMMES` de
`lib/gammes.ts` (mêmes photos, mêmes intitulés, mêmes liens que
`GammesPreview`) plutôt que d'inventer un nouveau contenu ou une nouvelle
mise en page de carte. Trois cartes Liquid Glass compactes (photo 4:5,
badge nom, tagline) apparaissent en cascade au-dessus du lac — chacune
avec un seuil de révélation décalé (`CARD_REVEAL_STAGGER`, 0.06 de
progression par carte) pour un enchaînement plutôt qu'un pop synchrone des
trois à la fois — et pointent vers les vraies pages `/gamme-*`. Chaque
carte reprend le même bob vertical très lent et le même reflet sous la
carte déjà utilisés pour le panneau KPI du round "passe qualité" (revenus
avec cette itération), avec un piège déjà connu évité dès l'écriture :
le transform de révélation piloté par le scroll (JS, sur le `<Link>`) et
le bob piloté par CSS (`@keyframes forest-card-float`) sont posés sur deux
éléments DOM distincts (un conteneur interne pour le bob) — sur le même
élément, l'animation CSS écraserait le transform inline à chaque frame,
un bug déjà rencontré et documenté au round précédent pour le panneau
unique, donc anticipé ici avant même de tester à l'écran.

**Arbres légèrement affinés, pas redessinés** — la consigne était de
perfectionner, pas de réinventer une quatrième fois : les profils
`LatheGeometry` sont resserrés (rayons de couronne réduits d'environ
20-25 %) pour un rendu plus "fin et géométrique", et leur nombre réduit
de neuf à sept pour plus d'air et un budget de rendu plus serré.

**Caméra recentrée sur le lac** : sans maisons au-delà, l'arrêt final de
la caméra recule de `z = -24` à `z = -19`, directement au-dessus du lac
plutôt que de continuer vers un point vide — cohérent avec le déroulé où
la révélation se joue "au-dessus du lac", pas plus loin.

**Vérifications** : `tsc --noEmit`/`eslint` propres (seule l'erreur
`GlassPanel.tsx` pré-existante subsiste) ; séquence complète revérifiée à
l'écran sur `[0, 0.1, 0.3, 0.5, 0.7, 0.9, 1.0]` de la progression (lac
visible, cascade des trois cartes confirmée) ; repli
`prefers-reduced-motion` et rendu mobile (390×844) revérifiés — les trois
cartes s'alignent proprement côte à côte même en 390px de large ;
régression complète sur les 10 routes sans nouvelle erreur. Les photos des
trois cartes n'ont pas pu être vérifiées visuellement dans ce bac à
sable — le CDN Higgsfield qui les héberge y est bloqué (limitation
pré-existante, déjà documentée), donc les captures d'écran montrent le
texte alternatif à la place de l'image ; le code utilise `next/image`
exactement comme `GammesPreview.tsx`, qui affiche ces mêmes images
correctement en production.

## Retour en arrière complet : abandon de l'exploration 3D temps réel

Après cinq tours consécutifs sur une exploration 3D temps réel
(coquille architecturale → monolithe → forêt Bellora, trois directions
artistiques différentes en cours de route), le client a arrêté le
chantier : *"le site commence à perdre en fluidité [...] nous passons
beaucoup de temps à résoudre des problèmes techniques au lieu
d'améliorer le site [...] je préfère repartir sur une base propre et
stable [...] nous reviendrons plus tard sur une grande expérience 3D,
mais seulement lorsque le reste du site sera terminé."*

Demande explicite : texte à gauche, un élément 3D à droite comme avant,
les informations qui tournent/changent progressivement — "la version
précédente". Plutôt que d'improviser une nouvelle version à partir de ce
souvenir, l'historique git a été consulté pour retrouver l'état exact
validé juste avant l'adoption de Three.js (commit `2dff32e`, "l'objet 3D
devient la carte, navigation absorbée") et le restaurer précisément,
sans rien réinventer :

- **`NotreHistoire.tsx`** revient à sa version de ce commit : un prisme
  triangulaire en CSS pur (`transform-style: preserve-3d`, rotation de
  120°, inclinaison bornée au mouvement de la souris via Framer Motion),
  dont chaque face porte une des trois preuves fortes (20 ans de
  garantie, 4–12 semaines de livraison, 100 % fabriqué en France),
  cliquable pour avancer, rotation automatique toutes les 3,5 s. Zéro
  WebGL, zéro canvas, zéro import dynamique.
- **`globals.css`** : les classes `.hs-object-*` (matériau Liquid Glass,
  anneau de bord en gradient-border, reflet mouse-tracké, ombre de
  contact) sont réinsérées à l'identique de leur dernière version
  validée — extraites du même commit plutôt que réécrites de mémoire,
  pour garantir un rendu pixel-identique à ce qui avait déjà été
  approuvé. Seul ce bloc est restauré ; tout le reste du fichier (glass
  système, hero, vague, gammes…) qui a évolué depuis ce commit reste
  inchangé.
- **`src/components/notre-histoire/`** (le dossier entier —
  `ForestScene.tsx` et son historique de scènes Three.js) est supprimé.
- **Dépendances désinstallées** : `three`, `@types/three`,
  `@react-three/fiber`, `@react-three/drei` — confirmé au préalable
  qu'aucun autre fichier du projet ne les importait
  (`grep` sur tout `src/`). Le bundle de la page d'accueil redevient
  nettement plus léger : 1506 modules compilés contre 2638 avant le
  retrait, temps de compilation initial divisé par deux (~13 s contre
  ~25 s) sur cette machine.

**Pourquoi retrouver l'état exact d'un commit plutôt que reconstruire
"de mémoire"** : reconstruire à l'approximatif aurait risqué de
réintroduire des bugs déjà corrigés à l'époque (le mélange de texte en
miroir entre faces, corrigé par `backface-visibility: hidden`,
documenté dans le commentaire du code) ou de dériver légèrement du
rendu déjà validé par le client. `git show <commit>:<fichier>` donne le
texte exact tel qu'approuvé ; c'est ce qui a été repris, avec seulement
la documentation en tête de fichier réécrite pour expliquer ce retour en
arrière plutôt que l'historique de l'époque.

**Vérifications** : `tsc --noEmit` et `eslint` sur tout le projet
totalement propres (plus aucune erreur du tout, y compris l'ancienne
erreur `GlassPanel.tsx` documentée de longue date — elle n'était
apparemment déclenchée que par un site d'appel désormais supprimé avec
la forêt) ; objet 3D revérifié à l'écran au repos et après clic
(rotation confirmée entre "20 ans / de garantie" et "4–12 semaines / de
livraison") ; rendu mobile (390×844) et `prefers-reduced-motion`
revérifiés ; régression complète sur les 10 routes sans nouvelle erreur.

## Correction de palette : étiquettes des cartes gammes

Retour client : *"Les couleurs ne respectent pas la palette du brief :
utilise exactement `#F7F5F0` (fond clair), `#2F3E2E` (accent forêt),
`#AD8A55` (accent laiton) — plus aucun vert menthe ni orange. Les
étiquettes des cartes gammes doivent toutes être dans la même couleur
(laiton)."*

Vérification faite : `--brume` (`#f7f5f0`), `--foret` (`#2f3e2e`) et
`--laiton` (`#ad8a55`) dans `globals.css` correspondaient déjà exactement
aux trois valeurs du brief — rien à corriger sur les tokens eux-mêmes.
Le vrai problème, confirmé par `grep` sur tout `src/` (aucune classe
Tailwind verte/orange isolée trouvée ailleurs) : l'étiquette de chaque
carte gamme (`GammesPreview.tsx`) utilisait `text-${gamme.accent}`, un
champ différent par gamme dans `lib/gammes.ts` (`"foret"` pour Primaire,
`"encre-doux"` pour Premium, `"laiton"` seulement pour Prestige) — donc
trois couleurs différentes au lieu d'une seule, avec le vert de
`--foret` probablement perçu comme le "vert menthe" signalé.

Corrigé en codant `text-laiton` en dur sur l'étiquette (plus de classe
Tailwind dynamique construite depuis une variable — au passage, ce
motif est fragile avec le JIT de Tailwind, qui ne garantit de générer
que les classes trouvées littéralement dans le code source) et en
retirant le champ `accent`, devenu inutilisé, du type `Gamme` et des
trois entrées dans `lib/gammes.ts`. Vérifié programmatiquement plutôt
que seulement à l'œil : `getComputedStyle` sur les trois éléments
`.gamme-badge` renvoie `rgb(173, 138, 85)` (soit `#AD8A55`) de façon
identique sur les trois cartes.

**Vérifications** : `tsc --noEmit`/`eslint` sur tout le projet propres ;
couleur des trois étiquettes confirmée identique par script plutôt que
supposée ; régression complète sur les 10 routes sans nouvelle erreur.

## Gammes : rideau d'arbres au scroll (révélation des cartes)

Demande explicite, cadrée par le client avant tout code : retravailler
uniquement la section "Trois gammes pour trois exigences" avec une
révélation "premium et légère" — deux arbres minimalistes en rideau,
rapprochés au repos, qui s'écartent au scroll pour révéler les trois
cartes. Contrainte non négociable, répétée deux fois par le client :
*"ne redessine pas les cartes"*. Explicitement exclu aussi : nouvelle
scène Three.js, forêt complète, lac, montagnes, low poly 3D lourd,
particules, oiseaux, feuilles, lens flare.

**Plan validé avant implémentation** (le client l'a demandé
explicitement) : `useScroll({ target, offset })` de Framer Motion plutôt
qu'une section épinglée — la progression de scroll est dérivée du
passage naturel de la section dans le viewport, sans bloquer le scroll
de l'utilisateur ni wrapper artificiel `400vh`. Toutes les animations
passent uniquement par `transform`/`opacity`/`filter` (compositing GPU),
aucune propriété qui déclenche un reflow, aucun re-render React par
pixel scrollé (les `MotionValue` de Framer Motion contournent React,
même discipline que partout ailleurs sur le site). Aucune nouvelle
dépendance.

**Les cartes ne sont pas recréées.** Dans `GammesPreview.tsx`, le JSX de
chaque carte (`TiltCard` → `Link` → image → badge → highlights au survol
→ tagline/prix/CTA) reste identique à l'original. Seul le *wrapper*
`motion.div` autour de chaque carte change de source d'animation :
`initial`/`whileInView` (l'ancien mécanisme, indépendant par carte)
devient un `style={{ opacity, y, filter }}` dérivé d'une `MotionValue`
de progression partagée quand le rideau est actif — mais uniquement le
wrapper, jamais le contenu.

**Bug de minutage trouvé et corrigé avant de considérer le travail
fini** : le premier réglage définissait la progression 0 (arbres fermés)
au moment où le conteneur arbres+cartes entrait à peine sous le bord
inférieur du viewport — donc l'état "passage fermé" n'était en réalité
jamais visible par l'utilisateur, déjà en train de s'ouvrir dès que la
grille devenait lisible. Trouvé en comparant, via `getBoundingClientRect`
dans un script Playwright, la position réelle du conteneur cible de
`useScroll` (pas la section entière — une erreur de ciblage dans le
script de vérification lui-même a d'abord caché le bug) à la fenêtre de
progression déclarée. Corrigé en ajoutant un palier de repos explicite
(`HOLD = 0.16`) : rien ne bouge tant que la progression n'a pas dépassé
ce seuil, ce qui laisse le temps à la section d'entrer confortablement
dans le viewport avec les arbres pleinement fermés avant que quoi que ce
soit ne commence à s'animer — revérifié à l'écran à plusieurs fractions
de scroll après correction, l'état fermé est maintenant clairement
visible.

**Réglages verrouillés avec le client avant validation finale** :
recouvrement des cartes au repos modéré (arbres ancrés à `-70px` des
bords du conteneur, pas un écran fermé) ; sortie ample (jusqu'à `125%`
de leur propre largeur, quasi hors-cadre) avec une légère rotation
(±6°) et un flottement vertical asymétrique à quatre points de passage
(gauche et droite ne bougent jamais en miroir parfait, pour éviter
l'effet "élément d'interface") ; lueur centrale à alpha très faible
(0.12 au pic du dégradé, jamais un halo net) ; flou des cartes court
(résolu dans le premier tiers de la fenêtre de chaque carte) et léger
(6px maximum) ; stagger serré (0.03 de progression entre chaque carte).

**Repli mobile et `prefers-reduced-motion` : pas une version amoindrie
du rideau, l'ancienne animation `whileInView` d'origine.** Demande
explicite : *"préfère une version simplifiée plutôt que de forcer
exactement la même animation si cela nuit à la lisibilité ou aux
performances."* `canAnimateCurtain = isDesktop && !prefersReducedMotion`
(détection `matchMedia("(min-width: 768px)")`, résolue après montage,
`false` par défaut côté serveur pour rester cohérent avant hydratation) ;
si faux, ni arbres ni lueur ne sont rendus, et chaque carte retombe sur
son comportement d'origine (opacité + translation, déclenché par
`whileInView`, sans flou).

**Vérifications** : `tsc --noEmit`/`eslint` sur tout le projet propres ;
séquence complète revérifiée à l'écran sur plusieurs fractions de scroll
avant et après le correctif de minutage (état fermé bien visible, sortie
des arbres quasi complète, cartes qui se résolvent net) ; absence
d'arbres confirmée programmatiquement (recherche des dégradés SVG
propres aux arbres) en mobile et en `prefers-reduced-motion`, présence
confirmée en desktop normal ; régression complète sur les 10 routes sans
nouvelle erreur.

## Gammes : rideau d'arbres — refonte massive après rejet client

Le premier jet du rideau d'arbres (section précédente) a été rejeté en
bloc : *"Tu n'as pas compris le concept visuel. Je ne veux pas deux
formes fines posées sur les côtés dès le départ."* Les arbres fins
ancrés aux bords ("deux pointes fines", "deux cyprès décoratifs") ne
masquaient rien au repos et les cartes étaient déjà visibles dès le
début. Nouveau cahier des charges explicite, avec schémas ASCII à
l'appui : deux arbres massifs, presque collés au centre de la section au
repos, couvrant une grande partie de la hauteur (du bas de la grille
jusqu'au-dessus du titre) et masquant réellement le titre et les trois
cartes ; au scroll, ils s'écartent largement de part et d'autre comme un
rideau de théâtre. Contrainte inchangée : *"Ne touche pas aux cartes."*

**Nouvelle silhouette d'arbre.** Exigence explicite contre le rendu
précédent : *"tronc visible ; couronne végétale large ; plusieurs masses
organiques simples ; aucune forme de pointe unique ; aucun rendu cyprès
ou aiguille."* `BigTree` (dans `GammesPreview.tsx`) remplace le tracé
conique unique par un tronc (`path` trapézoïdal, brun) surmonté d'une
couronne composée de sept cercles de rayons variés qui se superposent
avec le même dégradé radial — une masse organique "en nuage" sans
couture visible, plutôt qu'une pointe.

**Nouveau positionnement : chevauchement au centre, pas ancrage aux
bords.** Chaque arbre occupe la moitié (`w-[58%]`) de la largeur du bloc
titre+cartes, ancré au bord *extérieur* du conteneur (`left-0`/`right-0`)
mais avec son contenu poussé vers le bord *intérieur*
(`justify-end`/`justify-start`) — les deux couronnes se chevauchent donc
largement au centre au repos ("presque collés"), au lieu d'être deux
éléments décoratifs posés sur les bords. Hauteur : `-top-16 bottom-0
flex items-end`, du bas de la grille jusqu'au-dessus du titre.

**Le `useScroll` cible maintenant titre + arbres + cartes ensemble**
(`sectionRef` remonté d'un niveau) pour que le titre soit lui aussi
masqué au repos et révélé progressivement avec les cartes, comme demandé
("*ils révèlent progressivement le titre et les trois cartes*").

**Deuxième bug de minutage, plus sévère, trouvé et corrigé.** En
réutilisant l'ancrage `offset: ["start 0.9", "start 0.15"]` du premier
jet pour ce nouveau conteneur bien plus haut (titre + arbres qui
remontent au-dessus + grille, environ 575px), le palier de repos
s'épuisait entièrement pendant que le conteneur était encore presque
entièrement sous le bas du viewport : la capture d'écran de l'état
"fermé" ne montrait que la section précédente, avec juste la pointe des
couronnes visible au ras du bas de l'écran. Diagnostiqué par le calcul
direct (avec un ancrage `"start"`, un conteneur de cette hauteur ne
devient substantiellement visible qu'à une progression bien après la fin
du palier prévu) puis confirmé à l'écran. **Corrigé en passant à un
ancrage sur le CENTRE du conteneur** :
`offset: ["center 0.85", "center 0.2"]` au lieu de `["start …", "start
…"]` — suivre le centre plutôt que le bord supérieur donne une bonne
part du conteneur déjà visible dès `progress = 0`, ce qui rend l'état
"fermé" réellement observable avant que l'ouverture ne commence. Palier
réajusté à `HOLD = 0.12` avec ce nouvel ancrage.

**Vérifié à l'écran, exactement les trois états demandés par le client**
(*"montre-moi d'abord : 1. l'état fermé ; 2. l'état à mi-ouverture ; 3.
l'état complètement ouvert"*), via un script Playwright ciblant le vrai
conteneur `useScroll` et calculant la position de scroll pour atteindre
une fraction de progression donnée (adapté à la formule du nouvel
ancrage centre) :
- **Fermé** (progression proche de 0, avant/pendant le palier) : les deux
  couronnes se touchent quasiment au centre, tronc visible en bas,
  aucune carte visible, titre pas encore lisible.
- **Mi-ouverture** (~0.25-0.5) : écart naissant entre les deux couronnes,
  titre qui se révèle en transparence à travers l'ouverture, cartes
  toujours masquées.
- **Ouvert** (~0.95) : arbres quasi sortis du cadre (juste les bords des
  couronnes visibles sur les côtés), titre et les trois cartes
  pleinement résolus (badges, prix, CTA lisibles).

**Repli mobile et `prefers-reduced-motion` re-vérifiés après la
restructuration** (le titre est désormais dans son propre
`motion.div` conditionnel) : présence des arbres testée
programmatiquement via l'identifiant des dégradés propres à `BigTree`
(`[id^="gammes-bigtree-grad-"]`) — `0` en mobile, `0` en
`prefers-reduced-motion`, `2` en desktop normal ; titre et cartes
pleinement visibles immédiatement dans les deux cas de repli, sans
`opacity` résiduelle.

**Vérifications** : `tsc --noEmit`/`eslint` sur tout le projet propres ;
les trois états demandés capturés et confirmés à l'écran ; repli mobile
et accessibilité reconfirmés ; régression complète sur les 10 routes
sans nouvelle erreur (les échecs de chargement d'images distantes
observés dans le bac à sable de vérification sont un blocage réseau de
l'environnement, pas un défaut du code).

## Gammes : rideau d'arbres — écran épinglé + refonte du feuillage

Retour client sur la version précédente (arbres massifs, ancrage sur le
centre du bloc) : l'idée générale validée, mais deux défauts précis à
corriger. *"Le scroll continue de défiler pendant que l'animation se
joue [...] je veux que la section soit épinglée temporairement dans le
viewport pendant toute l'animation [...] pas un scroll bloqué pendant
une distance énorme."* Et sur les arbres eux-mêmes : *"les arbres
ressemblent encore à un assemblage de grandes sphères [...] un vrai
tronc visible ; des branches suggérées ; plusieurs masses de feuillage
de tailles différentes [...] une silhouette différente pour l'arbre
gauche et l'arbre droit."*

**Écran épinglé (`position: sticky`), volontairement court.** Le
`useScroll` non-pinné (ancré sur le centre du bloc) ne pouvait pas
garantir un état final "posé" : la page continuait de défiler pendant
la révélation, coupant la scène avant que l'utilisateur en profite.
Nouvelle mécanique, standard pour ce type de séquence : un conteneur
`pinRef` de hauteur fixe (`PIN_VH = 220vh`) enveloppe un enfant `sticky
top-0 h-screen` qui reste figé à l'écran tant que `pinRef` traverse le
viewport ; `useScroll({ target: pinRef, offset: ["start start", "end
end"] })` traduit cette traversée en une progression 0→1 qui pilote
tout — arbres, lueur, titre, cartes. Distance de scroll supplémentaire
réellement parcourue : `220vh − 100vh = 120vh`, un peu plus d'un écran
— court et précis comme demandé, pas un pinning à la "scroll-jacking"
sur plusieurs écrans. Répartition verrouillée avec le client : 0–45 %
ouverture des arbres, 30–75 % apparition du titre puis des cartes,
75–100 % état final maintenu (obtenu naturellement, sans code
supplémentaire : au-delà du dernier point de chaque courbe
`useTransform`, la valeur reste figée).

**Piège de montage évité : le nœud ciblé par `useScroll` doit TOUJOURS
être monté.** Une première tentative rendait le conteneur `pinRef`
entièrement de façon conditionnelle (`canAnimateCurtain ? <div
ref={pinRef}>… : …`) — comme `isDesktop` démarre à `false` (résolu
après hydratation), ce nœud n'existait pas encore au tout premier
rendu, et `useScroll` s'accrochait dans le vide ("Target ref is defined
but not hydrated" en console) : la progression ne reflétait plus rien
de réel. Corrigé en gardant le conteneur et son enfant `sticky`
TOUJOURS montés, seuls leur style (`height`, classes `sticky`) et leur
contenu (arbres, lueur) changeant selon `canAnimateCurtain` — même
discipline que partout ailleurs sur cette section.

**Bug de fond, sévère, découvert en vérifiant à l'écran plutôt qu'en se
fiant au code : `opacity` en `style` direct ne suit pas la
`MotionValue` de façon fiable une fois l'élément dans un écran épinglé.**
Constaté par une lecture directe de l'attribut `style` du DOM (pas
seulement une capture d'écran) sur des dizaines d'essais : la valeur
réellement écrite se figeait de façon non déterministe — tantôt
correcte, tantôt bloquée sur une valeur périmée (parfois carrément
figée à `1` en permanence, rendant une carte invisible pour toujours
même arrivé en fin d'ouverture, un vrai régression bloquante repérée
avant livraison). `transform` et `filter`, sur ces mêmes éléments, se
sont montrés fiables à chaque frame testée. Diagnostic affiné : les
éléments qui avaient déjà eu un `initial={{opacity: ...}}` explicite
dans une passe de rendu antérieure (le repli mobile/reduced-motion des
cartes, via `initial={{opacity:0,y:32}}`) gardaient cette valeur comme
résidu CSS même après être repassés en mode `style` pur où `opacity` ne
fait plus partie de l'objet — Framer Motion ne la libère jamais.
**Correctif à deux volets** : (1) tout fondu passe désormais par
`filter: opacity(N%)` (combiné avec le flou existant pour les cartes
via `useMotionTemplate`) au lieu de la propriété CSS `opacity` — même
rendu visuel, mécanisme qui s'est révélé fiable sur toutes les
vérifications répétées ; (2) `initial={false}` explicite sur la branche
rideau de chaque `motion.div` concerné, et le repli mobile/reduced
motion lui-même reconverti pour utiliser `filter: opacity(N%)` plutôt
que `opacity` dans son `initial`/`whileInView`, afin qu'aucune des deux
branches ne pose jamais cette propriété.

**Nouvelle silhouette d'arbre, générée plutôt que dessinée à la main.**
Exigence client explicite : *"éviter les ronds parfaits ; les feuillages
symétriques ; les arbres identiques en miroir ; l'effet clipart."` Une
fonction `blobPath(cx, cy, r, seed)` construit un contour fermé
irrégulier (points disposés en cercle avec un rayon bruité par un hash
déterministe `seededRandom(seed)` — pas de `Math.random`, pour rester
identique serveur/client — puis reliés par des courbes de Bézier
dérivées d'un Catmull-Rom fermé) : chaque amas de feuillage a un
contour organique unique, jamais un cercle parfait. `LEFT_BLOBS` et
`RIGHT_BLOBS` sont deux listes de tailles/positions/seeds
volontairement différentes (pas une géométrie unique retournée en
miroir) pour que les deux arbres aient une silhouette réellement
distincte. Tronc légèrement galbé (chemin à courbes, pas un trapèze
droit) avec un dégradé bark à trois tons. Trois branches par arbre,
tracées en `stroke` fin AVANT les amas de feuillage dans le SVG afin de
ne se deviner que dans les interstices, jamais comme un trait qui
traverse le feuillage.

**Distance de sortie des arbres augmentée après vérification à l'écran
de l'état final.** Premier réglage (`58%` de la largeur propre de
l'arbre) laissait les couronnes recouvrir une bonne partie des cartes 1
et 3 même en toute fin d'ouverture — contraire à l'exigence *"rien
n'est coupé."* Porté à `135%`, revérifié : les trois cartes se lisent
intégralement (badges, prix, CTA), les arbres ne subsistent qu'en
liseré discret sur les bords, exactement la *"clairière qui vient de
s'ouvrir"* demandée.

**Vérifications** : `tsc --noEmit`/`eslint` sur tout le projet propres ;
les trois états demandés (fermé / mi-ouverture / final) capturés et
confirmés à l'écran sur un build de production (`next build && next
start`, pas seulement `next dev`, pour éliminer tout artefact propre au
Strict Mode de développement) ; stabilité du correctif `filter`
reconfirmée sur une demi-douzaine de relances consécutives, aux deux
extrémités de la progression (fermé et grand ouvert) ; repli mobile et
`prefers-reduced-motion` revérifiés après la restructuration (aucun
arbre, hauteur du conteneur redevenue naturelle — plus de `220vh`
fantôme — titre et cartes pleinement visibles) ; régression complète
sur les 10 routes sans nouvelle erreur.

## Gammes : arbres en vraie photo plutôt qu'en SVG généré

Retour client immédiat sur la silhouette SVG procédurale (`blobPath` +
amas de cercles bruités) : *"les arbres font cheap."* Demande explicite
de passer par une vraie image (Higgsfield) plutôt que de continuer à
raffiner un dessin vectoriel.

**Génération.** `recraft_v4_1` en `model_type: "standard"` (le variant
photoréaliste du catalogue, par opposition à `vector`/`utility` conçus
pour du plat) avec un prompt ciblant explicitement un rendu chaleureux :
tronc et branches texturés, feuillage en pleine lumière dorée d'un côté
et plus frais de l'autre, cadrage plein pied façon asset d'entourage
architectural, sur fond neutre pour un détourage propre. Arrière-plan
retiré ensuite via l'outil dédié de suppression de fond (transparence
réelle, pas une couleur de fond approximative).

**Un seul rendu pour les deux arbres.** Plutôt que de générer une
seconde image (coût, et risque de deux styles qui ne s'accordent pas),
le même fichier sert aux deux côtés : l'arbre droit est simplement
retourné horizontalement (classe Tailwind `-scale-x-100` sur le
`<Image>` lui-même, indépendante du `x`/`rotate` du rideau porté par le
`motion.div` parent — les deux transforms vivent sur des nœuds
différents, aucun conflit). Composition symétrique cohérente, un seul
asset à charger.

**Intégration technique.** `BigTree` perd toute sa génération
procédurale (`blobPath`, `seededRandom`, listes de amas/branches/tracés
de tronc) au profit d'un simple `next/image` en `fill` +
`object-contain object-bottom` dans un conteneur de taille fixe
(`380px` de large, hauteur héritée du bloc `-top-16 bottom-0` déjà en
place) — ancrage bas identique à la version SVG, pour que le "tronc"
parte bien du bas de la mise en scène. Le domaine CloudFront
(`d8j0ntlcm91z4.cloudfront.net`) était déjà autorisé dans
`next.config.ts` par les visuels de gammes existants, aucune
configuration supplémentaire nécessaire.

**Vérification.** Le rendu final de l'image (cadrage, lumière, absence
d'artefacts) a été inspecté directement au moment de la génération.
Ensuite, structurellement dans l'application : `tsc`/`eslint` propres ;
lecture du DOM confirmant les deux `<img>` correctement dimensionnées
(`380×512`), positionnées de part et d'autre du centre, et seule celle
de droite portant `-scale-x-100` ; absence de toute image d'arbre en
mobile (repli `whileInView` inchangé) ; régression complète sur les 10
routes sans nouvelle erreur. Note technique : dans cet environnement de
vérification, le proxy sortant bloque le domaine CloudFront (403), donc
les captures d'écran locales ne peuvent pas afficher les pixels réels
de l'image (même contrainte, déjà rencontrée et documentée, que pour
les visuels de gammes existants qui utilisent le même domaine) — sans
impact sur le rendu réel du site en production.

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

## Gammes : décor photographique plein cadre (les arbres seuls ne suffisaient pas)

Retour client immédiat sur la première intégration photo, avec une
image de référence à l'appui : les deux arbres découpés posés sur
l'aplat `bg-ciel` lisaient comme des autocollants — *"cheap à
souhait"* — sans aucune cohérence de lumière ni de profondeur avec le
reste de la page. La référence montrait un environnement photographique
complet et immersif (clairière floutée, lumière chaude, profondeur de
champ), pas juste deux images posées sur un fond plat.

**Décor plein cadre.** Une seconde image Higgsfield générée
spécifiquement comme fond de scène — clairière floutée, lumière dorée,
profondeur de champ (flou en arrière-plan, plus net au premier plan) —
sert désormais de fond photographique à toute la section, en plus des
arbres nets et détourés du rideau qui restent au premier plan et
continuent de s'écarter au scroll. Un voile dégradé très discret
(`brume/55` en haut et en bas, transparent au centre) garde le titre et
les badges lisibles sans aplatir la photo.

**Piège d'écran épinglé, repéré et corrigé avant livraison.** Poser ce
décor au niveau de la `<section>` (donc en dehors du bloc `sticky`)
aurait fait défiler l'image derrière les arbres et les cartes — qui,
eux, restent figés à l'écran pendant toute la durée du pin — créant un
décalage visible entre premier plan fixe et arrière-plan qui glisse.
Le décor vit donc à l'intérieur du bloc `sticky` en mode rideau
(parfaitement figé avec le reste), et au niveau de la section
uniquement dans le repli mobile/reduced-motion, où il n'y a pas de pin
donc pas de risque de décalage.

**Plein cadre bord à bord, pas juste dans la colonne centrée.** Un
simple `inset-0` restait cantonné à l'intérieur du padding horizontal
des conteneurs ancêtres (section et bloc `sticky` ont chacun leur propre
`px-6`) — vérifié à l'écran, une bande de fond uni visible de chaque
côté. Corrigé avec la technique de "sortie de conteneur" classique
(`left-1/2 w-screen -translate-x-1/2`), qui ignore le padding des
parents et couvre la largeur réelle du viewport ; revérifié : largeur
mesurée à l'écran passée de 1392px (contenu moins padding) à 1440px
(viewport plein) sans provoquer de scroll horizontal.

**Ombre portée sur les arbres** (`drop-shadow` Tailwind, statique,
directement sur l'`<Image>`) pour un minimum d'ancrage au sol plutôt
que des découpes flottant sans contact visuel avec la scène.

**Vérifications** : `tsc`/`eslint` propres ; le pin reste identique à
100% après l'ajout du décor (`sticky` toujours à `top: 0`, hauteur
inchangée, revérifié à mi-scroll) ; largeur plein cadre confirmée à
1440px sur desktop et pleine largeur sur mobile, sans scroll horizontal
introduit ; présence du décor confirmée en mode rideau ET en repli
mobile/reduced-motion ; régression complète sur les 10 routes sans
nouvelle erreur.

## Gammes : vidéo Seedance pilotée au scroll (abandon du décor photo)

Nouveau retour immédiat sur le décor photographique : *"rend pas bien."*
Le client fournit à la place une vidéo Seedance (Higgsfield) qu'il a
générée lui-même — une caméra macro prisonnière d'un feuillage de chêne
dense qui avance et écarte physiquement les branches (aucun fondu,
aucun morphing, uniquement le contact caméra/feuillage) jusqu'à révéler
un fond ivoire uni. Demande : le scroll pilote l'avancée de cette
caméra, puis un fondu classique laisse place au titre et aux cartes.
Abandon complet du rideau d'arbres et du décor photo — remplacés par
cette seule vidéo.

**Retrouver la vidéo depuis un lien de partage.** Le lien fourni
(`higgsfield.ai/s/...`) est une page HTML, pas un fichier média
direct — l'import direct échoue (`Unsupported content-type: text/html`).
Récupérée via l'historique des générations (`show_generations`,
filtré `type: video`) : le prompt de la génération la plus récente
correspond mot pour mot à la description du client, confirmant qu'il
s'agit bien du bon fichier.

**Mécanique de scroll : `currentTime` piloté directement, pas le
système de la vidéo Hero.** La vidéo Hero (bien plus longue) utilise un
cache de frames en canvas + `playbackRate` pour un scroll arrière fluide
— une mécanique lourde, construite et affinée sur plusieurs passes de ce
projet. Pour 3 secondes de contenu utile ici, inutile de la reprendre :
une simple boucle `requestAnimationFrame` qui lit la `MotionValue` de
progression et écrit `video.currentTime` une fois par frame peinte
(avec une zone morte de 20ms pour éviter les écritures redondantes)
suffit et reste bien plus simple à maintenir.

**"Commence la vidéo à 1 sec pas du début."** La vidéo dure 4s au total ;
`VIDEO_START_TIME = 1` et le scroll ne mappe que les 3 secondes utiles
(`[0, 0.35]` de progression → `[1, 4]` de `currentTime`), la première
seconde (plan de départ jugé inintéressant) n'est jamais jouée.

**Répartition du scroll** : 0–35 % la caméra avance dans le feuillage ;
32–48 % fondu de la vidéo (léger chevauchement avec la fin du scrub
pour un fondu connecté au dernier freeze-frame, pas une coupure nette) ;
30–72 % apparition du titre puis des cartes, décalée pour commencer
juste avant la fin du fondu vidéo ; au-delà, état final maintenu
(inchangé — obtenu naturellement par le plafonnement des courbes
`useTransform`).

**Fondu vidéo/titre/cartes via `filter: opacity(N%)`**, pas la
propriété CSS `opacity` — même mécanisme et même bug déjà rencontré et
corrigé pour le rideau précédent (`opacity` en `style` direct se fige
de façon non déterministe dans un écran épinglé), avec `initial={false}`
sur chaque `motion.div` concerné pour éviter le résidu figé.

**Vidéo plein cadre bord à bord**, à l'intérieur du bloc `sticky`
(même piège de désynchronisation déjà rencontré avec le décor photo,
et même correctif — le contenu épinglé doit vivre DANS le bloc figé,
pas au niveau de la section).

**Repli mobile / `prefers-reduced-motion` : aucune vidéo.** Pas de lien
évident entre lire une vidéo et l'accessibilité réduite, mais l'écran
épinglé lui-même reste désactivé sur ces profils (déjà le cas), donc la
vidéo — qui n'a de sens que synchronisée au scroll épinglé — ne l'est
pas non plus ; retour au fondu `whileInView` simple déjà éprouvé.

**Vérifications** : `tsc`/`eslint` propres ; présence de la vidéo (bon
`src`, `muted`) confirmée en desktop, absence confirmée sur mobile ;
écran épinglé toujours figé à `top: 0` pendant tout le scroll après
l'ajout de la vidéo ; fondu vidéo→contenu confirmé stable sur plusieurs
relances consécutives (`filter: opacity(0%)` sur la vidéo, `opacity(100%)`
sur titre et cartes en fin de progression) ; régression complète sur
les 10 routes sans nouvelle erreur. Limite de vérification : le domaine
CloudFront hébergeant la vidéo est bloqué par le proxy sortant de cet
environnement de test (même contrainte déjà documentée pour les images)
— le contenu réel de la vidéo (mouvement de caméra, qualité du fondu
visuel) n'a donc pas pu être vérifié par capture d'écran ici et doit
être confirmé côté client.

## Gammes : retour complet à la version simple ("juste les offres")

Après deux tentatives de mise en scène immersive (rideau d'arbres puis
vidéo Seedance pilotée au scroll), retour client final : *"ça rend pas
bien, reviens comme au début, juste les offres."* Décision de revenir
purement et simplement à la version d'avant toute cette exploration —
pas un nouvel ajustement, un retour complet.

`GammesPreview.tsx` restauré à l'identique de l'état juste avant le
premier rideau d'arbres (commit `2355320`, qui incluait déjà la
correction de palette — badges uniformément en laiton) : titre, grille
de 3 cartes, entrée `whileInView` simple (fondu + léger décalage
vertical, stagger de 0.12s par carte), sans écran épinglé, sans vidéo,
sans arbres, sans décor. Toute la mécanique construite dans les
itérations précédentes (`useScroll` épinglé, `filter: opacity()`,
vidéo scrubbée, décor photo plein cadre) est retirée du fichier.

**Vérifications** : `tsc`/`eslint` propres ; confirmé dans le DOM
qu'aucune vidéo ni aucun conteneur `sticky` ne subsiste, exactement 3
cartes, badges tous en laiton (`rgb(173, 138, 85)`) ; capture d'écran
conforme à la version simple attendue ; taille du bundle de la page
d'accueil retombée à 12,7 kB (contre 16,4 kB avec la vidéo) confirmant
que toute la mécanique complexe a bien été retirée, pas seulement
désactivée ; régression complète sur les 10 routes sans nouvelle erreur.

## Notre histoire : refonte icônes + vidéo matériaux "reverse-snap"

Direction précise du client, deux images de référence à l'appui.
L'ancien objet 3D en rotation (CSS, faces animées avec des chiffres) est
retiré : à gauche, le texte est désormais accompagné d'une ligne de 4
preuves avec icône (100% fabriqué en France, Douglas certifié, conforme
RE2020, garantie 20 ans) — quatre icônes trait minimalistes dessinées à
la main (pin, arbre, maison, bouclier), dans le style déjà établi par
`ThreePiliers.tsx` (`viewBox` 24×24, `stroke="currentColor"`, épaisseur
1.5, extrémités arrondies). Explicitement demandé : sans les petits
boutons "+" visibles sur l'image de référence.

À droite, la vidéo Higgsfield fournie par le client (les six matériaux
de construction — ossature Douglas, OSB, isolation, pare-vapeur,
liteaux, bardage Cryptomeria — qui glissent les uns vers les autres
jusqu'à former un seul bloc assemblé) est jouée **à l'envers** : elle
démarre assemblée (dernier frame) et se "déplie" jusqu'au premier frame
quand la section entre dans le viewport. Aucun navigateur ne supportant
la lecture arrière fluide via `playbackRate` négatif, la technique déjà
utilisée pour le hero est reprise : une boucle `requestAnimationFrame`
qui décrémente `video.currentTime`, déclenchée une seule fois par un
`IntersectionObserver` (pas de scroll-scrub continu). Demande explicite
du client : *"au slide vers le bas les matériaux s'écartent d'un coup,
petit snap apple genre"* — la boucle est donc compressée sur 650ms avec
un easing ease-out cubique, plutôt qu'un scrub étalé sur la durée réelle
de la vidéo (4s). Une fois le dépliage terminé, les six légendes
apparaissent en cascade sous chaque matériau (numéro, titre, courte
description), reprenant le style filmstrip de la seconde image de
référence.

Le bloc CSS `.hs-object-*` (styling de l'ancien objet 3D — scène,
tilt, faces, rim, shine, ombre) est supprimé entièrement de
`globals.css`, confirmé sans référence restante ailleurs dans le code
avant suppression.

**Bug trouvé et corrigé en vérifiant le rendu** : les icônes SVG
n'avaient aucune taille explicite (`viewBox` seul, sans `className`/
`width`/`height`) et s'effondraient à 0×0 — invisibles bien que
présentes dans le DOM (un premier contrôle Playwright comptant les
`<svg>` par sélecteur donnait le bon compte sans détecter le problème de
taille). Corrigé en ajoutant `className="h-6 w-6"` à l'élément `<svg>`
partagé par les quatre icônes. Un fond `bg-encre/5` a aussi été ajouté
au conteneur vidéo pour éviter un vide visuel si la vidéo met du temps à
charger.

**Vérifications** : `tsc`/`eslint` propres ; capture d'écran de la
section confirmant les 4 icônes visibles (taille et couleur laiton
correctes) et les 6 légendes de matériaux en place ; logique de
`currentTime` et de la cascade d'opacité vérifiée programmatiquement
(progression d'opacité entre 1200ms et 2000ms après déclenchement) ;
fallback `prefers-reduced-motion` vérifié (saute directement à l'état
"déplié", légendes visibles sans délai) ; régression complète sur les
10 routes sans nouvelle erreur. Comme pour les vidéos précédentes, le
CDN Higgsfield (`d8j0ntlcm91z4.cloudfront.net` /
`d2ol7oe51mr4n9.cloudfront.net`) est bloqué par le proxy sortant de cet
environnement : le contenu pixel réel de la vidéo/poster n'a donc pas pu
être vérifié visuellement ici (structure DOM, styles calculés et
logique JS oui ; rendu visuel à confirmer côté client).

## Notre histoire : retours client — animation, fond, cascade, taille

Quatre retours précis après la première passe de la refonte ci-dessus :
*"il n'y a aucune animation sur la vidéo genre petit freeze et hop tout
dégroupé, faut un truc smooth apple"*, *"les textes qui décrivent les
éléments arrivent un par un aussi"*, *"le fond de la vidéo il faudrait le
supprimer comme ça on a vraiment l'impression qu'ils flottent sur le fond
du site"*, et *"tu agrandis énormément les matériaux, aujourd'hui ils
occupent environ 35% de la largeur, je les ferais occuper 60 à 70%."*

**Le "freeze puis snap" (bug réel, pas un ressenti)** : la première
version écrivait `video.currentTime` à chaque frame `requestAnimationFrame`
(~60 fois/seconde) sans jamais attendre que le navigateur ait fini de
traiter la précédente valeur. Un `<video>` seeké ne rend pas chaque valeur
demandée si une nouvelle arrive avant que la précédente soit résolue — la
plupart des écritures étaient donc silencieusement ignorées, et seule la
toute dernière s'appliquait, d'où l'impression d'un gel suivi d'un saut
brutal. Corrigé en chaînant les seeks sur l'événement `seeked` : chaque
nouvelle valeur de `currentTime` n'est demandée qu'une fois la précédente
réellement rendue par le décodeur, ce qui cale automatiquement le rythme
sur ce que le navigateur peut vraiment fournir — fluide par construction,
quel que soit son débit de seek réel. Un filet de sécurité (`setTimeout`)
garantit que les légendes finissent par apparaître même si l'événement
`seeked` ne se déclenche jamais.

**Fond de la vidéo retiré** : la vidéo source (MP4/H.264) n'a pas de canal
alpha, donc aucun moyen natif de rendre son fond transparent. La solution
retenue : le `<video>` devient une source de frames invisible
(`opacity-0`), et un `<canvas>` superposé affiche chaque frame après
détourage — la couleur de fond est échantillonnée dans le coin de l'image
(supposée uniforme, cohérent avec un rendu studio Higgsfield) puis rendue
transparente pixel par pixel, avec une zone de fondu pour lisser les
bords. Dégradation silencieuse et volontaire si le CDN ne renvoie pas
d'en-têtes CORS permettant la lecture des pixels (`getImageData` lève
alors une erreur, interceptée) : la vidéo reste visible avec son fond
d'origine plutôt que de casser l'affichage.

**Légendes en cascade** : le délai entre chaque légende est passé de
0.06s à 0.13s (avec une easing "Apple" `cubic-bezier(0.22, 1, 0.36, 1)`)
pour que l'arrivée "une par une" soit clairement perceptible plutôt que
quasi simultanée.

**Matériaux agrandis** : la répartition des colonnes passe de
`lg:grid-cols-[1fr_1.2fr]` (texte ~45%, matériaux ~55%) à
`lg:grid-cols-[1fr_2fr]` (texte ~33%, matériaux ~67%), et le conteneur de
`max-w-6xl` à `max-w-7xl` pour donner plus de place absolue aux deux
colonnes.

**Vérifications** : `tsc`/`eslint` propres ; ratio de largeur de colonne
mesuré à l'exécution (0.67, dans la fourchette 60–70% demandée) ; absence
d'erreur JS/console (le chemin `getImageData`/`SecurityError` ne plante
jamais, catché) ; progression de l'opacité des 6 légendes suivie dans le
temps confirmant une apparition strictement séquentielle et non
simultanée ; rendu mobile vérifié (colonnes empilées) ; régression
complète sur les 10 routes sans nouvelle erreur. Limite persistante de cet
environnement : le CDN vidéo (`d8j0ntlcm91z4.cloudfront.net`) est bloqué
par le proxy sortant du sandbox, donc ni la fluidité réelle du seek ni le
résultat visuel du détourage n'ont pu être vérifiés à l'œil ici — la
logique (chaînage d'événements, calcul de couleur, alpha, timing de
cascade) est vérifiée programmatiquement, le rendu pixel final reste à
confirmer côté client.

## Notre histoire : abandon du snap, scrub continu + vidéo same-origin

Deuxième retour client sur cette même section : *"oublie le snap apple,
juste je veux que au slide il y ait l'animation fluide des matériaux qui
se séparent"*, et confirmation que le fond de la vidéo n'était toujours
pas retiré (*"ça fait tache, les éléments volent pas"*) — exactement le
risque déjà identifié dans l'entrée précédente (canvas potentiellement
"tainted" par l'absence d'en-têtes CORS sur le CDN).

**Fond vidéo, cause confirmée et corrigée** : le CDN Higgsfield
(CloudFront) ne renvoie pas d'en-têtes CORS lisibles par le navigateur, ce
qui rend le `<canvas>` "taintée" dès qu'on y dessine une frame vidéo
cross-origin — `getImageData` lève alors une `SecurityError`, interceptée
silencieusement par le `catch` déjà en place, désactivant le détourage
sans le signaler. Corrigé en ajoutant une route API interne,
`src/app/api/materials-video/route.ts`, qui relaie la vidéo côté serveur
(avec support des en-têtes `Range` pour un seek efficace) : le navigateur
la voit alors comme same-origin, et la lecture des pixels pour le
détourage fonctionne. **Cette route ne peut pas être vérifiée de bout en
bout dans ce sandbox** : le CDN CloudFront est bloqué par le proxy sortant
de cet environnement, y compris pour un `fetch()` côté serveur — la route
répond donc `502` ici, ce qui est le comportement correct de repli (testé
et confirmé), pas un bug. En production, le serveur Next.js n'a pas cette
restriction réseau et la requête aboutira normalement.

**Abandon du "snap"** : plus de durée fixe (650ms) ni de déclenchement
ponctuel via `IntersectionObserver`. L'animation est maintenant liée en
continu à la position de scroll de la section, sur le même principe que
la vague de `Hero.tsx` (scrubbable dans les deux sens, jamais un simple
trigger one-shot). La correction précédente (ne jamais redemander un seek
tant que le précédent n'est pas terminé, via `!video.seeking`) est
conservée et généralisée : elle s'applique maintenant à chaque frame de
scroll plutôt qu'à une séquence à durée fixe.

**Vérifications** : `tsc`/`eslint` propres ; build de production réussi
avec la nouvelle route (`ƒ /api/materials-video`, rendu à la demande) ;
la route retourne bien une erreur `502` propre (pas un crash serveur) au
lieu de laisser fuiter une exception non gérée quand le fetch amont
échoue ; progression des légendes suivie en scrollant à travers la
section point par point : révélation progressive (pas de saut), et
réversible en scrollant vers le haut (les légendes redisparaissent),
confirmant le caractère continu et bidirectionnel de l'animation ;
régression complète sur les 10 routes sans nouvelle erreur. Le rendu
visuel réel (fluidité du seek et résultat du détourage) reste à confirmer
côté client, cette fois avec de meilleures chances de fonctionner
puisque la cause racine du fond non retiré est directement adressée.

## Notre histoire : détourage confirmé, animation déclenchée (fin du scrub continu)

Retour client positif sur le détourage ("bravo boss ta réussis"), avec
deux ajustements : un petit fragment du fond restait visible en haut à
gauche, et l'animation liée en continu au scroll n'était toujours "pas
fluide du tout" — *"je ne veux pas que le slide gère la vitesse de
l'animation, [...] je descends dans la catégorie, l'animation se lance
toute seule, je remonte elle se lance de l'autre sens."*

**Fragment de fond non détouré, corrigé** : la couleur de référence pour
le détourage n'était échantillonnée que sur un seul pixel (coin
haut-gauche). Le fond du rendu a en réalité un léger dégradé/vignette
(visible sur la capture du client, coin haut-droit), donc un point unique
ne couvrait pas toute sa variation. Remplacé par la moyenne des 4 coins de
l'image, avec un seuil et un fondu de détourage légèrement plus généreux
(26→34 et 20→30) pour couvrir cette variation sans manger les couleurs
(plus saturées et plus sombres) des matériaux eux-mêmes.

**Fin du scrub continu, retour à une animation déclenchée** : lier
`currentTime` en continu à la position de scroll faisait dépendre la
vitesse perçue de l'animation de la vitesse à laquelle le client
scrollait — un scroll rapide "saute" des frames, ce qui ne peut jamais
paraître fluide, quelle que soit la qualité du seek. Remplacé par une
ligne de déclenchement unique (`THRESHOLD_VH`, 60% de la hauteur d'écran) :
la franchir en descendant lance le dépliage, la refranchir en remontant
lance le repliement — chacun à sa propre durée fixe (1150ms / 950ms),
totalement indépendante de la vitesse de scroll. Différence de technique
entre les deux sens, choisie pour la fluidité : le dépliage doit faire
reculer la vidéo (aucun navigateur ne sait le faire nativement), donc
scrub manuel chaîné sur `seeked` comme dans les rounds précédents ; le
repliement, lui, avance dans le sens naturel d'enregistrement de la
vidéo, donc lecture native (`video.play()`, `playbackRate` accéléré) —
intrinsèquement fluide puisque gérée par le décodeur, même principe que
le sens "avant" du scroll dans `Hero.tsx`.

**Vérifications** : `tsc`/`eslint` propres ; build de production réussi ;
scénario Playwright simulant un scroll normal (pas de saut instantané) à
travers la ligne de déclenchement dans les deux sens : les légendes
passent bien de masquées à visibles en descendant, puis de visibles à
masquées en remontant — confirmant le déclenchement directionnel plutôt
qu'un lien continu à la position ; régression complète sur les 10 routes
sans nouvelle erreur. La fluidité perçue réelle du dépliage/repliement
(qualité du seek et de la lecture accélérée) reste à confirmer côté
client, cette fois sur un mécanisme dont la vitesse ne dépend plus du
geste de scroll.

## Notre histoire : ajustements mobile (plein cadre + perf)

Retour client très positif sur le round précédent ("parfait c'est nickel",
détourage et mécanique d'animation validés), deux réglages mobile
restants : les matériaux paraissaient trop petits (resserrés dans la
marge de texte au lieu de prendre toute la largeur), et l'animation
restait saccadée sur téléphone.

**Plein cadre sur mobile** : le bloc vidéo/canvas des matériaux annule
maintenant le `px-6` de la section via une marge négative (`-mx-6`,
réinitialisée à `lg:mx-0`), pour s'étendre jusqu'aux bords de l'écran sur
mobile et tablette — redevient contenu normalement dans sa colonne à
partir de `lg`, à côté du texte. Les légendes (numéros, titres,
descriptions) restent dans le flux normal avec la marge habituelle,
seule l'image bleed.

**Saccade sur mobile, cause identifiée et corrigée** : le détourage
tournait sur la résolution *native* de la vidéo à chaque frame —
`getImageData`/`putImageData` plus une boucle par pixel avec un
`Math.sqrt`, potentiellement plusieurs centaines de milliers de pixels
recalculés à chaque frame de l'animation, alors que l'image affichée à
l'écran est bien plus petite que la source. Sur desktop l'écart passe
inaperçu, sur un CPU mobile ce travail JS bloquant devient le vrai goulot
d'étranglement (plus significatif que la latence de seek elle-même) et
grignote le budget de temps de l'animation, d'où le rendu saccadé. Deux
correctifs : (1) le canvas est maintenant dimensionné à sa taille
d'affichage réelle × ratio d'écran (plafonné à 2), pas à la résolution
native de la vidéo — le rapport largeur/hauteur d'origine est conservé,
seule la résolution baisse ; (2) la comparaison de couleur au fond évite
`Math.sqrt` pour l'immense majorité des pixels (comparaison de distances
au carré), la racine n'étant calculée que pour la fine bande de pixels
réellement dans la zone de fondu du détourage.

**Vérifications** : `tsc`/`eslint` propres ; build de production réussi ;
géométrie du bloc vidéo mesurée à l'exécution sur un viewport 390px
(iPhone) : `left: 0, right: 390` — plein cadre confirmé, bord à bord ;
nouveau scénario de scroll graduel (imitant un scroll normal, pas un saut
instantané) confirmant que le déclenchement directionnel fonctionne
toujours après ces changements ; régression complète sur les 10 routes
sans nouvelle erreur. La fluidité réelle sur un téléphone physique reste
à confirmer côté client — la cause structurelle du ralentissement
(volume de pixels traités par frame) est corrigée, mais je ne peux pas
mesurer un vrai gain de FPS sur un appareil mobile réel depuis ce
sandbox.

## Notre histoire : cache de frames (dépliage fluide) + ajustements mobile

Retour très positif ("bravo boss ta réussis"), avec un diagnostic client
particulièrement juste sur le point restant : *"l'animation quand les
matériaux se regroupent c'est parfait bien fluide, mais quand ils se
séparent c'est saccadé, sûrement parce que tu as dû inverser la vidéo que
je t'ai envoyé, donc ça doit faire bug."* Exactement ça — confirmé et
corrigé ci-dessous. Plus trois ajustements mobile : encore agrandir le
bloc matériaux, réduire l'écart avec le texte au-dessus, centrer les 4
icônes de preuve.

**Dépliage saccadé, cause confirmée et corrigée** : le repliement
(`video.play()` natif, sens d'enregistrement de la vidéo) est fluide par
construction — le décodeur gère la lecture avant en temps réel, comme
n'importe quelle vidéo web. Le dépliage, lui, doit reculer dans le temps
(assemblé → écarté), ce qu'aucun navigateur ne fait nativement : chaque
`currentTime` décroissant redemande un nouveau décodage depuis la
dernière image-clé, plus lent et plus irrégulier qu'une lecture
native — exactement le "bug" que le client a lui-même diagnostiqué en
disant qu'on avait dû "inverser la vidéo". Solution reprise de
`Hero.tsx`, qui a déjà résolu ce problème pour son propre scroll arrière :
un cache de frames déjà décodées (`createImageBitmap`), rempli
opportunément à chaque lecture avant de la vidéo — le vrai repliement,
mais aussi une **pré-chauffe invisible** au chargement de la page (lecture
accélérée ×4 en tâche de fond, avant toute interaction, le canvas
continuant d'afficher l'état "assemblé" déjà visible pendant ce temps)
pour que même le tout premier dépliage puisse s'appuyer sur des frames
déjà en mémoire plutôt que de dépendre uniquement du décodeur en direct.
Le dépliage tente maintenant le cache à chaque étape (dessin instantané,
aucune attente) et ne retombe sur un seek vidéo live que pour les rares
zones pas encore capturées, avec le même verrou anti-chevauchement
qu'avant (jamais deux seeks en vol).

**Mobile : encore agrandir** — le ratio du bloc passe de 16:9 à carré
(`aspect-square`) sur mobile/tablette (toujours 16:9 à partir de `lg`,
à côté du texte), donnant nettement plus de hauteur d'affichage à largeur
égale.

**Mobile : écart trop grand** — l'espacement entre la colonne de texte et
le bloc matériaux (`gap-16`, 64px, hérité du grid parent qui empile les
deux colonnes sur mobile) est réduit à `gap-8` (32px) en dessous de `lg`,
où il reste inchangé pour la mise en page à deux colonnes still côte à
côte.

**Mobile : icônes mal centrées** — les 4 preuves (icône + valeur +
libellé) étaient alignées à gauche dans leur cellule de grille, comme le
reste du texte en prose au-dessus, mais rendu à la façon "carte" ça
tirait mal l'œil. Centré (icône, valeur, libellé) en dessous de `sm`,
inchangé (aligné à gauche) à partir de `sm`.

**Vérifications** : `tsc`/`eslint` propres (avertissement react-hooks
sur une ref capturée dans le cleanup corrigé en copiant la référence dans
une variable locale, comme recommandé) ; build de production réussi ;
géométrie mesurée à l'exécution — bloc matériaux 390×390 (carré, bord à
bord) sur un viewport 390px, 810×456 (ratio 1.78, soit 16:9) sur desktop ;
gap réel mesuré à 32px sur mobile (contre 64px avant) ; icônes centrées
sur mobile, alignées à gauche sur desktop, confirmé par les styles
calculés ; scénario de scroll graduel confirmant que le déclenchement
directionnel fonctionne toujours ; régression complète sur les 10 routes
sans nouvelle erreur. Comme toujours, la fluidité réelle du dépliage une
fois le cache alimenté reste à confirmer visuellement côté client — le
CDN vidéo est bloqué dans ce sandbox, donc ni la pré-chauffe ni le
détourage ni le rendu des frames en cache n'ont pu être vérifiés à l'œil
ici, seulement la logique (timing, verrouillage, alternance
cache/repli) et la géométrie.

## Notre histoire : ratio dynamique (écart) + régression de capture corrigée

Retour client : la taille et le centrage du round précédent sont validés
("parfait bien centré la taille c'est mieux"), mais l'écart avec le texte
au-dessus est *encore pire* qu'avant, et l'animation est devenue saccadée
**dans les deux sens** (alors que le repliement était déjà fluide). Le
client propose aussi d'inverser lui-même la vidéo et de me l'envoyer.

**Écart, cause réelle** : `aspect-square` était un pari sur la forme de la
vidéo, pas une mesure. Si la vidéo réelle n'est pas carrée (probable —
une frise de 6 matériaux est plutôt large que carrée), `object-contain`
centre le contenu dans la boîte carrée et laisse du vide transparent
au-dessus et en dessous — invisible une fois le fond détouré, mais bien
réel, et *plus grand* qu'avec `aspect-video` puisque l'écart entre "carré"
et "vidéo large" est plus important qu'entre "16:9" et "vidéo large". Le
cadre est maintenant dimensionné dynamiquement sur le vrai ratio de la
vidéo (`video.videoWidth / video.videoHeight`, mesuré dès que les
métadonnées chargent, via `style={{ aspectRatio }}`) plutôt que deviné —
`object-contain` n'a alors plus jamais de vide à ajouter, quelle que soit
la forme réelle du fichier. Repli sur 16:9 le temps du chargement.

**Régression de fluidité, cause réelle** : le cache de frames ajouté au
round précédent capturait les bitmaps (`createImageBitmap`) à la
résolution **native** de la vidéo, sans aucune réduction — alors que le
dessin sur canvas avait déjà été optimisé pour tourner à la résolution
d'affichage. Cette capture pleine résolution tournait pendant le
repliement (la lecture native, jusque-là fluide), ajoutant une charge
CPU/mémoire qui n'existait pas avant et dégradait la fluidité qui
fonctionnait déjà — exactement le "saccadé avant et arrière maintenant"
remonté par le client. Corrigé : la capture utilise maintenant les mêmes
`resizeWidth`/`resizeHeight` (taille d'affichage × ratio d'écran, comme le
canvas) que le dessin, via les options natives de `createImageBitmap`.

**Vidéo pré-inversée proposée par le client** : accepté — c'est la vraie
solution de fond. Avec une vidéo déjà montée dans le bon sens (matériaux
qui s'écartent), le dépliage pourrait lire nativement vers l'avant, tout
comme le repliement déjà fluide, et tout le mécanisme de scrub
manuel + cache de secours deviendrait inutile. En attente du fichier.

**Vérifications** : `tsc`/`eslint` propres ; build de production réussi ;
ratio de repli confirmé à l'exécution (`16 / 9`, boîte 390×219 sur un
viewport 390px tant que la vraie vidéo n'a pas chargé ses métadonnées
dans ce sandbox) ; écart mesuré toujours à 32px avec le nouveau cadre ;
scénario de scroll graduel confirmant que le déclenchement directionnel
fonctionne toujours ; régression complète sur les 10 routes sans nouvelle
erreur. Le ratio réel une fois la vraie vidéo chargée, et le gain de
fluidité de la réduction de résolution de capture, restent à confirmer
côté client — invérifiables ici, CDN vidéo bloqué par le sandbox.

## Notre histoire : vidéo pré-inversée du client — fin du scrub/cache

Retour très positif sur mobile ("très bien sur tel c'est parfait"). Le
client a fourni une seconde vidéo, montée cette fois dans le bon sens
(matériaux qui se séparent), avec deux ajustements desktop : de fines
lignes dorées entre les 6 légendes de matériaux, et les 4 icônes de
preuve mieux centrées (pas seulement sur mobile — sur desktop aussi,
elles restaient collées à gauche).

**Simplification architecturale majeure** : avec une vidéo "dépliage" qui
se joue nativement dans le bon sens, plus besoin de scrub arrière manuel
ni du cache de frames (`createImageBitmap`) qui compensait son absence de
fluidité — tout le mécanisme ajouté sur les rounds précédents (chained
seeks, pré-chauffe, cache, `EXPLODE_MS`/`REGROUP_MS`) est retiré. Le
composant utilise maintenant deux lecteurs vidéo distincts, chacun
toujours lu vers l'avant natif : `public/videos/materials-explode.mp4`
(nouvelle vidéo du client, auto-hébergée) pour le dépliage,
`/api/materials-video` (toujours relayée depuis le CDN d'origine) pour le
repliement. Bundle légèrement plus léger malgré l'ajout d'un second
`<video>` (13.5 kB contre 13.8 kB) — la suppression du cache pèse plus
lourd que l'ajout.

**Fichier client, traité sans ffmpeg** : la vidéo fournie (`.mov`) contient
un flux H.264/AAC standard dans un conteneur estampillé QuickTime
(vérifié par inspection binaire des marqueurs `avc1`/`avcC`, aucun
`ffmpeg`/`ffprobe` disponible dans ce sandbox pour un vrai remux) — copiée
telle quelle en `.mp4` dans `public/videos/`, ce qui suffit pour que les
navigateurs la servent et la décodent normalement (le contenu binaire
H.264/AAC est ce qui compte, pas l'étiquette d'origine du conteneur). Si
la taille (4,4 Mo) pose problème en prod, une compression restera à faire
avec de vrais outils vidéo.

**Lignes dorées** : bordure gauche fine (`border-laiton/40`) sur les 5
légendes suivant la première, dans la grille à 6 colonnes desktop.

**Icônes centrées, universellement** : le retour précédent ("centre sur
mobile") avait ajouté un `sm:items-start sm:text-left` qui repassait à
gauche dès la tablette — retiré, le centrage s'applique maintenant à
toutes les tailles d'écran, cohérent avec la capture desktop annotée par
le client.

**Filet de sécurité ajouté** : découverte en testant ce round — si une
vidéo ne joue jamais (fichier introuvable, codec non supporté...), les
deux boucles de lecture attendaient indéfiniment un `ended` qui ne
viendrait jamais, laissant les légendes bloquées invisibles pour de bon.
Un `setTimeout` de secours (6s, largement au-delà de toute lecture
normale) force maintenant la transition d'état dans les deux sens même
si la vidéo ne coopère jamais.

**Vérifications** : `tsc`/`eslint` propres ; build de production réussi ;
**découverte importante** — le Chromium de ce sandbox (build open-source
de Playwright) n'embarque aucun décodeur H.264 propriétaire
(`canPlayType` renvoie vide pour H.264, "probably" pour VP9), donc ni la
nouvelle vidéo auto-hébergée ni l'ancienne ne peuvent être lues à l'écran
ici — indépendant du blocage réseau du CDN déjà documenté, un problème
différent et plus fondamental limité à cet environnement de test (les
navigateurs grand public embarquent tous H.264). Le filet de sécurité a
justement été vérifié grâce à cette limite : après le délai de 6s, les
légendes apparaissent bien malgré l'échec de lecture ; lignes dorées et
centrage des icônes confirmés par les styles calculés ; géométrie mobile
(plein cadre, 390px) toujours correcte ; régression complète sur les 10
routes sans nouvelle erreur. Le rendu visuel réel (fluidité des deux
sens, résultat du détourage sur la nouvelle vidéo) reste à confirmer
côté client — cette fois avec de bien meilleures chances, puisque les
deux directions sont maintenant une lecture native simple, sans aucune
approximation.

## Notre histoire : bug de désynchronisation, compression vidéo, polish

Retour client : un vrai bug ("bloqué en mode compact" en scrollant de
façon erratique haut/bas), une demande de compression vidéo, un souhait
de vitesse "woosh", et les lignes du round précédent jugées trop longues.

**Bug de désynchronisation, cause et correction** : le déclenchement
réagissait au *sens* du dernier scroll (`scrollingDown`/`scrollingUp`)
et ignorait toute inversion de sens pendant qu'une animation était en
cours — une fois lancée, une passe se terminait toujours dans son sens
d'origine même si l'utilisateur avait entre-temps rebroussé chemin,
laissant l'affichage dans un état qui ne correspondait plus à la position
réelle de scroll, sans qu'aucun scroll ultérieur ne puisse le corriger
(les conditions de déclenchement ne correspondaient plus à l'état bloqué).
Remplacé par un modèle auto-correcteur (`syncState`) : l'état désiré
("groupé" ou "déplié") est recalculé à chaque vérification uniquement à
partir de la position actuelle par rapport à `THRESHOLD_VH`, jamais du
sens du dernier scroll. Si l'état désiré ne correspond pas à la phase en
cours — y compris en pleine animation dans le mauvais sens — l'animation
en cours est interrompue (`stopPlayLoop()`) et relancée immédiatement
dans le bon sens. Appelé aussi une fois au montage (pas seulement sur
`scroll`) pour couvrir le cas d'un chargement déjà scrollé au-delà du
seuil. Testé avec un scénario Playwright simulant un enchaînement
descend→remonte→redescend erratique : dans les deux tests précédents
(scroll graduel simple), le bug ne se manifestait pas — il fallait
spécifiquement une inversion de sens *pendant* l'animation pour le
déclencher, d'où sa découverte tardive.

**Vidéo compressée** : `public/videos/materials-explode.mp4` passe de
4,46 Mo à 336 Ko (−93%) — installation temporaire de `ffmpeg-static`
(`npm install --no-save`, désinstallé après usage, `package.json`
inchangé) pour disposer d'un vrai binaire ffmpeg dans ce sandbox qui n'en
a pas nativement. Vidéo source inspectée : 2560×1440, H.264 High profile,
24fps, 8,9 Mbps, piste audio AAC inutile (la vidéo est toujours coupée
côté lecteur). Ré-encodée en 1280×720 (bien au-delà de la taille
d'affichage réelle, jamais plus de ~900px de large sur le site), CRF 23,
preset `slow`, audio retiré, `+faststart`. Frame extraite et vérifiée
visuellement (voir capture envoyée) : qualité conservée, pas d'artefact
visible. Seule cette vidéo pouvait être compressée — celle du repliement
reste hébergée sur le CDN du client, hors de portée d'un ré-encodage
local.

**Vitesse "woosh"** : `playbackRate = 1.6` appliqué aux deux vidéos au
déclenchement (ni le "snap" à durée fixe abandonné plus tôt, ni la vitesse
naturelle jugée molle) — un compromis entre franc et brutal.

**Lignes courtes et centrées** : la bordure pleine hauteur (`border-l`)
du round précédent, jugée trop longue, est remplacée par un court trait
(`h-8`, 32px) positionné en `absolute`, centré verticalement sur le bloc
via `top-1/2 -translate-y-1/2` — un repère discret entre chaque matériau
plutôt qu'une séparation structurelle.

**Vérifications** : `tsc`/`eslint` propres ; build de production réussi ;
scénario de scroll erratique (descend, remonte avant la fin de
l'animation, attend, puis redescend) confirmant que l'état final
correspond toujours à la position réelle de scroll, y compris après
interruption ; lignes mesurées à l'exécution — 32px de haut, 1px de large,
laiton 50% d'opacité, positionnées entre chaque matériau (pas sur le
premier) ; capture d'écran conforme ; régression complète sur les 10
routes sans nouvelle erreur ; `package.json`/`package-lock.json` non
modifiés par l'installation temporaire de `ffmpeg-static`. La fluidité
perçue réelle (vitesse, résultat de la compression) reste à confirmer
côté client — toujours invérifiable ici, ce sandbox ne dispose d'aucun
décodeur H.264 (voir round précédent).

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
