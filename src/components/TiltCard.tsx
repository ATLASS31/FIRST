"use client";

import { useRef, type ReactNode } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";

/**
 * Parallax très léger au survol de la souris (tilt 3D + décalage de
 * profondeur), pour donner une sensation d'objet physique aux cartes plutôt
 * qu'un aplat. Volontairement discret — quelques degrés maximum, jamais un
 * effet gadget. Ignoré au clavier/tactile (pas de pointeur fin).
 */
export default function TiltCard({
  children,
  className = "",
  strength = 2.5,
}: {
  children: ReactNode;
  className?: string;
  strength?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const px = useMotionValue(0.5);
  const py = useMotionValue(0.5);
  const springConfig = { stiffness: 300, damping: 30, mass: 0.4 };
  const sx = useSpring(px, springConfig);
  const sy = useSpring(py, springConfig);

  const rotateX = useTransform(sy, [0, 1], [strength, -strength]);
  const rotateY = useTransform(sx, [0, 1], [-strength, strength]);

  const handleMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    px.set((e.clientX - rect.left) / rect.width);
    py.set((e.clientY - rect.top) / rect.height);
  };

  const handleLeave = () => {
    px.set(0.5);
    py.set(0.5);
  };

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      style={{ rotateX, rotateY, transformPerspective: 800 }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
