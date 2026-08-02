import type { Metadata } from "next";
import GammeDetail from "@/components/GammeDetail";

export const metadata: Metadata = {
  title: "Gamme Primaire — L'essentiel, à la main. | Bellora Homes",
  description:
    "Module habitable, isolation RE2020, équipement de base. Ossature bois Douglas, finitions soignées, prêt à vivre. À partir de 76 134 € TTC.",
};

export default function GammePrimairePage() {
  return <GammeDetail slug="primaire" />;
}
