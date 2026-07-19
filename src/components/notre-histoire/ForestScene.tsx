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
 * Deuxième passe sur la forêt Bellora — pas un nouveau concept, un passage
 * du "ça fonctionne" au "c'est beau" sur demande explicite du client :
 * "visualisation d'architecture premium, pas jeu vidéo low poly". Rôle
 * volontairement limité à quatre leviers — matériaux, lumière, atmosphère,
 * profondeur — jamais de particules, de bloom, de lens flare ni
 * d'animation gadget.
 *
 * Palette repensée : d'un vert saturé/sol gris vers une identité
 * scandinave — ciel crème, verts désaturés, troncs chauds, lumière basse
 * et dorée de fin d'après-midi plutôt qu'un blanc neutre uniforme.
 *
 * Trois archétypes d'arbres (conifère / feuillu arrondi / colonnaire
 * élancé) au lieu d'un seul gabarit répété — géométries et matériaux
 * définis une seule fois au niveau du module et partagés par toutes les
 * instances (perf : un seul jeu de buffers GPU pour 15 arbres, pas 15
 * jeux dupliqués).
 *
 * Le lac devient le point focal ("le lac pourrait devenir le héros") :
 * `MeshReflectorMaterial` (drei) pour un miroir calme et flou plutôt
 * qu'un plan mat — reflète le ciel et les arbres, pas de vagues.
 */
type TreeKind = "conifer" | "rounded" | "slender";

type TreeSpec = {
  kind: TreeKind;
  xNear: number;
  z: number;
  scale: number;
  partAmount: number;
  rotationY: number;
};

function pickKind(): TreeKind {
  const roll = Math.random();
  if (roll < 0.58) return "conifer";
  if (roll < 0.82) return "rounded";
  return "slender";
}

function generateTrees(count: number): TreeSpec[] {
  const trees: TreeSpec[] = [];
  for (let i = 0; i < count; i++) {
    const side = i % 2 === 0 ? -1 : 1;
    const z = 3 - (i / count) * 26 + (Math.random() - 0.5) * 2.4;
    const xNear = side * (1.05 + Math.random() * 0.9);
    trees.push({
      kind: pickKind(),
      xNear,
      z,
      scale: 0.82 + Math.random() * 0.5,
      partAmount: 1.3 + Math.random() * 1.1,
      rotationY: Math.random() * Math.PI * 2,
    });
  }
  return trees;
}

/* Géométries et matériaux partagés au niveau du module — un seul jeu par
   archétype plutôt qu'un jeu par instance (15 arbres ne créent donc que
   trois familles de buffers GPU, pas quinze copies). */
const conifierTrunkGeo = new THREE.CylinderGeometry(0.045, 0.085, 1, 5);
const conifierCanopyLowGeo = new THREE.ConeGeometry(0.5, 1.02, 5);
const conifierCanopyHighGeo = new THREE.ConeGeometry(0.33, 0.82, 5);

const roundedTrunkGeo = new THREE.CylinderGeometry(0.05, 0.09, 0.62, 5);
const roundedCanopyGeo = new THREE.IcosahedronGeometry(0.6, 0);

const slenderTrunkGeo = new THREE.CylinderGeometry(0.032, 0.058, 1.1, 5);
const slenderCanopyGeo = new THREE.ConeGeometry(0.27, 1.5, 5);

const trunkMaterial = new THREE.MeshStandardMaterial({
  color: "#8a6a4a",
  roughness: 0.88,
  flatShading: true,
});
const canopyLowMaterial = new THREE.MeshStandardMaterial({
  color: "#78876a",
  roughness: 0.82,
  flatShading: true,
});
const canopyHighMaterial = new THREE.MeshStandardMaterial({
  color: "#8c9a7c",
  roughness: 0.82,
  flatShading: true,
});
const canopyRoundedMaterial = new THREE.MeshStandardMaterial({
  color: "#828f6e",
  roughness: 0.8,
  flatShading: true,
});

