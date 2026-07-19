"use client";

import { Suspense, useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { MeshReflectorMaterial } from "@react-three/drei";
import * as THREE from "three";

const SKY_COLOR = "#f4ead9";

function easeInOutCubic(t: number) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

/**
 * Troisième passe sur la forêt Bellora — pas un changement de matériaux
 * cette fois, un changement de référence. Retour explicite du client : la
 * traversée fonctionne comme narration, mais l'exécution "évoque un
 * prototype Blender ou Unity", pas une visualisation d'architecture. Deux
 * décisions structurantes en plus de la question esthétique :
 *
 * 1. **Fin de séquence repensée.** Plus de panneau Liquid Glass "20 ans
 *    de garantie" (ce chiffre existe déjà ailleurs sur le site —
 *    `SavoirFaire.tsx`, `Procede.tsx` — rien n'est perdu à l'enlever
 *    d'ici). À la place : trois volumes architecturaux très simples
 *    émergent dans la clairière, au-delà du lac — Primaire, Premium,
 *    Prestige, sans étiquette ni texte ("je ne veux pas d'un décor, je
 *    veux une ambiance"). `NotreHistoire.tsx` place cette section juste
 *    au-dessus de `GammesPreview` sur la page d'accueil : la séquence
 *    devient la transition naturelle vers les vraies fiches gamme
 *    (nom, visuel, lien) plutôt qu'un doublon d'information.
 * 2. **Les arbres ne glissent plus.** Demande explicite : "imagine que la
 *    caméra avance, et que les arbres s'écartent naturellement comme si
 *    le chemin existait déjà". Le corridor est donc statique — chaque
 *    arbre a une position fixe, resserrée près de l'entrée et de plus en
 *    plus large en profondeur — et seule la caméra avance. Aucun arbre
 *    n'anime plus sa position au scroll (l'ancien `useFrame` par arbre a
 *    disparu) : le mouvement perçu vient uniquement du déplacement de la
 *    caméra à travers un lieu qui existait déjà, jamais d'un objet qui se
 *    déplace lui-même — plus sobre et, concrètement, moins de travail par
 *    frame (neuf arbres statiques plutôt que quinze qui écrivent leur
 *    position à chaque frame).
 *
 * Sur l'esthétique elle-même — "les arbres doivent devenir des objets de
 * design", référence Luxigon/Apple plutôt que "low poly" — les arbres ne
 * sont plus des empilements de primitives standard (cône + cône +
 * cylindre) mais des silhouettes dessinées au profil (`LatheGeometry`,
 * tronc et couronne chacun un seul profil 2D révolu) : une forme sculptée
 * continue plutôt que des pièces de kit assemblées. Le nombre d'arbres est
 * réduit (quinze → neuf) et l'espacement augmenté — "le paysage doit être
 * extrêmement minimaliste" — pour que chaque silhouette se lise comme un
 * objet posé avec soin plutôt que comme un remplissage de décor.
 */

/* --- Géométries partagées, un seul jeu par forme, révolues au tour à
   partir d'un simple profil 2D plutôt qu'assemblées à partir de
   primitives (cône/cylindre/icosaèdre) empilées — la silhouette est
   dessinée une fois, comme un objet, pas construite pièce par pièce. */
const TRUNK_HEIGHT = 0.6;

const trunkGeometry = new THREE.LatheGeometry(
  [
    new THREE.Vector2(0, 0),
    new THREE.Vector2(0.055, 0),
    new THREE.Vector2(0.048, 0.34),
    new THREE.Vector2(0.036, TRUNK_HEIGHT),
  ],
  6
);

const conifierCanopyGeometry = new THREE.LatheGeometry(
  [
    new THREE.Vector2(0, 0),
    new THREE.Vector2(0.46, 0.07),
    new THREE.Vector2(0.29, 0.64),
    new THREE.Vector2(0.1, 1.02),
    new THREE.Vector2(0, 1.14),
  ],
  8
);

const roundedCanopyGeometry = new THREE.LatheGeometry(
  [
    new THREE.Vector2(0, 0),
    new THREE.Vector2(0.4, 0.1),
    new THREE.Vector2(0.58, 0.42),
    new THREE.Vector2(0.5, 0.72),
    new THREE.Vector2(0.2, 0.92),
    new THREE.Vector2(0, 1.0),
  ],
  9
);

const slenderCanopyGeometry = new THREE.LatheGeometry(
  [
    new THREE.Vector2(0, 0),
    new THREE.Vector2(0.16, 0.05),
    new THREE.Vector2(0.14, 0.92),
    new THREE.Vector2(0.05, 1.36),
    new THREE.Vector2(0, 1.44),
  ],
  6
);

const trunkMaterial = new THREE.MeshStandardMaterial({
  color: "#8a7358",
  roughness: 0.92,
  flatShading: true,
});
const conifierMaterial = new THREE.MeshStandardMaterial({
  color: "#76826a",
  roughness: 0.88,
  flatShading: true,
});
const roundedMaterial = new THREE.MeshStandardMaterial({
  color: "#7f8a70",
  roughness: 0.88,
  flatShading: true,
});
const slenderMaterial = new THREE.MeshStandardMaterial({
  color: "#6b7860",
  roughness: 0.88,
  flatShading: true,
});

type TreeKind = "conifer" | "rounded" | "slender";

const CANOPY_BY_KIND: Record<TreeKind, { geometry: THREE.LatheGeometry; material: THREE.MeshStandardMaterial }> = {
  conifer: { geometry: conifierCanopyGeometry, material: conifierMaterial },
  rounded: { geometry: roundedCanopyGeometry, material: roundedMaterial },
  slender: { geometry: slenderCanopyGeometry, material: slenderMaterial },
};

type TreeSpec = {
  kind: TreeKind;
  x: number;
  z: number;
  scale: number;
  rotationY: number;
};

/* Corridor statique : resserré près de l'entrée (t=0), largement ouvert
   vers la clairière (t=1) — "comme si le chemin existait déjà", rien
   n'anime plus la position d'un arbre au scroll. */
function generateTrees(count: number): TreeSpec[] {
  const kinds: TreeKind[] = ["conifer", "rounded", "slender"];
  const trees: TreeSpec[] = [];
  for (let i = 0; i < count; i++) {
    const side = i % 2 === 0 ? -1 : 1;
    const t = i / (count - 1);
    const z = 2.5 - t * 30 + (Math.random() - 0.5) * 1.6;
    const corridorHalfWidth = THREE.MathUtils.lerp(1.3, 3.6, t);
    const x = side * (corridorHalfWidth + Math.random() * 0.7);
    trees.push({
      kind: kinds[i % kinds.length],
      x,
      z,
      scale: THREE.MathUtils.lerp(0.98, 0.7, t) + (Math.random() - 0.5) * 0.1,
      rotationY: Math.random() * Math.PI * 2,
    });
  }
  return trees;
}

function Tree({ spec }: { spec: TreeSpec }) {
  const canopy = CANOPY_BY_KIND[spec.kind];
  return (
    <group position={[spec.x, 0, spec.z]} scale={spec.scale} rotation={[0, spec.rotationY, 0]}>
      <mesh geometry={trunkGeometry} material={trunkMaterial} castShadow />
      <mesh geometry={canopy.geometry} material={canopy.material} position={[0, TRUNK_HEIGHT, 0]} castShadow />
    </group>
  );
}

function Forest() {
  const trees = useMemo(() => generateTrees(9), []);
  return (
    <>
      {trees.map((spec, i) => (
        <Tree key={i} spec={spec} />
      ))}
    </>
  );
}

/* Le lac, point focal de la scène : un miroir calme qui reflète le ciel
   et les arbres, flouté pour rester apaisé plutôt que net. */
function Lake() {
  const geometry = useMemo(() => new THREE.CircleGeometry(9, 48), []);
  return (
    <mesh geometry={geometry} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, -24]} receiveShadow>
      <MeshReflectorMaterial
        resolution={512}
        blur={[140, 70]}
        mixBlur={2.2}
        mixStrength={1.6}
        mirror={0.55}
        roughness={0.35}
        color="#a9c2bd"
        metalness={0.1}
      />
    </mesh>
  );
}

