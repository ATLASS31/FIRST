import type { Metadata } from "next";
import GammeDetail from "@/components/GammeDetail";

export const metadata: Metadata = {
  title: "Gamme Prestige — L'art de la maison. | Bellora Homes",
  description:
    "Matériaux nobles, finitions haut de gamme, sur-mesure complet. Bois massif, pierre naturelle, géométrie patiente. À partir de 88 763 € TTC.",
};

export default function GammePrestigePage() {
  return <GammeDetail slug="prestige" />;
}
