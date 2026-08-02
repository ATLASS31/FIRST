"use client";

import { useState } from "react";
import GlassPanel from "@/components/GlassPanel";

const PROJETS = [
  { id: "residence-principale", label: "Résidence principale", body: "Votre habitation au quotidien" },
  { id: "residence-secondaire", label: "Résidence secondaire", body: "Maison de campagne, week-end, vacances" },
  { id: "investissement-locatif", label: "Investissement locatif", body: "Airbnb, saisonnier ou annuel" },
  { id: "extension", label: "Extension de maison", body: "Bureau, studio, suite parentale séparée" },
  { id: "autre", label: "Autre projet", body: "Atelier, gîte, écolieu — parlons-en" },
];

const GAMMES_OPTIONS = ["Primaire", "Premium", "Prestige", "Je ne sais pas encore"];
const SURFACES_OPTIONS = ["40 m²", "60 m²", "80 m²", "100 m²", "Plus"];
const TERRAIN_OPTIONS = [
  { id: "proprietaire", label: "Oui, je suis propriétaire" },
  { id: "recherche", label: "Je suis en recherche" },
  { id: "pas-encore", label: "Je n'en cherche pas encore" },
];

type FormData = {
  projet: string;
  gamme: string;
  surface: string;
  budget: string;
  emplacement: string;
  terrain: string;
  villeDepartement: string;
  prenom: string;
  nom: string;
  email: string;
  telephone: string;
  codePostal: string;
};

const INITIAL: FormData = {
  projet: "",
  gamme: "",
  surface: "",
  budget: "",
  emplacement: "",
  terrain: "",
  villeDepartement: "",
  prenom: "",
  nom: "",
  email: "",
  telephone: "",
  codePostal: "",
};

function OptionCard({
  selected,
  label,
  body,
  onClick,
}: {
  selected: boolean;
  label: string;
  body?: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={`w-full rounded-xl border p-4 text-left transition-colors ${
        selected
          ? "border-foret bg-foret/5"
          : "border-encre/15 hover:border-foret/40"
      }`}
    >
      <p className="text-sm font-medium text-encre">{label}</p>
      {body && <p className="mt-1 text-xs text-encre-douce">{body}</p>}
    </button>
  );
}

