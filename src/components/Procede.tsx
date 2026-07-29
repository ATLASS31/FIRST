import ProcedeCarousel from "./ProcedeCarousel";

export default function Procede() {
  return (
    // Fond : demande client explicite "#F7F5F0 avec un très léger
    // dégradé" — cette teinte est exactement `--brume`, déjà utilisée
    // par `GammesPreview.tsx` juste au-dessus dans la page. Casse donc
    // l'alternance mint/crème mise en place plus tôt ce projet (deux
    // sections crème d'affilée, Gammes puis Procédé) — accepté
    // sciemment : la demande du client porte spécifiquement sur CETTE
    // section (contraste carte/fond, "les cartes se détachent
    // davantage"), un hex précis donné explicitement primant sur la
    // convention générale d'alternance posée dans un round antérieur.
    // Le dégradé radial très doux (4% d'écart de luminosité max) est la
    // "texture extrêmement subtile" demandée — juste assez pour casser
    // la platitude d'un aplat, jamais assez pour se voir comme un
    // "dégradé" à l'œil nu.
    //
    // Intro centrée (`text-center`, alors que toutes les autres
    // sections du site ont un eyebrow+titre alignés à gauche) : demande
    // client sur une refonte ultérieure du carousel lui-même
    // ("exposition d'architecture", tout centré sur sa maquette de
    // référence) — laisser l'intro alignée à gauche juste au-dessus
    // aurait détonné avec la composition entièrement centrée qui suit
    // (`ProcedeCarousel.tsx`).
    <section
      id="procede"
      className="px-6 py-28"
      style={{
        background:
          "radial-gradient(ellipse 80% 60% at 50% 0%, color-mix(in srgb, var(--brume) 96%, white 4%), var(--brume) 70%)",
      }}
    >
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