function Tree({ spec, progressRef }: { spec: TreeSpec; progressRef: React.RefObject<number> }) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame(() => {
    if (!groupRef.current) return;
    const raw = Math.min(1, Math.max(0, progressRef.current));
    const partT = Math.max(0, Math.min(1, (raw - 0.2) / 0.35));
    const partEased = easeInOutCubic(partT);
    const x = spec.xNear + Math.sign(spec.xNear) * partEased * spec.partAmount;
    groupRef.current.position.x = x;
  });

  return (
    <group
      ref={groupRef}
      position={[spec.xNear, 0, spec.z]}
      scale={spec.scale}
      rotation={[0, spec.rotationY, 0]}
    >
      {spec.kind === "conifer" && (
        <>
          <mesh geometry={conifierTrunkGeo} material={trunkMaterial} position={[0, 0.5, 0]} castShadow />
          <mesh
            geometry={conifierCanopyLowGeo}
            material={canopyLowMaterial}
            position={[0, 1.12, 0]}
            castShadow
          />
          <mesh
            geometry={conifierCanopyHighGeo}
            material={canopyHighMaterial}
            position={[0, 1.7, 0]}
            castShadow
          />
        </>
      )}
      {spec.kind === "rounded" && (
        <>
          <mesh geometry={roundedTrunkGeo} material={trunkMaterial} position={[0, 0.31, 0]} castShadow />
          <mesh
            geometry={roundedCanopyGeo}
            material={canopyRoundedMaterial}
            position={[0, 0.98, 0]}
            castShadow
          />
        </>
      )}
      {spec.kind === "slender" && (
        <>
          <mesh geometry={slenderTrunkGeo} material={trunkMaterial} position={[0, 0.55, 0]} castShadow />
          <mesh
            geometry={slenderCanopyGeo}
            material={canopyHighMaterial}
            position={[0, 1.6, 0]}
            castShadow
          />
        </>
      )}
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

/* Le lac, point focal de la scène : un miroir calme et flou plutôt qu'un
   plan mat. `MeshReflectorMaterial` (drei) reflète le ciel et les arbres
   en temps réel avec un flou léger (`mixBlur` modéré, pas un `mixBlur`
   élevé qui lave la réflexion jusqu'à l'uniformité — premier réglage
   trouvé trop flou à l'écran, le lac ne se distinguait plus du sol).
   Teinte volontairement plus fraîche/bleutée que le reste de la palette
   chaude — un vrai plan d'eau lit toujours un peu plus froid que la terre
   et le ciel autour, c'est ce contraste doux qui le rend lisible comme eau
   plutôt que comme un patch de terrain pâle. */
function Lake() {
  const geometry = useMemo(() => new THREE.CircleGeometry(9, 48), []);
  return (
    <mesh
      geometry={geometry}
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, 0.03, -24]}
      receiveShadow
    >
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

/* Sol forestier — un unique plan continu, largement plus grand que la
   course de la caméra et que la portée maximale du brouillard, pour que
   son bord physique reste toujours noyé dans le brouillard plutôt que de
   créer une ligne d'horizon nette. */
function Ground() {
  const geometry = useMemo(() => new THREE.PlaneGeometry(70, 130), []);
  const material = useMemo(
    () => new THREE.MeshStandardMaterial({ color: "#8c8a70", roughness: 1 }),
    []
  );
  return (
    <mesh geometry={geometry} material={material} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -18]} receiveShadow />
  );
}

/* Lumière naturelle — un soleil bas et doré de fin d'après-midi plutôt
   qu'un blanc neutre en surplomb (demande explicite : "lumière chaude et
   cinématographique", jamais "blanche et uniforme"). Les deux teintes
   entre lesquelles le soleil transitionne sont toutes deux chaudes — la
   forêt dense n'est jamais froide, seule l'ampleur/l'intensité change à
   l'approche de la clairière. Le frustum de la shadow camera est explicite
   (défaut Three.js : une boîte orthographique d'environ ±5 unités, trop
   petite pour un sol de 70×130) — sans ces bornes, tout ce qui tombe hors
   de la petite boîte par défaut échantillonne un texel de bord au hasard
   sur la shadow map, ce qui produisait une bande horizontale sombre et
   nette à l'horizon (bug trouvé à l'écran). L'ambiant et l'hémisphère sont
   relevés pour adoucir le contraste des ombres, jugées trop dures. */
function NaturalLight({ progressRef }: { progressRef: React.RefObject<number> }) {
  const sunRef = useRef<THREE.DirectionalLight>(null);
  const lateColor = useMemo(() => new THREE.Color("#fff3da"), []);
  const earlyColor = useMemo(() => new THREE.Color("#ffcf8a"), []);
  const tmpColor = useMemo(() => new THREE.Color(), []);

  useFrame(() => {
    if (!sunRef.current) return;
    const raw = Math.min(1, Math.max(0, progressRef.current));
    const warmT = Math.max(0, Math.min(1, (raw - 0.45) / 0.4));
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
        shadow-camera-far={90}
      />
      <hemisphereLight args={["#f7ecd9", "#8c8a70", 0.6]} />
      <ambientLight intensity={0.32} />
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
      <Canvas shadows="soft" dpr={[1, 2]} camera={{ position: [0, 1.5, 6.5], fov: 52 }} gl={{ antialias: true }}>
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
