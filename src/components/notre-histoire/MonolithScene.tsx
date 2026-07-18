"use client";

import { Suspense, useEffect, useMemo, useRef } from "react";
import { Canvas } from "@react-three/fiber";
import * as THREE from "three";
import { RectAreaLightUniformsLib } from "three/examples/jsm/lights/RectAreaLightUniformsLib.js";

RectAreaLightUniformsLib.init();

const VOID_COLOR = "#0d0a08";
const OBJECT_COLOR = "#2a2116";

/**
 * Itération 1 d'un chantier délibérément fractionné en plusieurs passes
 * (demande explicite du client : "consacrer plusieurs itérations
 * uniquement à la composition, aux matériaux, à la lumière et au
 * mouvement avant d'ajouter la moindre complexité"). Cette scène ne
 * construit que le tout premier temps du récit fusionné validé — "Objet →
 * Mystère → Ouverture → Révélation → Maison" — c'est-à-dire uniquement
 * l'état "Objet" : un volume unique, fermé, au repos. Pas de couture, pas
 * d'ouverture, pas de scroll : composition/matière/lumière d'abord, tout le
 * reste ensuite.
 *
 * Remplace entièrement l'ancienne coquille architecturale (RoomShell,
 * HouseScene.tsx, supprimé) — jugée par le client comme une "boîte vide"
 * qui ne racontait rien. Aucune ligne de cette version précédente n'est
 * réutilisée.
 */
function roundedRectShape(width: number, height: number, radius: number) {
  const w = width / 2;
  const h = height / 2;
  const shape = new THREE.Shape();
  shape.moveTo(-w + radius, -h);
  shape.lineTo(w - radius, -h);
  shape.quadraticCurveTo(w, -h, w, -h + radius);
  shape.lineTo(w, h - radius);
  shape.quadraticCurveTo(w, h, w - radius, h);
  shape.lineTo(-w + radius, h);
  shape.quadraticCurveTo(-w, h, -w, h - radius);
  shape.lineTo(-w, -h + radius);
  shape.quadraticCurveTo(-w, -h, -w + radius, -h);
  return shape;
}

/* Écrin — "un volume très pur, presque monolithique" (demande explicite).
   Un écrin debout plutôt qu'un cube : proportions verticales élancées,
   arêtes légèrement adoucies (bevel), pas de couture visible à ce stade —
   elle n'apparaîtra qu'au moment de l'ouverture, dans une itération
   ultérieure. */
function Monolith() {
  const geometry = useMemo(() => {
    // Proportions resserrées vers un monolithe élancé plutôt qu'une dalle
    // large — "presque monolithique" (demande explicite), un rapport
    // largeur/hauteur plus proche d'un objet dressé que d'un smartphone
    // posé à plat.
    const shape = roundedRectShape(1.05, 2.3, 0.045);
    const geo = new THREE.ExtrudeGeometry(shape, {
      depth: 0.78,
      bevelEnabled: true,
      bevelThickness: 0.016,
      bevelSize: 0.016,
      bevelSegments: 6,
      curveSegments: 32,
    });
    geo.center();
    return geo;
  }, []);

  return (
    <mesh geometry={geometry} castShadow receiveShadow>
      <meshPhysicalMaterial
        color={OBJECT_COLOR}
        roughness={0.32}
        metalness={0.02}
        clearcoat={0.35}
        clearcoatRoughness={0.18}
      />
    </mesh>
  );
}

/* Sol très sombre, à peine plus clair que le vide qui l'entoure — juste
   assez pour recevoir une ombre de contact douce et faire sentir que
   l'objet est "posé" (demande explicite), pas en apesanteur. */
function Ground() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.28, 0]} receiveShadow>
      <planeGeometry args={[14, 14]} />
      <meshStandardMaterial color="#0a0806" roughness={1} />
    </mesh>
  );
}

/* Clé chaude en source rectangulaire ("softbox"), pas directionnelle. Sur
   une face plane, une lumière directionnelle (rayons parallèles) donne un
   reflet spéculaire uniforme sur toute la face — d'où le tout premier
   essai "lavé" plutôt que dessiné. Une RectAreaLight a une position et une
   taille réelles : son reflet se contient naturellement en un dégradé
   localisé le long d'une arête, comme un panneau de studio photo produit
   plutôt qu'un plein soleil. */
function KeyRectLight() {
  const ref = useRef<THREE.RectAreaLight>(null);
  useEffect(() => {
    ref.current?.lookAt(0, 0.15, 0);
  }, []);

  return (
    <rectAreaLight
      ref={ref}
      position={[-3.6, 1.3, 2.0]}
      width={0.9}
      height={2.6}
      intensity={60}
      color="#ffd9a8"
    />
  );
}

/* Contre-jour froid et très faible depuis l'arrière, pour que le bord
   opposé à la clé reste lisible sans jamais éclairer la face ; un ambiant
   discret pour que la couleur de base du volume se lise même hors du
   reflet ; une zénithale douce qui porte l'ombre de contact sous l'objet
   (la RectAreaLight ne projette pas d'ombre en temps réel dans three.js). */
function StudioLight() {
  return (
    <>
      <KeyRectLight />
      <directionalLight position={[3.2, 0.8, -3.4]} intensity={1} color="#dbe4f2" />
      <ambientLight intensity={0.35} />
      <directionalLight
        position={[-1.2, 5, 1.4]}
        intensity={0.45}
        color="#f3ead9"
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-bias={-0.0005}
      />
    </>
  );
}

export default function MonolithScene() {
  return (
    <div className="absolute inset-0">
      <Canvas
        shadows
        dpr={[1, 2]}
        camera={{ position: [0, 0.28, 8.2], fov: 30 }}
        gl={{ antialias: true }}
      >
        <color attach="background" args={[VOID_COLOR]} />
        <fogExp2 attach="fog" args={[VOID_COLOR, 0.045]} />
        <Suspense fallback={null}>
          <StudioLight />
          <Monolith />
          <Ground />
        </Suspense>
      </Canvas>
    </div>
  );
}
