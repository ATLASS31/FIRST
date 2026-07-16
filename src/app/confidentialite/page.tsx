import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Politique de confidentialité | Bellora Homes",
};

const SECTIONS = [
  {
    title: "Données collectées",
    body: `Identité (prénom, nom), coordonnées (email, téléphone, code postal), informations relatives au projet (gamme, surface, région, budget), données techniques anonymisées de navigation.`,
  },
  {
    title: "Finalité du traitement",
    body: `Recontacter le client, établir un devis personnalisé, suivi du projet et exécution du contrat, obligations légales et comptables. Aucune cession, location ou vente à des tiers à des fins commerciales.`,
  },
  {
    title: "Conservation",
    body: `3 ans maximum pour une demande non concrétisée ; durée du contrat + archivage légal (10 ans pour les pièces comptables) pour un projet concrétisé.`,
  },
  {
    title: "Droits RGPD",
    body: `Droit d'accès et de copie, rectification, effacement, limitation du traitement, portabilité, opposition et retrait du consentement. Contact : contact@bellora-homes.com. Réclamation possible auprès de la CNIL.`,
  },
  {
    title: "Cookies",
    body: `Uniquement cookies strictement nécessaires et mesure d'audience anonymisée ; aucun cookie publicitaire ou de profilage sans consentement explicite.`,
  },
];

export default function ConfidentialitePage() {
  return (
    <section className="mx-auto max-w-3xl px-6 py-28">
      <p className="eyebrow text-xs text-encre-douce">Informations légales</p>
      <h1 className="mt-4 text-4xl font-semibold text-encre sm:text-5xl">
        Politique de confidentialité
      </h1>

      <div className="mt-16 space-y-12">
        {SECTIONS.map((section) => (
          <div key={section.title}>
            <h2 className="text-lg font-semibold text-encre">
              {section.title}
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-encre-doux">
              {section.body}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
