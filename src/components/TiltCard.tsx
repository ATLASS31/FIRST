"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";

/**
 * Parallax très léger au survol de la souris (tilt 3D + décalage de
 * profondeur), pour donner une sensation d'objet physique aux cartes plutôt
 * qu'un aplat. Volontairement discret — quelques degrés maximum, jamais un
 * effet gadget. Ignoré au clavier/tactile (pas de pointeur fin).
 *
 * Le `mousemove` brut peut se déclencher bien plus souvent qu'une frame
 * d'écran (souris haute fréquence) ; chaque appel recalculait la rotation
 * immédiatement, ce qui multipliait les recompositions inutiles sur des
 * cartes avec `backdrop-filter` (déjà coûteux à recalculer à chaque
 * frame quand la géométrie de l'élément change) — perçu comme "pas
 * fluide", surtout sur le grand panneau du calculateur. Les coordonnées
 * les plus récentes sont conservées dans une ref et appliquées au plus
 * une fois par frame via `requestAnimationFrame`.
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
  const rafRef = useRef<number | null>(null);
  const latestPoint = useRef({ x: 0, y: 0 });
  const px = useMotionValue(0.5);
  const py = useMotionValue(0.5);
  const springConfig = { stiffness: 300, damping: 30, mass: 0.4 };
  const sx = useSpring(px, springConfig);
  const sy = useSpring(py, springConfig);

  const rotateX = useTransform(sy, [0, 1], [strength, -strength]);
  const rotateY = useTransform(sx, [0, 1], [-strength, strength]);

  useEffect(() => {
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  const handleMove = (e: React.MouseEvent<HTMLDivElement>) => {
    latestPoint.current = { x: e.clientX, y: e.clientY };
    if (rafRef.current !== null) return;
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null;
      const rect = ref.current?.getBoundingClientRect();
      if (!rect) return;
      px.set((latestPoint.current.x - rect.left) / rect.width);
      py.set((latestPoint.current.y - rect.top) / rect.height);
    });
  };

  const handleLeave = () => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
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
