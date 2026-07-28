import ProcedeCarousel from "./ProcedeCarousel";

export default function Procede() {
  return (
    // bg-ciel : demande client pour alterner les fonds section par
    // section (Concept crème → Notre histoire mint → Nos gammes crème →
    // Notre procédé mint...). Le `<section>` n'ayant lui-même pas de
    // fond avant ce changement, l'ancien code appliquait `max-w-6xl`
    // directement dessus — un simple ajout de `bg-ciel` sur ce même
    // élément aurait donné un bloc de couleur étroit, pas un fond plein
    // écran comme les autres sections teintées (`NotreHistoire.tsx`,
    // `GammesPreview.tsx`). D'où le conteneur interne séparé : le fond
    // est sur `<section>` (pleine largeur), `max-w-6xl` sur le `<div>`.
    //
    // Contenu : grille statique de 5 cartes remplacée par un carousel 3D
    // (demande client, référence visuelle à l'appui) — voir
    // `ProcedeCarousel.tsx` pour le détail (mécanique, données des
    // étapes, illustrations en attente des fichiers du client).
    <section id="procede" className="bg-ciel px-6 py-28">
      <div className="mx-auto max-w-6xl">
        <p className="eyebrow text-xs text-encre-douce">Notre procédé</p>
        <h2 className="mt-4 max-w-2xl text-4xl font-semibold text-encre sm:text-5xl">
          De la signature aux clés, sans surprise.
        </h2>

        <div className="mt-16">
          <ProcedeCarousel />
        </div>
      </div>
    </section>
  );
}
