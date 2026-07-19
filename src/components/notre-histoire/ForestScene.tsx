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
 * Quatrième passe — recadrage important du client : "le concept est déjà
 * validé [...] je ne cherche plus une nouvelle idée. Ne cherche plus à
 * inventer. Cherche à perfectionner." Le déroulé (forêt → la caméra
 * avance → les arbres s'écartent → le lac → les trois cartes gammes
 * au-dessus du lac → le scroll continue) est figé. Deux choses de la
 * passe précédente sont donc retirées, pas parce qu'elles étaient ratées
 * techniquement, mais parce qu'elles ajoutaient des éléments non demandés
 * ("je ne veux pas de nouvelles montagnes, de nouvelles maisons
 * simplifiées, de nouveaux concepts ou de nouvelles cartes") :
 *
 * - **Les trois volumes architecturaux ont disparu.** "Les espèces de
 *   cubes blancs [...] ça casse tout." Le client a raison : une maison
 *   Bellora réduite à une boîte + une dalle retire de la valeur à la vraie
 *   photo. La règle qu'il pose est nette — "soit on montre les vraies
 *   maisons, soit on ne montre rien, mais certainement pas des cubes." Ici
 *   : on ne montre rien dans la scène 3D elle-même. Les vraies maisons
 *   reviennent via trois cartes DOM au-dessus du lac (`NotreHistoire.tsx`,
 *   `GAMMES` de `lib/gammes.ts`) — "les cartes existent déjà", donc aucune
 *   nouvelle carte n'est inventée ici, seulement leur mise en scène.
 * - **Toute idée de montagne à l'horizon est abandonnée** avant même
 *   d'être codée — proposée dans un concept intermédiaire, explicitement
 *   refusée par le client au tour suivant ("je ne veux pas de nouvelles
 *   montagnes").
 *
 * Le reste (corridor statique, caméra seule en mouvement, arbres en
 * `LatheGeometry`, lac en miroir) est conservé dans son principe — la
 * consigne est d'en perfectionner l'exécution (matière, lumière, teintes,
 * minutage), pas de le réinventer une quatrième fois. Arbres légèrement
 * affinés (profils plus étroits) et réduits à sept (neuf → sept) pour
 * plus d'air et un budget de rendu plus serré ; la caméra s'arrête
 * maintenant au-dessus du lac (`z = -19`, là où se joue la révélation des
 * cartes) plutôt que de continuer vers l'ancien emplacement des maisons.
 * Performance explicitement prioritaire sur tout raffinement visuel en
 * cas de conflit — d'où la suppression nette plutôt qu'un simple
 * allègement des trois volumes, qui étaient le poste le plus coûteux de
 * la scène (douze meshes, matériaux transparents mutés à chaque frame).
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
    new THREE.Vector2(0.36, 0.07),
    new THREE.Vector2(0.23, 0.66),
    new THREE.Vector2(0.08, 1.08),
    new THREE.Vector2(0, 1.22),
  ],
  8
);

const roundedCanopyGeometry = new THREE.LatheGeometry(
  [
    new THREE.Vector2(0, 0),
    new THREE.Vector2(0.32, 0.1),
    new THREE.Vector2(0.46, 0.44),
    new THREE.Vector2(0.4, 0.76),
    new THREE.Vector2(0.16, 0.96),
    new THREE.Vector2(0, 1.04),
  ],
  9
);

const slenderCanopyGeometry = new THREE.LatheGeometry(
  [
    new THREE.Vector2(0, 0),
    new THREE.Vector2(0.12, 0.05),
    new THREE.Vector2(0.1, 0.98),
    new THREE.Vector2(0.035, 1.44),
    new THREE.Vector2(0, 1.52),
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
  const trees = useMemo(() => generateTrees(7), []);
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
    const z = THREE.MathUtils.lerp(6.5, -19, eased);
    const y = THREE.MathUtils.lerp(1.5, 1.85, eased);
    camera.position.set(0, y, z);
    camera.lookAt(0, 1.05, z - 8);
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
        </Suspense>
      </Canvas>
    </div>
  );
}
