"use client";

import { Suspense, useEffect, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";

const WARM_WHITE = "#f7f3ea";
const WARM_FLOOR = "#e9e1d0";

/**
 * Squelette minimal de la scène temps réel "La maison qui vous
 * ressemble" — phase 1 d'un chantier volontairement découpé en étapes
 * contrôlées (demande explicite du client, après validation de la
 * direction Three.js / React Three Fiber). Cette étape ne construit que
 * le premier temps du storyboard : une coquille architecturale vide sous
 * une lumière d'aube. Pas de fauteuil, pas de module qui s'ajoute, pas de
 * cycle des saisons — l'objectif est de valider que le socle technique
 * (rendu WebGL réel, réponse au scroll, performance, repli accessibilité)
 * est solide avant d'ajouter la moindre complexité de contenu.
 *
 * "Quelques éléments seulement" (demande explicite) : cinq plans pour la
 * coquille (sol, mur du fond, deux murs latéraux), trois lumières, une
 * caméra qui dérive légèrement avec le scroll. Aucune géométrie
 * importée, aucune texture — tout est construit en primitives pour
 * rester dans l'esprit abstrait/architectural déjà établi sur le reste
 * du site plutôt que de dépendre d'assets 3D générés (mesh IA) dont la
 * qualité ne peut pas être vérifiée visuellement dans ce sandbox (même
 * limitation déjà rencontrée avec les images de référence Higgsfield).
 */
function RoomShell() {
  return (
    <group>
      {/* Sol — profondeur 4 (de l'ouverture avant en z=0 au mur du fond
          en z=-4), largeur 5 (murs latéraux en x=±2.5). */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.3, -2]}>
        <planeGeometry args={[5, 4]} />
        <meshStandardMaterial color={WARM_FLOOR} roughness={0.9} />
      </mesh>
      <mesh position={[0, 0.4, -4]}>
        <planeGeometry args={[5, 3.4]} />
        <meshStandardMaterial color={WARM_WHITE} roughness={0.95} />
      </mesh>
      <mesh rotation={[0, Math.PI / 2, 0]} position={[-2.5, 0.4, -2]}>
        <planeGeometry args={[4, 3.4]} />
        <meshStandardMaterial color={WARM_WHITE} roughness={0.95} />
      </mesh>
      <mesh rotation={[0, -Math.PI / 2, 0]} position={[2.5, 0.4, -2]}>
        <planeGeometry args={[4, 3.4]} />
        <meshStandardMaterial color={WARM_WHITE} roughness={0.95} />
      </mesh>
    </group>
  );
}

/* Lumière d'aube : une directionnelle chaude et basse (premier temps du
   storyboard, "lumière de l'aube, totalement silencieux"), une
   hémisphère douce pour ne pas laisser les ombres se boucher, un ambiant
   très faible en appoint. */
function DawnLight() {
  return (
    <>
      <directionalLight position={[-3.5, 2.6, 1.5]} intensity={2.2} color="#ffe4b8" />
      <hemisphereLight args={["#f7f5f0", "#c9bca2", 0.55]} />
      <ambientLight intensity={0.25} />
    </>
  );
}

/* La caméra dérive très légèrement avec la progression du scroll dans la
   section (0 → 1) — juste de quoi prouver que le pipeline scroll → scène
   3D fonctionne réellement, avant de lui confier la mise en scène complète
   des six temps du storyboard dans une phase ultérieure. Lit
   `progressRef` à chaque frame plutôt que via une prop React classique :
   la valeur change à la fréquence du scroll (potentiellement chaque
   frame), la faire transiter par le state React déclencherait un
   re-render de tout l'arbre R3F à chaque pixel scrollé. */
function DriftingCamera({ progressRef }: { progressRef: React.RefObject<number> }) {
  useFrame(({ camera }) => {
    const p = progressRef.current;
    camera.position.x = -0.5 + p * 1;
    camera.position.y = 0.3 - p * 0.15;
    camera.lookAt(0, -0.1, -2.5);
  });
  return null;
}

export default function HouseScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef(0);

  useEffect(() => {
    let rafId: number | null = null;

    const updateProgress = () => {
      rafId = null;
      const el = containerRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const viewportH = window.innerHeight;
      // 0 quand le haut de la section touche le bas de l'écran, 1 quand
      // son bas touche le haut de l'écran — une progression simple sur
      // toute la traversée de la section, à affiner une fois le
      // découpage réel en six temps posé.
      const raw = (viewportH - rect.top) / (viewportH + rect.height);
      progressRef.current = Math.min(1, Math.max(0, raw));
    };

    const onScroll = () => {
      if (rafId !== null) return;
      rafId = requestAnimationFrame(updateProgress);
    };

    updateProgress();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (rafId !== null) cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <div ref={containerRef} className="absolute inset-0">
      <Canvas dpr={[1, 2]} camera={{ position: [-0.5, 0.3, 3.4], fov: 44 }} gl={{ antialias: true }}>
        <Suspense fallback={null}>
          <RoomShell />
          <DawnLight />
          <DriftingCamera progressRef={progressRef} />
        </Suspense>
      </Canvas>
    </div>
  );
}
