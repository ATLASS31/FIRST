"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import GlassPanel from "./GlassPanel";
import TiltCard from "./TiltCard";
import { FOLIAGE_URL } from "@/lib/media";

const PILIERS = [
  {
    title: "Le bois, noblement",
    subtitle: "Une matière vivante",
    body: "Épicéa et Douglas certifiés, châssis acier soudé, finition à la main.",
  },
  {
    title: "Le temps, maîtrisé",
    subtitle: "De la signature à la pose",
    body: "Quatre à douze semaines. Pas d'imprévus, pas de surprises.",
  },
  {
    title: "L'espace, à vous",
    subtitle: "Dix combinaisons",
    body: "Trois gammes, dix configurations à votre image.",
  },
];

export default function ThreePiliers() {
  return (
    <section id="concept" className="relative overflow-hidden py-28">
      <div className="absolute inset-0">
        <Image src={FOLIAGE_URL} alt="" fill sizes="100vw" className="object-cover" />
        <div className="absolute inset-0 bg-brume/85" />
        <div className="absolute inset-0 bg-gradient-to-b from-brume via-transparent to-brume" />
      </div>

      <div className="relative mx-auto max-w-6xl px-6">
        <div className="grid gap-6 md:grid-cols-3">
          {PILIERS.map((pilier, i) => (
            <motion.div
              key={pilier.title}
              initial={{ opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.6, delay: i * 0.12, ease: "easeOut" }}
            >
              <TiltCard strength={2.5}>
                <GlassPanel className="flex flex-col gap-3 p-8">
                  <p className="eyebrow text-xs text-foret">
                    {pilier.subtitle}
                  </p>
                  <h3 className="text-xl font-semibold text-encre">
                    {pilier.title}
                  </h3>
                  <p className="text-sm text-encre-doux">{pilier.body}</p>
                </GlassPanel>
              </TiltCard>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
