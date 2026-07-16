"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import GlowField from "./GlowField";
import { GAMMES } from "@/lib/gammes";

const SPARKLE_POSITIONS = [
  { top: "6%", left: "6%", delay: "0s" },
  { top: "6%", left: "50%", delay: "0.08s" },
  { top: "6%", right: "6%", delay: "0.16s" },
  { bottom: "6%", left: "6%", delay: "0.06s" },
  { bottom: "6%", left: "50%", delay: "0.14s" },
  { bottom: "6%", right: "6%", delay: "0.1s" },
] as const;

export default function GammesPreview() {
  return (
    <section id="gammes" className="relative overflow-hidden bg-ciel px-6 py-28">
      <GlowField tone="warm" />
      <div className="relative mx-auto max-w-6xl">
        <p className="eyebrow text-xs text-encre-douce">Nos gammes</p>
        <h2 className="mt-4 max-w-2xl text-4xl font-semibold text-encre sm:text-5xl">
          Trois gammes pour trois exigences.
        </h2>

        <div className="mt-16 grid gap-6 md:grid-cols-3">
          {GAMMES.map((gamme, i) => (
            <motion.div
              key={gamme.href}
              initial={{ opacity: 0, y: 32 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.6, delay: i * 0.12, ease: "easeOut" }}
            >
              <Link href={gamme.href} className="group relative block">
                <div className="relative h-96 overflow-hidden rounded-2xl shadow-[0_20px_40px_-12px_rgba(26,22,20,0.25)] transition-transform duration-500 group-hover:-translate-y-1">
                  <Image
                    src={gamme.imageUrl}
                    alt={`Maison Bellora, gamme ${gamme.name}`}
                    fill
                    sizes="(min-width: 768px) 33vw, 100vw"
                    className="object-cover transition-transform duration-700 ease-out group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-encre/85 via-encre/20 to-transparent" />

                  <span
                    className={`glass absolute left-5 top-5 rounded-full px-4 py-1.5 text-xs font-semibold text-${gamme.accent}`}
                  >
                    {gamme.name}
                  </span>

                  <div className={`text-${gamme.accent} absolute inset-0`}>
                    {SPARKLE_POSITIONS.map((pos, idx) => (
                      <span
                        key={idx}
                        className="sparkle"
                        style={{ ...pos, animationDelay: pos.delay }}
                      />
                    ))}
                  </div>

                  <div className="absolute inset-x-0 bottom-0 p-6">
                    <p className="text-sm text-brume/85">
                      {gamme.cardTagline}
                    </p>
                    <p className="mt-2 text-sm font-medium text-brume">
                      {gamme.fromPrice}
                    </p>
                    <p className="eyebrow mt-3 text-xs text-laiton">
                      Découvrir →
                    </p>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
