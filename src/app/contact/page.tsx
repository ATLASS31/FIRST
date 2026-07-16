import type { Metadata } from "next";
import ContactClient from "@/components/ContactClient";

export const metadata: Metadata = {
  title: "Contact — Parlons de votre projet | Bellora Homes",
  description:
    "Un échange. Une étude personnalisée. Aucun engagement. Nous concevons votre maison Bellora avec vous, pas à pas.",
};

export default function ContactPage() {
  return (
    <>
      <section className="px-6 pb-12 pt-40 text-center">
        <p className="eyebrow text-xs text-encre-douce">Votre projet</p>
        <h1 className="mx-auto mt-4 max-w-2xl text-4xl font-semibold text-encre sm:text-5xl">
          Parlons de votre projet.
        </h1>
        <p className="mx-auto mt-4 max-w-md text-sm text-encre-doux">
          Un échange. Une étude personnalisée. Aucun engagement.
        </p>
      </section>

      <section className="px-6 pb-20">
        <ContactClient />
      </section>

      <section className="px-6 pb-28 text-center">
        <p className="eyebrow text-xs text-encre-douce">
          Autres moyens de contact
        </p>
        <p className="mt-4 text-sm text-encre-doux">
          <a
            href="mailto:contact@bellora-homes.com"
            className="font-medium text-foret hover:underline"
          >
            contact@bellora-homes.com
          </a>{" "}
          — Réponse sous 48 h ouvrées.
        </p>
      </section>
    </>
  );
}