export default function ContactClient() {
  const [step, setStep] = useState(1);
  const [data, setData] = useState<FormData>(INITIAL);
  const [submitted, setSubmitted] = useState(false);

  const set = <K extends keyof FormData>(key: K, value: FormData[K]) =>
    setData((d) => ({ ...d, [key]: value }));

  const canNext =
    (step === 1 && data.projet !== "") ||
    (step === 2 && data.gamme !== "" && data.surface !== "") ||
    (step === 3 && data.terrain !== "") ||
    step === 4;

  const handleSubmit = () => {
    // TODO prod : brancher sur un vrai endpoint (email/CRM) — rien n'est
    // envoyé pour l'instant, la demande n'existe que côté client.
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <GlassPanel className="mx-auto max-w-xl px-8 py-16 text-center">
        <p className="eyebrow text-xs text-foret">Merci {data.prenom}</p>
        <h2 className="mt-4 text-2xl font-semibold text-encre">
          Votre demande est bien enregistrée.
        </h2>
        <p className="mt-4 text-sm text-encre-doux">
          Nous vous recontactons sous 48 h ouvrées.
        </p>
      </GlassPanel>
    );
  }

  return (
    <GlassPanel className="mx-auto max-w-2xl px-6 py-10 sm:px-10 sm:py-12">
      <p className="eyebrow text-xs text-encre-douce">Étape {step}/4</p>

      {step === 1 && (
        <div className="mt-4">
          <h2 className="text-xl font-semibold text-encre">
            Votre projet, en un mot.
          </h2>
          <p className="mt-2 text-sm text-encre-doux">
            Pour quoi imaginez-vous votre maison Bellora ?
          </p>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {PROJETS.map((p) => (
              <OptionCard
                key={p.id}
                label={p.label}
                body={p.body}
                selected={data.projet === p.id}
                onClick={() => set("projet", p.id)}
              />
            ))}
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="mt-4">
          <h2 className="text-xl font-semibold text-encre">
            Gamme, surface, budget.
          </h2>
          <p className="mt-2 text-sm text-encre-doux">
            Une idée déjà précise ? Ou un cadrage à affiner ensemble ?
          </p>

          <p className="eyebrow mt-6 text-[10px] text-encre-douce">Gamme</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {GAMMES_OPTIONS.map((g) => (
              <button
                key={g}
                type="button"
                aria-pressed={data.gamme === g}
                onClick={() => set("gamme", g)}
                className={`rounded-full border px-4 py-1.5 text-sm transition-colors ${
                  data.gamme === g
                    ? "border-foret bg-foret text-brume"
                    : "border-encre/20 text-encre-doux hover:border-foret"
                }`}
              >
                {g}
              </button>
            ))}
          </div>

          <p className="eyebrow mt-6 text-[10px] text-encre-douce">
            Surface souhaitée
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {SURFACES_OPTIONS.map((s) => (
              <button
                key={s}
                type="button"
                aria-pressed={data.surface === s}
                onClick={() => set("surface", s)}
                className={`rounded-full border px-4 py-1.5 text-sm transition-colors ${
                  data.surface === s
                    ? "border-laiton bg-laiton text-encre"
                    : "border-encre/20 text-encre-doux hover:border-laiton"
                }`}
              >
                {s}
              </button>
            ))}
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="text-xs text-encre-douce">
                Budget approximatif (optionnel)
              </span>
              <input
                type="text"
                value={data.budget}
                onChange={(e) => set("budget", e.target.value)}
                className="mt-2 w-full rounded-lg border border-encre/15 px-3 py-2 text-sm text-encre"
              />
            </label>
            <label className="block">
              <span className="text-xs text-encre-douce">
                Emplacement du terrain
              </span>
              <input
                type="text"
                value={data.emplacement}
                onChange={(e) => set("emplacement", e.target.value)}
                className="mt-2 w-full rounded-lg border border-encre/15 px-3 py-2 text-sm text-encre"
              />
            </label>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="mt-4">
          <h2 className="text-xl font-semibold text-encre">
            Avez-vous un terrain ?
          </h2>
          <p className="mt-2 text-sm text-encre-doux">
            Nous étudions sa configuration et adaptons les fondations.
          </p>
          <div className="mt-6 grid gap-3">
            {TERRAIN_OPTIONS.map((t) => (
              <OptionCard
                key={t.id}
                label={t.label}
                selected={data.terrain === t.id}
                onClick={() => set("terrain", t.id)}
              />
            ))}
          </div>
          <label className="mt-6 block">
            <span className="text-xs text-encre-douce">
              Ville ou département (optionnel)
            </span>
            <input
              type="text"
              value={data.villeDepartement}
              onChange={(e) => set("villeDepartement", e.target.value)}
              className="mt-2 w-full rounded-lg border border-encre/15 px-3 py-2 text-sm text-encre"
            />
          </label>
        </div>
      )}

      {step === 4 && (
        <div className="mt-4">
          <h2 className="text-xl font-semibold text-encre">
            Vos coordonnées.
          </h2>
          <p className="mt-2 text-sm text-encre-doux">
            Nous vous recontactons sous 48 h ouvrées.
          </p>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="text-xs text-encre-douce">Prénom</span>
              <input
                type="text"
                value={data.prenom}
                onChange={(e) => set("prenom", e.target.value)}
                className="mt-2 w-full rounded-lg border border-encre/15 px-3 py-2 text-sm text-encre"
              />
            </label>
            <label className="block">
              <span className="text-xs text-encre-douce">Nom</span>
              <input
                type="text"
                value={data.nom}
                onChange={(e) => set("nom", e.target.value)}
                className="mt-2 w-full rounded-lg border border-encre/15 px-3 py-2 text-sm text-encre"
              />
            </label>
            <label className="block">
              <span className="text-xs text-encre-douce">Email</span>
              <input
                type="email"
                value={data.email}
                onChange={(e) => set("email", e.target.value)}
                className="mt-2 w-full rounded-lg border border-encre/15 px-3 py-2 text-sm text-encre"
              />
            </label>
            <label className="block">
              <span className="text-xs text-encre-douce">Téléphone</span>
              <input
                type="tel"
                value={data.telephone}
                onChange={(e) => set("telephone", e.target.value)}
                className="mt-2 w-full rounded-lg border border-encre/15 px-3 py-2 text-sm text-encre"
              />
            </label>
            <label className="block">
              <span className="text-xs text-encre-douce">Code postal</span>
              <input
                type="text"
                value={data.codePostal}
                onChange={(e) => set("codePostal", e.target.value)}
                className="mt-2 w-full rounded-lg border border-encre/15 px-3 py-2 text-sm text-encre"
              />
            </label>
          </div>
        </div>
      )}

      <div className="mt-10 flex items-center justify-between">
        <button
          type="button"
          onClick={() => setStep((s) => Math.max(1, s - 1))}
          className={`text-sm font-medium text-encre-doux hover:text-foret ${
            step === 1 ? "invisible" : ""
          }`}
        >
          ← Précédent
        </button>

        {step < 4 ? (
          <button
            type="button"
            disabled={!canNext}
            onClick={() => setStep((s) => Math.min(4, s + 1))}
            className="rounded-full bg-foret px-6 py-2.5 text-sm font-medium text-brume transition-opacity disabled:opacity-30"
          >
            Suivant →
          </button>
        ) : (
          <button
            type="button"
            disabled={!data.prenom || !data.email}
            onClick={handleSubmit}
            className="rounded-full bg-foret px-6 py-2.5 text-sm font-medium text-brume transition-opacity disabled:opacity-30"
          >
            Envoyer ma demande
          </button>
        )}
      </div>
    </GlassPanel>
  );
}
