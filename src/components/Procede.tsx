import ProcedeCarousel from "./ProcedeCarousel";

export default function Procede() {
  return (
    // Fond : `bg-ciel`, demande client explicite "la couleur de fond de
    // cette catégorie doit être la même que Notre histoire"
    // (`NotreHistoire.tsx` utilise `bg-ciel` — copié tel quel ici).
    // Remplace le dégradé radial sur `--brume` d'un round précédent
    // (qui répondait à une demande de contraste carte/fond devenue
    // obsolète depuis que le carousel n'a plus de carte du tout —
    // refonte "exposition d'architecture", voir `ProcedeCarousel.tsx`).
    // Rétablit au passage l'alternance mint/crème sur la page (Notre
    // histoire mint → Gammes crème → Procédé mint).
    //
    // 10e passe client : l'eyebrow + titre "De la signature aux clés..."
    // vivait ici, séparé de `ProcedeCarousel`, tant que toute la section
    // restait un unique flux vertical centré. La refonte desktop en 2
    // colonnes (voir `ProcedeCarousel.tsx`) exige que ce titre soit un
    // enfant direct de LA MÊME grille CSS que la maquette/le texte
    // d'étape pour pouvoir le placer en colonne de gauche, ligne 1 — un
    // living dans un composant séparé ne peut pas participer au
    // `grid-template` d'un autre. Déplacé dans `ProcedeCarousel`.
    // 11e passe client : "grossis-moi cette image beaucoup plus, on
    // s'en fout de la superposition" — la maquette agrandie via
    // `lg:scale-150` (voir `ProcedeCarousel.tsx`) déborde volontairement
    // sur le texte et la navigation voisins, mais son bord droit
    // dépassait aussi le viewport, créant une barre de scroll
    // horizontale sur TOUTE LA PAGE (pas juste un chevauchement local
    // dans la section — un vrai bug, pas ce que "on s'en fout de la
    // superposition" voulait dire). `overflow-x-clip` borne le débordement
    // à cette section : le chevauchement reste permis à l'intérieur,
    // plus de scroll horizontal global.
    <section id="procede" className="overflow-x-clip bg-ciel px-6 py-28">
      <div className="mx-auto max-w-6xl">
        <ProcedeCarousel />
      </div>
    </section>
  );
}
