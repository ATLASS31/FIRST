"use client";

import Image from "next/image";
import { motion } from "framer-motion";

const CORNERS = {
  "top-left": {
    position: "-left-8 -top-8",
    objectPosition: "object-left-top",
    from: { x: -28, y: -20, rotate: -6 },
  },
  "top-right": {
    position: "-right-8 -top-8",
    objectPosition: "object-right-top",
    from: { x: 28, y: -20, rotate: 6 },
  },
  "bottom-left": {
    position: "-bottom-8 -left-8",
    objectPosition: "object-left-bottom",
    from: { x: -28, y: 20, rotate: 6 },
  },
  "bottom-right": {
    position: "-bottom-8 -right-8",
    objectPosition: "object-right-bottom",
    from: { x: 28, y: 20, rotate: -6 },
  },
} as const;

type Corner = keyof typeof CORNERS;

/**
 * Cadrage feuillage réutilisable : branches détourées (fond transparent)
 * posées en premier plan aux coins d'une section, révélées avec un léger
 * ressort quand la section entre dans le viewport.
 */
export default function LeafFrame({
  leaves,
}: {
  leaves: { src: string; corner: Corner; size?: string }[];
}) {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 z-10 overflow-hidden"
    >
      {leaves.map((leaf, i) => {
        const corner = CORNERS[leaf.corner];
        return (
          <motion.div
            key={leaf.corner}
            initial={{
              opacity: 0,
              x: corner.from.x,
              y: corner.from.y,
              rotate: corner.from.rotate,
              scale: 0.92,
            }}
            whileInView={{ opacity: 1, x: 0, y: 0, rotate: 0, scale: 1 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{
              type: "spring",
              stiffness: 70,
              damping: 15,
              delay: i * 0.1,
            }}
            className={`absolute ${corner.position} ${
              leaf.size ?? "h-52 w-40 sm:h-64 sm:w-48"
            }`}
          >
            <Image
              src={leaf.src}
              alt=""
              fill
              sizes="220px"
              className={`object-contain ${corner.objectPosition}`}
            />
          </motion.div>
        );
      })}
    </div>
  );
}
