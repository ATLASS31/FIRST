"use client";

import { Suspense, useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

const SKY_COLOR = "#eef2ea";

function easeInOutCubic(t: number) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

/**
 * Prototype — deuxième direction artistique complète pour "Notre histoire",
 * sur demande explicite du client : abandon total du monolithe sombre
 * ("je ne veux plus essayer de réparer cette idée"), nouveau concept
 * "traverser la forêt Bellora" — une traversée continue pilotée par le
 * scroll plutôt qu'un objet isolé. Ambiance lumineuse, naturelle,
 * apaisante ; low poly traité de façon architecturale (formes épurées,
 * `flatShading`, palette naturelle), jamais jeu vidéo ni cartoon.
 *
 * Portée volontairement minimale à ce stade — demande explicite : "je veux
 * d'abord un prototype très simple [...] pas besoin de construire toute la
 * scène immédiatement". Une quinzaine d'arbres, une lumière (+ hémisphère
 * pour le rebond naturel ciel/sol, coût quasi nul), le lac. Le panneau
 * Liquid Glass lui-même n'est pas ici : il reste un élément DOM/CSS
 * (`NotreHistoire.tsx`, réutilisant `GlassPanel`) positionné par-dessus le
 * canevas — refaire le flou d'arrière-plan et la transparence en WebGL
 * aurait été une reconstruction coûteuse d'un système déjà approuvé et
 * en place sur tout le reste du site.
 *
 * Séquence pilotée par un seul `progressRef` (0→1 sur toute la course de
 * la section épinglée, calculé dans `NotreHistoire.tsx` et lu ici dans
 * `useFrame` — même discipline que le chantier précédent : jamais de
 * re-render React au pixel scrollé) :
 * - 0.00–0.20 : la forêt, caméra quasiment immobile, sensation d'entrée.
 * - 0.20–0.55 : avancée continue + les arbres s'écartent progressivement.
 * - 0.35–0.75 : le brouillard recule, la lumière se réchauffe — la
 *   clairière et le lac se révèlent.
 * - 0.85–1.00 : la caméra se stabilise, le panneau Liquid Glass (DOM) se
 *   révèle par-dessus.
 */
type TreeSpec = {
  xNear: number;
  z: number;
  scale: number;
  partAmount: number;
  canopyLift: number;
};

function generateTrees(count: number): TreeSpec[] {
  const trees: TreeSpec[] = [];
  for (let i = 0; i < count; i++) {
    const side = i % 2 === 0 ? -1 : 1;
    const z = 3 - (i / count) * 26 + (Math.random() - 0.5) * 2.4;
    const xNear = side * (1.05 + Math.random() * 0.9);
    trees.push({
      xNear,
      z,
      scale: 0.82 + Math.random() * 0.5,
      partAmount: 1.3 + Math.random() * 1.1,
      canopyLift: Math.random() * 0.15,
    });
  }
  return trees;
}

function Tree({ spec, progressRef }: { spec: TreeSpec; progressRef: React.RefObject<number> }) {
  const groupRef = useRef<THREE.Group>(null);

  const trunkGeometry = useMemo(() => new THREE.CylinderGeometry(0.045, 0.08, 1, 5), []);
  const canopyLowGeometry = useMemo(() => new THREE.ConeGeometry(0.52, 1.05, 6), []);
  const canopyHighGeometry = useMemo(() => new THREE.ConeGeometry(0.36, 0.85, 6), []);

  const trunkMaterial = useMemo(
    () => new THREE.MeshStandardMaterial({ color: "#5b4530", roughness: 0.9, flatShading: true }),
    []
  );
  const canopyLowMaterial = useMemo(
    () => new THREE.MeshStandardMaterial({ color: "#3c4c37", roughness: 0.85, flatShading: true }),
    []
  );
  const canopyHighMaterial = useMemo(
    () => new THREE.MeshStandardMaterial({ color: "#4f6247", roughness: 0.85, flatShading: true }),
    []
  );

  useFrame(() => {
    if (!groupRef.current) return;
    const raw = Math.min(1, Math.max(0, progressRef.current));
    const partT = Math.max(0, Math.min(1, (raw - 0.2) / 0.35));
    const partEased = easeInOutCubic(partT);
    const x = spec.xNear + Math.sign(spec.xNear) * partEased * spec.partAmount;
    groupRef.current.position.x = x;
  });

  return (
    <group ref={groupRef} position={[spec.xNear, 0, spec.z]} scale={spec.scale}>
      <mesh geometry={trunkGeometry} material={trunkMaterial} position={[0, 0.5, 0]} castShadow />
      <mesh
        geometry={canopyLowGeometry}
        material={canopyLowMaterial}
        position={[0, 1.15 + spec.canopyLift, 0]}
        castShadow
      />
      <mesh
        geometry={canopyHighGeometry}
        material={canopyHighMaterial}
        position={[0, 1.75 + spec.canopyLift, 0]}
        castShadow
      />
    </group>
  );
}

function Forest({ progressRef }: { progressRef: React.RefObject<number> }) {
  const trees = useMemo(() => generateTrees(15), []);
  return (
    <>
      {trees.map((spec, i) => (
        <Tree key={i} spec={spec} progressRef={progressRef} />
      ))}
    </>
  );
}

/* Le lac — une surface simple, légèrement réfléchissante ("très peu de
   détails, mais une belle profondeur", demande explicite) : un
   `MeshStandardMaterial` clair à faible rugosité plutôt qu'un vrai plan de
   réflexion temps réel (coût et complexité disproportionnés pour un
   prototype dont l'objectif est de valider la sensation générale). */
function Lake() {
  const geometry = useMemo(() => new THREE.CircleGeometry(9, 48), []);
  const material = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#bcd3d6",
        roughness: 0.18,
        metalness: 0.05,
      }),
    []
  );
  // Légèrement au-dessus du sol (0.03 contre 0 pour le sol) : le lac doit
  // recouvrir visuellement le sol à cet endroit, pas l'inverse — un plan
  // de sol unique et continu passe dessous sans interruption ni bord visible.
  return (
    <mesh
      geometry={geometry}
      material={material}
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, 0.03, -24]}
      receiveShadow
    />
  );
}

