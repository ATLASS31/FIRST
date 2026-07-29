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
    <section id="procede" className="bg-ciel px-6 py-28">
      <div className="mx-auto max-w-6xl">
        <ProcedeCarousel />
      </div>
    </section>
  );
}
