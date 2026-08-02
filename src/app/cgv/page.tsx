import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Conditions générales de vente | Bellora Homes",
};

const ARTICLES = [
  {
    title: "Article 1 — Objet",
    body: `Les présentes CGV régissent les relations contractuelles entre Bellora et toute personne physique ou morale (« le Client ») passant commande d'une maison modulaire Bellora, gamme Primaire, Premium ou Prestige.`,
  },
  {
    title: "Article 2 — Acceptation des conditions",
    body: `Toute commande implique l'acceptation pleine et entière des CGV, sauf accord particulier signé. Le Client reconnaît avoir reçu communication des présentes avant la signature du contrat.`,
  },
  {
    title: "Article 3 — Prix",
    body: `Les prix sont exprimés en euros HT, départ atelier sauf mention contraire. Le prix définitif fait l'objet d'un devis nominatif après étude du projet et du terrain. Bellora se réserve la faculté de modifier ses prix à tout moment ; les commandes fermes sont facturées au tarif en vigueur à la date d'acceptation du devis.`,
  },
  {
    title: "Article 4 — Modalités de paiement",
    body: `40% à la signature du contrat ; 20% au démarrage de la fabrication ; 40% à la livraison.`,
  },
  {
    title: "Article 5 — Délais de livraison",
    body: `Généralement entre 4 et 12 semaines à compter de l'encaissement du premier acompte, sous réserve de disponibilité des matériaux et des autorisations administratives.`,
  },
  {
    title: "Article 6 — Garanties",
    body: `Garantie décennale et garantie biennale de bon fonctionnement, plus une garantie commerciale étendue de 20 ans sur la structure (ossature, couverture, bardage).`,
  },
  {
    title: "Article 7 — Droit de rétractation",
    body: `Délai de 14 jours conformément aux articles L221-18 et suivants du Code de la consommation. La fabrication ne démarre qu'à l'expiration de ce délai, sauf demande expresse du Client.`,
  },
  {
    title: "Article 8 — Litige",
    body: `Recherche de solution amiable en priorité, puis tribunaux français compétents. Recours possible à un médiateur de la consommation.`,
  },
];

export default function CgvPage() {
  return (
    <section className="mx-auto max-w-3xl px-6 py-28">
      <p className="eyebrow text-xs text-encre-douce">Informations légales</p>
      <h1 className="mt-4 text-4xl font-semibold text-encre sm:text-5xl">
        Conditions générales de vente
      </h1>
      <p className="mt-4 text-sm text-encre-doux">
        Applicables aux prestations de conception, fabrication et pose de
        maisons modulaires Bellora. Susceptibles d&apos;évolution avant mise
        en ligne ; la version contractuelle vous est remise avec votre devis.
      </p>

      <div className="mt-16 space-y-12">
        {ARTICLES.map((article) => (
          <div key={article.title}>
            <h2 className="text-lg font-semibold text-encre">
              {article.title}
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-encre-doux">
              {article.body}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
