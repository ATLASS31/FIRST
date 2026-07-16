"use client";

import Image from "next/image";
import { motion } from "framer-motion";
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
    <section id="concept" className="mx-auto max-w-6xl px-6 py-28">
      <div className="grid gap-6 md:grid-cols-3">
        {PILIERS.map((pilier, i) => (
          <motion.div
            key={pilier.title}
            initial={{ opacity: 0, y: 28 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.6, delay: i * 0.12, ease: "easeOut" }}
          >
            <TiltCard strength={5}>
              <div className="relative flex h-64 flex-col justify-end overflow-hidden rounded-2xl p-8 shadow-[0_20px_40px_-12px_rgba(26,22,20,0.25)]">
                <Image
                  src={FOLIAGE_URL}
                  alt=""
                  fill
                  sizes="(min-width: 768px) 33vw, 100vw"
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-foret/95 via-foret/70 to-foret/30" />

                <div className="relative">
                  <p className="eyebrow text-xs text-laiton">
                    {pilier.subtitle}
                  </p>
                  <h3 className="mt-2 text-xl font-semibold text-brume">
                    {pilier.title}
                  </h3>
                  <p className="mt-2 text-sm text-brume/80">{pilier.body}</p>
                </div>
              </div>
            </TiltCard>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
