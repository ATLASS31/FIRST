import GlassPanel from "./GlassPanel";

const PILIERS = [
  {
    title: "Le bois, noblement",
    subtitle: "Une matière vivante",
    body: "Épicéa et Douglas certifiés, châssis acier soudé, finition à la main.",
  },
  {
    title: "Le temps, maîtrisé",
    subtitle: "De la signature à la pose",
    body: "Quatre à douze semaines. Pas d'imprévus, pas de surprises.",
  },
  {
    title: "L'espace, à vous",
    subtitle: "Dix combinaisons",
    body: "Trois gammes, dix configurations à votre image.",
  },
];

export default function ThreePiliers() {
  return (
    <section id="concept" className="mx-auto max-w-6xl px-6 py-28">
      <div className="grid gap-6 md:grid-cols-3">
        {PILIERS.map((pilier) => (
          <GlassPanel key={pilier.title} className="flex flex-col gap-3 p-8">
            <p className="eyebrow text-xs text-foret">{pilier.subtitle}</p>
            <h3 className="text-xl font-semibold text-encre">
              {pilier.title}
            </h3>
            <p className="text-sm text-encre-doux">{pilier.body}</p>
          </GlassPanel>
        ))}
      </div>
    </section>
  );
}
