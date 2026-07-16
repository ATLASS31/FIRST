# Bellora Homes

Refonte du site bellora-homes.com — Next.js (App Router) + Tailwind CSS v4,
direction créative "Apple meets Liquid Glass". Cette V1 se concentre sur la
page d'accueil ; les autres pages sont des stubs de navigation.

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
- **Nav** (`src/components/Nav.tsx`) : menu mobile sans flash au chargement
  (état initial identique serveur/client).
- **Mentions légales** : structure complète, données réelles (SIRET, raison
  sociale, hébergeur) à compléter.

## À faire avant la mise en prod

- **Rapatrier les médias du hero** : `src/lib/media.ts` référence l'image et
  la vidéo générées (Higgsfield CDN, `d8j0ntlcm91z4.cloudfront.net`) — ce
  sont des liens de génération, pas un stockage permanent. À télécharger et
  héberger dans `public/` (ou le futur CMS) avant lancement.
- **Photographie des 3 gammes** (Primaire, Premium, Prestige) — priorité
  Prestige, qui n'a actuellement aucune image.
- **Fiches produit** réelles sur `/modeles` et les pages de gamme (stubs
  "bientôt disponible" pour l'instant).
- **Simulateur de rentabilité** : la section CTA de l'accueil est un teaser,
  la logique de calcul reste à implémenter.
- **CMS** (Sanity ou Payload) : pas branché dans cette V1, contenu en dur.
- Compléter les informations légales dans `src/app/mentions-legales/page.tsx`
  et les coordonnées de contact dans `src/components/Footer.tsx`.
