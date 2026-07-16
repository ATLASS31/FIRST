"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import GlassPanel from "./GlassPanel";
import TiltCard from "./TiltCard";
import LeafFrame from "./LeafFrame";
import { LEAF_BRANCH_BOTTOM_RIGHT_URL, LEAF_BRANCH_TOP_LEFT_URL, NOTRE_HISTOIRE_BG_URL } from "@/lib/media";

function SapinIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.3}
      strokeLinejoin="round"
      strokeLinecap="round"
      className="mx-auto h-6 w-6 text-laiton"
    >
      <path d="M12 2 16.5 8.5H14L18 14H14.5L19 20H5L9.5 14H6L10 8.5H7.5Z" />
      <path d="M12 20v2.2" />
    </svg>
  );
}

export default function NotreHistoire() {
  return (
    <section className="relative overflow-hidden px-6 py-28">
      <Image
        src={NOTRE_HISTOIRE_BG_URL}
        alt=""
        fill
        sizes="100vw"
        className="object-cover"
      />
      <div className="absolute inset-0 bg-encre/10" />

      <LeafFrame
        leaves={[
          { src: LEAF_BRANCH_TOP_LEFT_URL, corner: "top-left" },
          { src: LEAF_BRANCH_BOTTOM_RIGHT_URL, corner: "bottom-right" },
        ]}
      />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.7, ease: "easeOut" }}
        className="relative z-20 mx-auto max-w-2xl"
      >
        <TiltCard strength={1.5}>
          <GlassPanel sheen className="px-8 py-14 text-center sm:px-14 sm:py-16">
            <SapinIcon />
            <p className="eyebrow mt-4 text-xs text-encre-douce">
              Notre histoire
            </p>
            <div className="mx-auto mt-4 h-px w-10 bg-laiton/60" />
            <h2 className="mt-4 text-3xl font-semibold text-encre sm:text-4xl">
              Le modulaire bois, sans compromis.
            </h2>
            <p className="mt-6 text-base leading-relaxed text-encre-doux">
              Le modulaire bois traîne une réputation : préfabriqué bon marché,
              finitions médiocres, durée de vie courte. Nous construisons
              l&apos;inverse. Ossature Douglas certifiée, isolation conforme
              RE2020, bardage Cryptomeria — les matériaux et les gestes sont
              ceux d&apos;une maison construite sur place. Chaque maison est
              conçue et assemblée en atelier français par des charpentiers et
              menuisiers expérimentés.
            </p>
          </GlassPanel>
        </TiltCard>
      </motion.div>
    </section>
  );
}
