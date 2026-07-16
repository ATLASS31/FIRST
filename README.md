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
- **Performance vidéo du hero** : le seek-par-scroll classique (forcer
  `video.currentTime` à chaque frame), même throttlé, même après un
  ré-encodage de la vidéo, restait saccadé au scroll vers l'arrière — un
  seek loin de la dernière image-clé reste un redécodage coûteux quoi qu'on
  fasse. Le scroll vers l'avant utilise `video.play()` + un `playbackRate`
  proportionnel au retard à rattraper (lecture séquentielle, fluide,
  confirmée). Pour l'arrière : au chargement, la vidéo est lue une fois en
  entier, cachée derrière le poster, en capturant une image toutes les
  0,2s via `createImageBitmap` dans un cache en mémoire ; le scroll vers
  l'arrière n'a alors plus besoin de seeker du tout, il dessine l'image en
  cache la plus proche sur un `<canvas>` superposé à la vidéo (fluide,
  confirmé). Le canvas est dimensionné sur la taille d'affichage réelle
  (× `devicePixelRatio`, recadrage "object-cover" calculé à la main dans
  `drawImage`, `imageSmoothingQuality: "high"`, léger boost de
  contraste/saturation au dessin) plutôt que sur la résolution native
  720p de la vidéo — sinon le navigateur agrandit un petit bitmap à la
  taille de l'écran par un simple scale CSS et le résultat pixellise en
  plus d'être flou. **Reste flou malgré ça** : la source est en 720p, un
  ré-encodage a déjà été tenté et a empiré les choses (cf. section
  "à faire") — sans un tournage/rendu en plus haute résolution, il y a un
  plafond de netteté qu'aucune technique de lecture ne peut dépasser.
  Repli (throttle + seek amorti) si `createImageBitmap` n'est pas
  disponible. L'effet d'herbe qui montait en premier plan a été abandonné
  (trop de complexité pour peu de valeur, et lié au chantier vidéo) ; à la
  place, une vague — un aplat plein (SVG) teinté brume comme le fond de la
  section des 3 piliers qui suit, avec seulement son contour traité en
  liquid glass lumineux (`.wave-rim`, `filter: drop-shadow`) — se balaie
  par un `clip-path` lié en continu à la progression du scroll (pas un
  seuil + une transition CSS à durée fixe, qui pouvait ne pas avoir fini
  avant la fin du scroll) : un vrai mouvement de vague, jamais un fondu,
  et scrubbable dans les deux sens comme le reste du hero.
- **Hero : texte et CTA alignés à gauche** (`items-start text-left`),
  plutôt que centrés, pour rester dans la zone basse-gauche de la vidéo
  comme sur la maquette de référence.
- **Gammes : feuilles détourées en premier plan aux 4 coins** : le fond en
  taches de couleur floutées (`GlowField`) et, avant ça, un fond photo
  feuillage plein cadre (jugés "cheap"/trop flous), puis une version à 2
  coins seulement (jugée trop clairsemée, "bizarre") ont été abandonnés ;
  la version actuelle pose 4 branches détourées (fond transparent,
  générées puis passées au détourage Higgsfield —
  `GAMMES_LEAF_BRANCH_TOP_LEFT_URL`/`TOP_RIGHT_URL`/`BOTTOM_LEFT_URL`/
  `BOTTOM_RIGHT_URL`) en dernier dans le markup (donc au premier plan,
  au-dessus des cartes), une à chaque coin de la section, chacune
  s'installant avec un léger ressort (Framer Motion `type: "spring"`,
  décalé par coin) plutôt qu'un simple fondu, quand la section entre dans
  le viewport.

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
