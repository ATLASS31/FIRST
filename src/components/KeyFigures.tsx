"use client";

import { motion } from "framer-motion";
import GlassPanel from "./GlassPanel";
import GlowField from "./GlowField";

const FIGURES = [
  { value: "20 ans", label: "de garantie" },
  { value: "4–12 semaines", label: "de livraison" },
  { value: "100%", label: "fabriqué en France" },
];

export default function KeyFigures() {
  return (
    <section className="relative overflow-hidden px-6 py-28">
      <GlowField tone="cool" />
      <div className="relative mx-auto max-w-6xl">
        <div className="grid gap-6 sm:grid-cols-3">
          {FIGURES.map((figure, i) => (
            <motion.div
              key={figure.label}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.6, delay: i * 0.12, ease: "easeOut" }}
            >
              <GlassPanel className="px-8 py-10 text-center">
                <p className="text-4xl font-semibold text-foret sm:text-5xl">
                  {figure.value}
                </p>
                <p className="eyebrow mt-3 text-xs text-encre-douce">
                  {figure.label}
                </p>
              </GlassPanel>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
