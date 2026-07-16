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
- **Herbe en premier plan** (`Hero.tsx`) : vrai visuel photo (Higgsfield),
  révélé sur le dernier quart du scroll du hero avec un fondu en masque CSS,
  comme si le drone se posait au ras du sol — indépendant de l'état de la
  vidéo (transform CSS pur).
- **Glass étendu + micro-interactions** : tuiles chiffres clés, badges
  savoir-faire, CTA finale, bouton du hero, calculateur ; taches de couleur
  floutées (`GlowField.tsx`) derrière les tuiles/gammes pour que le blur ait
  quelque chose à réfracter ; reflet ambiant lent sur le chrome permanent
  (nav) vs reflet au survol uniquement sur les cartes interactives ; entrées
  animées au scroll et parallax léger au survol (`TiltCard.tsx`, Framer
  Motion) sur la quasi-totalité des cartes.
- **Calculateur de rentabilité** (`RentabiliteCalculator.tsx`) : refonte en
  "objet premium" — verre sur noir mat chaud (`glass-graphite`), slider
  custom (`PremiumSlider.tsx`), chiffres qui s'animent au changement
  (`AnimatedNumber.tsx`).
- **Performance vidéo du hero** : la vidéo source (générée) n'a
  vraisemblablement une image-clé que toutes les 1-2s, donc un seek à
  chaque frame de scroll (jusqu'à 60×/s) devient très coûteux au fil du
  scroll. Le seek est throttled (~180ms min entre deux seeks réels, 0,18s
  max par pas) — la vidéo "rattrape" le scroll en douceur plutôt que de le
  suivre au pixel près, un compromis volontaire pour la fluidité. Mitigation
  côté code, pas un ré-encodage de la vidéo (voir ci-dessous) — si ça reste
  saccadé, il n'y a plus grand-chose à gagner côté JS.

## À faire avant la mise en prod

- **Ré-encoder la vidéo du hero avec une image-clé par frame** (ou passer à
  une séquence d'images) si le throttling ne suffit pas à éliminer tout
  saccadé — c'est la vraie correction structurelle pour du scroll-scrub
  fluide sur toutes les machines ; je n'ai pas pu le faire moi-même (pas
  d'accès pour télécharger/traiter la vidéo depuis mon environnement).
- **Rapatrier les médias** (hero, herbe, feuillage, visuels de gammes) :
  `src/lib/media.ts` et `src/lib/gammes.ts` référencent des images/vidéo
  générées (Higgsfield CDN, `d8j0ntlcm91z4.cloudfront.net`) — ce sont des
  liens de génération, pas un stockage permanent. À télécharger et héberger
  dans `public/` (ou le futur CMS) avant lancement.
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
