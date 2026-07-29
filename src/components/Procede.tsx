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
    // Intro centrée (`text-center`, alors que toutes les autres
    // sections du site ont un eyebrow+titre alignés à gauche) : demande
    // client sur la refonte du carousel lui-même ("exposition
    // d'architecture", tout centré sur sa maquette de référence) —
    // laisser l'intro alignée à gauche juste au-dessus aurait détonné
    // avec la composition entièrement centrée qui suit.
    <section id="procede" className="bg-ciel px-6 py-28">
      <div className="mx-auto max-w-6xl">
        <div className="mx-auto max-w-2xl text-center">
          <p className="eyebrow text-xs text-encre-douce">Notre procédé</p>
          <h2 className="mt-4 text-4xl font-semibold text-encre sm:text-5xl">
            De la signature aux clés, sans surprise.
          </h2>
        </div>

        <div className="mt-16">
          <ProcedeCarousel />
        </div>
      </div>
    </section>
  );
}
