import GlassPanel from "./GlassPanel";

const FIGURES = [
  { value: "20 ans", label: "de garantie" },
  { value: "4–12 semaines", label: "de livraison" },
  { value: "100%", label: "fabriqué en France" },
];

export default function KeyFigures() {
  return (
    <section className="mx-auto max-w-6xl px-6 py-28">
      <div className="grid gap-6 sm:grid-cols-3">
        {FIGURES.map((figure) => (
          <GlassPanel key={figure.label} className="px-8 py-10 text-center">
            <p className="text-4xl font-semibold text-foret sm:text-5xl">
              {figure.value}
            </p>
            <p className="eyebrow mt-3 text-xs text-encre-douce">
              {figure.label}
            </p>
          </GlassPanel>
        ))}
      </div>
    </section>
  );
}
