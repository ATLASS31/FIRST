import Link from "next/link";

export default function CtaSection() {
  return (
    <section className="px-6 py-28 text-center">
      <p className="eyebrow text-xs text-encre-douce">Votre projet</p>
      <h2 className="mt-4 text-3xl font-semibold text-encre sm:text-4xl">
        Parlons de votre projet.
      </h2>
      <p className="mx-auto mt-4 max-w-md text-sm text-encre-doux">
        Un échange. Une étude personnalisée. Aucun engagement. Nous concevons
        votre maison Bellora avec vous, pas à pas.
      </p>
      <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
        <Link
          href="/contact"
          className="rounded-full bg-foret px-8 py-3 text-sm font-medium text-brume transition-opacity hover:opacity-90"
        >
          Recevoir mon étude personnalisée
        </Link>
        <Link
          href="/modeles"
          className="rounded-full border border-encre/20 px-8 py-3 text-sm font-medium text-encre transition-colors hover:border-foret hover:text-foret"
        >
          Voir les modèles
        </Link>
      </div>
    </section>
  );
}
