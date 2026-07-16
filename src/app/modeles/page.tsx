import type { Metadata } from "next";
import ModelesClient from "@/components/ModelesClient";

export const metadata: Metadata = {
  title: "Nos modèles — Dix maisons, la vôtre | Bellora Homes",
  description:
    "Trois gammes, dix configurations de 40 à 100 m². Filtrez par gamme ou surface pour trouver votre maison Bellora.",
};

export default function ModelesPage() {
  return <ModelesClient />;
}
