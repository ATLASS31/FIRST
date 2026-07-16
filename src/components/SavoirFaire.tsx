const MATERIAUX = [
  "Ossature bois Douglas certifiée",
  "Isolation XPS conforme RE2020",
  "Bardage Cryptomeria naturel",
  "Menuiseries aluminium double vitrage",
  "Toiture panneaux sandwich isolés",
  "Hauteur intérieure 2,40 m",
  "Assemblage 3 à 10 jours",
  "Garantie 20 ans",
];

const LABELS = ["RE2020", "PEFC", "Décennale", "CE"];

export default function SavoirFaire() {
  return (
    <section className="bg-brume-2 px-6 py-28">
      <div className="mx-auto max-w-6xl">
        <p className="eyebrow text-xs text-encre-douce">Savoir-faire</p>
        <h2 className="mt-4 max-w-2xl text-4xl font-semibold text-encre sm:text-5xl">
          Bâti pour durer.
        </h2>
        <p className="mt-4 max-w-2xl text-sm text-encre-doux">
          Matériaux nobles, normes RE2020, exécution main.
        </p>

        <div className="mt-12 flex flex-wrap gap-3">
          {LABELS.map((label) => (
            <span
              key={label}
              className="rounded-full border border-foret/20 px-4 py-1.5 text-xs font-medium text-foret"
            >
              {label}
            </span>
          ))}
        </div>

        <ul className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {MATERIAUX.map((item) => (
            <li
              key={item}
              className="border-t border-encre/10 pt-4 text-sm text-encre-doux"
            >
              {item}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
