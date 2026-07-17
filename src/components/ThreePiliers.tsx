"use client";

import { motion } from "framer-motion";
import GlassPanel from "./GlassPanel";
import TiltCard from "./TiltCard";

/**
 * Ombre de plante abstraite (tige + feuilles en ellipses) — pas une photo :
 * une silhouette qu'on floute et qu'on pose à faible opacité, comme une
 * ombre portée plutôt qu'un feuillage détaillé.
 */
function PlantShadow({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 200" aria-hidden className={className}>
      <g fill="currentColor">
        <path
          d="M100 190 C96 145 92 95 68 42"
          stroke="currentColor"
          strokeWidth="3"
          fill="none"
          strokeLinecap="round"
        />
        <ellipse cx="60" cy="72" rx="27" ry="10" transform="rotate(-35 60 72)" />
        <ellipse cx="82" cy="50" rx="24" ry="9" transform="rotate(-12 82 50)" />
        <ellipse cx="53" cy="112" rx="29" ry="11" transform="rotate(-52 53 112)" />
        <ellipse cx="92" cy="132" rx="23" ry="9" transform="rotate(-18 92 132)" />
        <ellipse cx="44" cy="152" rx="25" ry="10" transform="rotate(-62 44 152)" />
      </g>
    </svg>
  );
}

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
    subtitle: "Neuf combinaisons",
    body: "Trois gammes, neuf configurations à votre image.",
  },
];

export default function ThreePiliers() {
  return (
    <section id="concept" className="relative overflow-hidden py-28">
      {/* Ombres de plantes à gauche et à droite : restreintes à ces deux
          zones (contrairement à l'essai précédent sur les cartes gammes,
          4 silhouettes scattered jugées gratuites) — comme la référence
          fournie, un feuillage qui déborde depuis les deux bords plutôt
          qu'un décor dispersé au hasard. Tailles responsive (base mobile
          → sm → lg) pour rester proportionné sur petit écran. `blur-sm`
          (4px) plutôt que `blur-md` (12px) initial — jugé trop flou, une
          silhouette à peine adoucie plutôt qu'une tache diffuse. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 overflow-hidden text-foret"
      >
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 0.16 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 1.2, ease: "easeOut" }}
          className="absolute -left-16 -top-10 h-64 w-64 sm:-left-20 sm:-top-14 sm:h-80 sm:w-80 lg:-left-24 lg:-top-16 lg:h-[26rem] lg:w-[26rem]"
        >
          <PlantShadow className="h-full w-full blur-sm" />
        </motion.div>
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 0.16 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 1.2, delay: 0.25, ease: "easeOut" }}
          className="absolute -right-16 -top-10 h-64 w-64 -scale-x-100 sm:-right-20 sm:-top-14 sm:h-80 sm:w-80 lg:-right-24 lg:-top-16 lg:h-[26rem] lg:w-[26rem]"
        >
          <PlantShadow className="h-full w-full blur-sm" />
        </motion.div>
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
