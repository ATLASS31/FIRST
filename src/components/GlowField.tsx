/**
 * Taches de couleur floutées en fond de section : sans ça, le blur du
 * Liquid Glass n'a rien à réfracter sur un fond plat et ne se lit pas comme
 * du verre. Purement décoratif, toujours sous le contenu (z-index natif).
 */
export default function GlowField({
  tone = "cool",
}: {
  tone?: "cool" | "warm";
}) {
  if (tone === "warm") {
    return (
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 overflow-hidden"
      >
        <div className="absolute -left-24 top-10 h-72 w-72 rounded-full bg-laiton/30 blur-3xl" />
        <div className="absolute right-0 top-0 h-80 w-80 rounded-full bg-foret/20 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-64 w-64 rounded-full bg-ciel/70 blur-3xl" />
      </div>
    );
  }

  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 overflow-hidden"
    >
      <div className="absolute -left-20 top-0 h-72 w-72 rounded-full bg-foret/20 blur-3xl" />
      <div className="absolute right-0 top-16 h-80 w-80 rounded-full bg-laiton/25 blur-3xl" />
      <div className="absolute bottom-0 left-1/3 h-64 w-64 rounded-full bg-ciel/80 blur-3xl" />
    </div>
  );
}
