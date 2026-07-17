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
- **Gammes : de la décoration de fond à une fiche technique réelle** : le
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
