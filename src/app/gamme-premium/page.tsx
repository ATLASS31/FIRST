import type { Metadata } from "next";
import GammeDetail from "@/components/GammeDetail";

export const metadata: Metadata = {
  title: "Gamme Premium — Le confort durable. | Bellora Homes",
  description:
    "Finitions soignées, équipement complet, sur-mesure léger. Matériaux durables, agencement réfléchi, confort maîtrisé. À partir de 80 888 € TTC.",
};

export default function GammePremiumPage() {
  return <GammeDetail slug="premium" />;
}
