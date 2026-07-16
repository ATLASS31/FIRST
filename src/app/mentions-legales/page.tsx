const SECTIONS = [
  {
    title: "Éditeur du site",
    body: `Bellora Homes — [Raison sociale exacte à renseigner]
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
    title: "Propriété intellectuelle",
    body: `L'ensemble des contenus présents sur ce site (textes, images, logos, vidéos) est la propriété exclusive de Bellora Homes, sauf mention contraire. Toute reproduction est interdite sans autorisation préalable.`,
  },
  {
    title: "Données personnelles",
    body: `Les données collectées via les formulaires du site sont utilisées uniquement dans le cadre du traitement de votre demande. Conformément au RGPD, vous disposez d'un droit d'accès, de rectification et de suppression de vos données en nous contactant à contact@bellora-homes.com.`,
  },
  {
    title: "Cookies",
    body: `Ce site utilise des cookies de mesure d'audience respectueux de la vie privée. [Détail de la solution analytics à renseigner].`,
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
