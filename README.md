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

## À faire avant la mise en prod

- **Rapatrier les médias du hero** : `src/lib/media.ts` référence l'image et
  la vidéo générées (Higgsfield CDN, `d8j0ntlcm91z4.cloudfront.net`) — ce
  sont des liens de génération, pas un stockage permanent. À télécharger et
  héberger dans `public/` (ou le futur CMS) avant lancement.
- **Formulaire de contact non branché** : `ContactClient.tsx` affiche une
  confirmation mais n'envoie rien nulle part (pas d'endpoint email/CRM). Les
  demandes ne sont pas capturées tant que ce n'est pas câblé.
- **Photographie des 3 gammes** (Primaire, Premium, Prestige) — priorité
  Prestige, qui n'a actuellement aucune image — et galerie de réalisations.
- **Tour 360° et matrice des gammes** (présents sur le site actuel) : pas
  reconstruits dans cette passe.
- **Page Notre atelier** (`/atelier`) : stub, contenu à écrire — n'existe pas
  sur le site actuel.
- **CMS** (Sanity ou Payload) : pas branché, contenu en dur dans
  `src/lib/gammes.ts` et les composants.
- Compléter SIRET/raison sociale/hébergeur dans
  `src/app/mentions-legales/page.tsx` et les coordonnées (téléphone, adresse)
  dans `src/components/Footer.tsx`.