function Ground() {
  const geometry = useMemo(() => new THREE.PlaneGeometry(70, 140), []);
  const material = useMemo(() => new THREE.MeshStandardMaterial({ color: "#8b8873", roughness: 1 }), []);
  return (
    <mesh geometry={geometry} material={material} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -20]} receiveShadow />
  );
}

/* Trois volumes architecturaux très simples — Primaire (un seul corps),
   Premium (un corps plus généreux), Prestige (deux corps, une aile
   attachée) — jamais plus qu'une boîte + une dalle de toit fine. Aucune
   étiquette : l'ambiance porte l'émotion, `GammesPreview` juste en
   dessous porte l'information. Elles "émergent" : opacité et une légère
   montée depuis le sol, toutes deux pilotées par la progression, jamais
   avant que la clairière ne soit largement ouverte. */
const wallMaterial = new THREE.MeshStandardMaterial({ color: "#e7ddc8", roughness: 0.82, transparent: true });
const roofMaterial = new THREE.MeshStandardMaterial({ color: "#3b3227", roughness: 0.55, transparent: true });

function House({
  position,
  scale,
  wing,
  progressRef,
}: {
  position: [number, number, number];
  scale: number;
  wing: boolean;
  progressRef: React.RefObject<number>;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const materials = useMemo(() => [wallMaterial.clone(), roofMaterial.clone(), wallMaterial.clone(), roofMaterial.clone()], []);

  useFrame(() => {
    if (!groupRef.current) return;
    const raw = Math.min(1, Math.max(0, progressRef.current));
    const revealT = easeInOutCubic(Math.max(0, Math.min(1, (raw - 0.78) / 0.22)));
    materials.forEach((m) => {
      m.opacity = revealT;
    });
    groupRef.current.position.y = position[1] + (1 - revealT) * -0.4;
  });

  return (
    <group ref={groupRef} position={position} scale={scale}>
      <mesh position={[0, 0.75, 0]} material={materials[0]} castShadow receiveShadow>
        <boxGeometry args={[3.0, 1.5, 2.0]} />
      </mesh>
      <mesh position={[0, 1.56, 0]} material={materials[1]} castShadow>
        <boxGeometry args={[3.34, 0.12, 2.34]} />
      </mesh>
      {wing && (
        <>
          <mesh position={[2.1, 0.5, 0.3]} material={materials[2]} castShadow receiveShadow>
            <boxGeometry args={[1.9, 1.0, 1.7]} />
          </mesh>
          <mesh position={[2.1, 1.06, 0.3]} material={materials[3]} castShadow>
            <boxGeometry args={[2.2, 0.1, 2.0]} />
          </mesh>
        </>
      )}
    </group>
  );
}

function HouseCluster({ progressRef }: { progressRef: React.RefObject<number> }) {
  return (
    <>
      <House position={[-5.6, 0, -43]} scale={0.85} wing={false} progressRef={progressRef} />
      <House position={[0.6, 0, -48]} scale={1.08} wing={true} progressRef={progressRef} />
      <House position={[6.2, 0, -44]} scale={0.96} wing={false} progressRef={progressRef} />
    </>
  );
}

/* Lumière naturelle — un soleil bas et doré de fin d'après-midi, pensé
   comme un éclairage de photographie d'architecture : diffus, ombres
   adoucies (`shadow-radius`, `Canvas shadows="soft"`), jamais un
   projecteur dur. Le frustum de la shadow camera est explicite (défaut
   Three.js : une boîte orthographique d'environ ±5 unités, trop petite
   pour un sol de 70×140). */
function NaturalLight({ progressRef }: { progressRef: React.RefObject<number> }) {
  const sunRef = useRef<THREE.DirectionalLight>(null);
  const lateColor = useMemo(() => new THREE.Color("#fff3da"), []);
  const earlyColor = useMemo(() => new THREE.Color("#ffcf8a"), []);
  const tmpColor = useMemo(() => new THREE.Color(), []);

  useFrame(() => {
    if (!sunRef.current) return;
    const raw = Math.min(1, Math.max(0, progressRef.current));
    const warmT = Math.max(0, Math.min(1, (raw - 0.35) / 0.45));
    sunRef.current.intensity = THREE.MathUtils.lerp(1.9, 2.6, warmT);
    tmpColor.copy(earlyColor).lerp(lateColor, warmT);
    sunRef.current.color.copy(tmpColor);
  });

  return (
    <>
      <directionalLight
        ref={sunRef}
        position={[-9, 3.6, 4]}
        intensity={1.9}
        color="#ffcf8a"
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-bias={-0.0006}
        shadow-radius={4}
        shadow-camera-left={-30}
        shadow-camera-right={30}
        shadow-camera-top={25}
        shadow-camera-bottom={-25}
        shadow-camera-near={0.5}
        shadow-camera-far={100}
      />
      <hemisphereLight args={["#f7ecd9", "#8b8873", 0.6]} />
      <ambientLight intensity={0.32} />
    </>
  );
}

function AtmosphereFog({ progressRef }: { progressRef: React.RefObject<number> }) {
  useFrame(({ scene }) => {
    const raw = Math.min(1, Math.max(0, progressRef.current));
    const openT = Math.max(0, Math.min(1, (raw - 0.25) / 0.5));
    const fog = scene.fog as THREE.Fog | null;
    if (fog) {
      fog.far = THREE.MathUtils.lerp(15, 46, easeInOutCubic(openT));
    }
  });
  return null;
}

/* La caméra est le seul élément qui bouge dans toute la scène — "un
   geste lent, calme et parfaitement maîtrisé". Elle avance sur toute la
   course du scroll (pas d'arrêt anticipé) avec une légère montée en fin
   de parcours, comme si elle survolait doucement le lac pour découvrir
   la clairière. */
function CameraRig({ progressRef }: { progressRef: React.RefObject<number> }) {
  useFrame(({ camera }) => {
    const raw = Math.min(1, Math.max(0, progressRef.current));
    const eased = easeInOutCubic(raw);
    const z = THREE.MathUtils.lerp(6.5, -24, eased);
    const y = THREE.MathUtils.lerp(1.5, 1.9, eased);
    camera.position.set(0, y, z);
    camera.lookAt(0, 1.05, z - 9);
  });
  return null;
}

export default function ForestScene({ progressRef }: { progressRef: React.RefObject<number> }) {
  return (
    <div className="absolute inset-0">
      <Canvas shadows="soft" dpr={[1, 2]} camera={{ position: [0, 1.5, 6.5], fov: 52 }} gl={{ antialias: true }}>
        <color attach="background" args={[SKY_COLOR]} />
        <fog attach="fog" args={[SKY_COLOR, 6, 15]} />
        <Suspense fallback={null}>
          <NaturalLight progressRef={progressRef} />
          <AtmosphereFog progressRef={progressRef} />
          <CameraRig progressRef={progressRef} />
          <Forest />
          <Lake />
          <Ground />
          <HouseCluster progressRef={progressRef} />
        </Suspense>
      </Canvas>
    </div>
  );
}
