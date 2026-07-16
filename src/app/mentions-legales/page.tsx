import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Mentions légales | Bellora Homes",
};

const SECTIONS = [
  {
    title: "Éditeur du site",
    body: `Conformément aux dispositions des articles 6-III et 19 de la loi n° 2004-575 du 21 juin 2004 pour la confiance dans l'économie numérique.

Bellora Homes — [Raison sociale exacte à renseigner]
[Forme juridique, capital social à renseigner]
Siège social : [Adresse complète à renseigner]
SIRET : [Numéro SIRET à renseigner]
RCS : [Ville d'immatriculation à renseigner]
Directeur de la publication : [Nom à renseigner]
Téléphone : [À renseigner]
Email : contact@bellora-homes.com`,
  },
  {
    title: "Hébergement",
    body: `[Nom de l'hébergeur à renseigner]
[Adresse de l'hébergeur à renseigner]
[Téléphone de l'hébergeur à renseigner]`,
  },
  {
    title: "Contact",
    body: `Pour toute demande relative au site ou à nos services, contact@bellora-homes.com ou le formulaire de contact.`,
  },
  {
    title: "Propriété intellectuelle",
    body: `L'ensemble du contenu du site — textes, photographies, illustrations, vidéos, marques, logos — est protégé par le droit d'auteur et le droit des marques. Toute reproduction, représentation ou diffusion, totale ou partielle, est interdite sans autorisation écrite préalable de Bellora. Les images de réalisations sont la propriété de Bellora ou de ses partenaires et ne peuvent être utilisées à des fins commerciales sans accord exprès.`,
  },
  {
    title: "Responsabilité",
    body: `Bellora s'efforce de proposer des informations exactes et tenues à jour. Toutefois, les chiffres présentés (prix, délais, simulations de rentabilité) sont indicatifs et peuvent évoluer selon les configurations, l'emplacement et les conditions du marché. Seul un devis personnalisé établi par nos équipes engage contractuellement Bellora.`,
  },
  {
    title: "Droit applicable",
    body: `Les présentes mentions légales sont régies par le droit français. En cas de litige, et à défaut de résolution amiable, les tribunaux français seront seuls compétents.`,
  },
];

export default function MentionsLegalesPage() {
  return (
    <section className="mx-auto max-w-3xl px-6 py-28">
      <p className="eyebrow text-xs text-encre-douce">Informations légales</p>
      <h1 className="mt-4 text-4xl font-semibold text-encre sm:text-5xl">
        Mentions légales
      </h1>

      <div className="mt-16 space-y-12">
        {SECTIONS.map((section) => (
          <div key={section.title}>
            <h2 className="text-lg font-semibold text-encre">
              {section.title}
            </h2>
            <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-encre-doux">
              {section.body}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
