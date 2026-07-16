const ETAPES = [
  {
    title: "Échange et conception sur mesure",
    body: "Premier rendez-vous. On écoute votre projet, on regarde votre terrain, on dessine la maison qui vous ressemble.",
  },
  {
    title: "Fabrication à la main en atelier",
    meta: "4 à 8 semaines",
    body: "Vos modules naissent en atelier français. Ossature bois Douglas, isolation RE2020, finitions par nos artisans.",
  },
  {
    title: "Transport jusqu'à votre terrain",
    body: "Camions plateaux, escorte si nécessaire. Vos modules arrivent prêts à être posés.",
  },
  {
    title: "Pose et finitions par notre équipe française",
    meta: "1 à 2 semaines",
    body: "Grutage, assemblage, raccordements. Notre équipe orchestre l'opération sur place.",
  },
  {
    title: "Vous emménagez. Clé en main.",
    body: "Vous tournez la clé. Tout est prêt, tout est branché, tout est garanti 20 ans.",
  },
];

export default function Procede() {
  return (
    <section id="procede" className="mx-auto max-w-6xl px-6 py-28">
      <p className="eyebrow text-xs text-encre-douce">Notre procédé</p>
      <h2 className="mt-4 max-w-2xl text-4xl font-semibold text-encre sm:text-5xl">
        De la signature aux clés, sans surprise.
      </h2>

      <ol className="mt-16 grid gap-10 sm:grid-cols-2 lg:grid-cols-5">
        {ETAPES.map((etape, index) => (
          <li key={etape.title} className="flex flex-col gap-3">
            <span className="text-sm font-semibold text-laiton">
              {String(index + 1).padStart(2, "0")}
            </span>
            <h3 className="text-base font-semibold text-encre">
              {etape.title}
            </h3>
            {etape.meta && (
              <p className="eyebrow text-[10px] text-foret">{etape.meta}</p>
            )}
            <p className="text-sm text-encre-doux">{etape.body}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
