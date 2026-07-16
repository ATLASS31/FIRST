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
  (le cas d'usage normal : on descend d'abord, on remonte ensuite). La
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
  changement de section), scrubbable dans les deux sens.
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
  jambage du "g" de "engagement." — corrigé (`mt-14`).
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
- **Gammes : ombres de plantes en fond de section** : un cadrage feuillage
  (fond flou plein cadre, puis des branches détourées à 2 puis 4 coins,
  puis des photos réelles) a été essayé pour cette section mais toujours
  jugé "cheap" — trop littéral, pas assez discret. La version actuelle
  n'utilise plus aucune photo : une silhouette de plante abstraite dessinée
  en SVG (tige + feuilles en ellipses, `PlantShadow` dans
  `GammesPreview.tsx`), posée à faible opacité et fortement floutée
  (`blur-xl`) dans deux coins opposés — comme une ombre portée plutôt
  qu'un feuillage détaillé. Le tracé n'a pas besoin d'être fin puisqu'il
  disparaît dans le flou ; c'est justement ce qui le rend discret. Aucune
  dépendance à une image générée (donc vérifiable et stable, contrairement
  aux tentatives précédentes).

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
