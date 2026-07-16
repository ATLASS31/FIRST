"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import GlowField from "./GlowField";
import TiltCard from "./TiltCard";
import { GAMMES } from "@/lib/gammes";

function SparkleIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={`scale-50 opacity-0 transition-all duration-300 group-hover:scale-100 group-hover:rotate-45 group-hover:opacity-100 group-focus-within:scale-100 group-focus-within:opacity-100 group-active:scale-100 group-active:opacity-100 ${className}`}
    >
      <path d="M12 0 L14.2 9.8 L24 12 L14.2 14.2 L12 24 L9.8 14.2 L0 12 L9.8 9.8 Z" />
    </svg>
  );
}

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
              <TiltCard strength={2.5}>
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
                      className={`glass absolute left-5 top-5 flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-semibold text-${gamme.accent}`}
                    >
                      <SparkleIcon className="h-3 w-3" />
                      {gamme.name}
                    </span>

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
              </TiltCard>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
