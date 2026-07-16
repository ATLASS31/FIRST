"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import GlassPanel from "./GlassPanel";
import LeafFrame from "./LeafFrame";
import TiltCard from "./TiltCard";
import { KEY_FIGURES_BG_URL, LEAF_BRANCH_BOTTOM_LEFT_URL, LEAF_BRANCH_TOP_RIGHT_URL } from "@/lib/media";

function ShieldIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.4}
      strokeLinejoin="round"
      className="mx-auto h-6 w-6 text-laiton"
    >
      <path d="M12 3l7 3v5c0 4.6-3 8.3-7 10-4-1.7-7-5.4-7-10V6l7-3Z" />
    </svg>
  );
}

function TruckIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.4}
      strokeLinejoin="round"
      strokeLinecap="round"
      className="mx-auto h-6 w-6 text-laiton"
    >
      <path d="M2.5 7h10.5v9h-10.5z" />
      <path d="M13 10.2h3.6L20 13.5V16h-7z" />
      <circle cx="6.3" cy="17.7" r="1.5" />
      <circle cx="17" cy="17.7" r="1.5" />
    </svg>
  );
}

function HexagonIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.4}
      strokeLinejoin="round"
      className="mx-auto h-6 w-6 text-laiton"
    >
      <path d="M12 2.5 19.5 7v10L12 21.5 4.5 17V7Z" />
    </svg>
  );
}

const FIGURES = [
  { value: "20 ans", label: "de garantie", Icon: ShieldIcon },
  { value: "4–12 semaines", label: "de livraison", Icon: TruckIcon },
  { value: "100%", label: "fabriqué en France", Icon: HexagonIcon },
];

export default function KeyFigures() {
  return (
    <section className="relative overflow-hidden px-6 py-28">
      <Image
        src={KEY_FIGURES_BG_URL}
        alt=""
        fill
        sizes="100vw"
        className="object-cover"
      />
      <div className="absolute inset-0 bg-encre/10" />

      <LeafFrame
        leaves={[
          { src: LEAF_BRANCH_TOP_RIGHT_URL, corner: "top-right" },
          { src: LEAF_BRANCH_BOTTOM_LEFT_URL, corner: "bottom-left" },
        ]}
      />

      <div className="relative z-20 mx-auto max-w-6xl">
        <div className="grid gap-6 sm:grid-cols-3">
          {FIGURES.map((figure, i) => (
            <motion.div
              key={figure.label}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.6, delay: i * 0.12, ease: "easeOut" }}
            >
              <TiltCard strength={2}>
                <GlassPanel sheen className="px-8 py-10 text-center">
                  <figure.Icon />
                  <p className="mt-4 text-4xl font-semibold text-foret sm:text-5xl">
                    {figure.value}
                  </p>
                  <p className="eyebrow mt-3 text-xs text-encre-douce">
                    {figure.label}
                  </p>
                </GlassPanel>
              </TiltCard>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