/* Sol forestier — un unique plan continu, largement plus grand que la
   course de la caméra et que la portée maximale du brouillard, pour que
   son bord physique reste toujours noyé dans le brouillard plutôt que de
   créer une ligne d'horizon nette (bug trouvé à l'écran : un bord de sol
   trop proche produisait une frontière ciel/sol très dure). */
function Ground() {
  const geometry = useMemo(() => new THREE.PlaneGeometry(70, 130), []);
  const material = useMemo(
    () => new THREE.MeshStandardMaterial({ color: "#4a5240", roughness: 1 }),
    []
  );
  return (
    <mesh geometry={geometry} material={material} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -18]} receiveShadow />
  );
}

/* Lumière naturelle — un soleil filtré (directionnel, chaud, bas) qui se
   réchauffe et se renforce à l'approche du lac, une hémisphère pour le
   rebond ciel/sol (bleu pâle / vert sourd, quasi gratuit et très efficace
   en extérieur), un ambiant très faible en appoint. Aucune source
   spectaculaire — "lumière douce", "beaucoup de lumière filtrée entre les
   arbres" plutôt qu'un projecteur. */
function NaturalLight({ progressRef }: { progressRef: React.RefObject<number> }) {
  const sunRef = useRef<THREE.DirectionalLight>(null);
  const warmColor = useMemo(() => new THREE.Color("#fff1d6"), []);
  const coolColor = useMemo(() => new THREE.Color("#eef0e2"), []);
  const tmpColor = useMemo(() => new THREE.Color(), []);

  useFrame(() => {
    if (!sunRef.current) return;
    const raw = Math.min(1, Math.max(0, progressRef.current));
    const warmT = Math.max(0, Math.min(1, (raw - 0.45) / 0.4));
    sunRef.current.intensity = THREE.MathUtils.lerp(1.6, 2.4, warmT);
    tmpColor.copy(coolColor).lerp(warmColor, warmT);
    sunRef.current.color.copy(tmpColor);
  });

  return (
    <>
      {/* Le frustum de la shadow camera est explicite (défaut Three.js :
         une boîte orthographique d'environ ±5 unités, minuscule face à un
         sol de 70×130 et à une caméra qui parcourt une trentaine d'unités
         en z) — sans ces bornes, tout ce qui tombe hors de la petite boîte
         par défaut échantillonne un texel de bord "au hasard" sur la
         shadow map, ce qui produisait une bande horizontale sombre et nette
         à l'horizon (bug trouvé à l'écran, confondu d'abord avec un
         problème de brouillard). */}
      <directionalLight
        ref={sunRef}
        position={[-4, 6, 2]}
        intensity={1.6}
        color="#eef0e2"
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-bias={-0.0006}
        shadow-camera-left={-30}
        shadow-camera-right={30}
        shadow-camera-top={25}
        shadow-camera-bottom={-25}
        shadow-camera-near={0.5}
        shadow-camera-far={90}
      />
      <hemisphereLight args={["#dce8f2", "#4a5240", 0.65]} />
      <ambientLight intensity={0.15} />
    </>
  );
}

/* Brouillard qui recule à mesure que la clairière s'approche — la
   profondeur atmosphérique de la forêt dense au départ, l'ouverture de la
   clairière ensuite. */
function AtmosphereFog({ progressRef }: { progressRef: React.RefObject<number> }) {
  useFrame(({ scene }) => {
    const raw = Math.min(1, Math.max(0, progressRef.current));
    const openT = Math.max(0, Math.min(1, (raw - 0.3) / 0.45));
    const fog = scene.fog as THREE.Fog | null;
    if (fog) {
      fog.far = THREE.MathUtils.lerp(15, 42, easeInOutCubic(openT));
    }
  });
  return null;
}

function CameraRig({ progressRef }: { progressRef: React.RefObject<number> }) {
  useFrame(({ camera }) => {
    const raw = Math.min(1, Math.max(0, progressRef.current));
    const travelT = Math.min(1, raw / 0.85);
    const z = THREE.MathUtils.lerp(6.5, -15, easeInOutCubic(travelT));
    camera.position.set(0, 1.5, z);
    camera.lookAt(0, 1.15, z - 10);
  });
  return null;
}

export default function ForestScene({ progressRef }: { progressRef: React.RefObject<number> }) {
  return (
    <div className="absolute inset-0">
      <Canvas shadows dpr={[1, 2]} camera={{ position: [0, 1.5, 6.5], fov: 52 }} gl={{ antialias: true }}>
        <color attach="background" args={[SKY_COLOR]} />
        <fog attach="fog" args={[SKY_COLOR, 6, 15]} />
        <Suspense fallback={null}>
          <NaturalLight progressRef={progressRef} />
          <AtmosphereFog progressRef={progressRef} />
          <CameraRig progressRef={progressRef} />
          <Forest progressRef={progressRef} />
          <Lake />
          <Ground />
        </Suspense>
      </Canvas>
    </div>
  );
}
