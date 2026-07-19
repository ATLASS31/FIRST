"use client";

import { Suspense, useEffect, useMemo, useRef } from "react";
import { Canvas } from "@react-three/fiber";
import * as THREE from "three";
import { RectAreaLightUniformsLib } from "three/examples/jsm/lights/RectAreaLightUniformsLib.js";

RectAreaLightUniformsLib.init();

const VOID_COLOR = "#0d0a08";
const OBJECT_COLOR = "#2a2116";

/**
 * Itération 1 d'un chantier délibérément fractionné en plusieurs passes —
 * toujours uniquement le premier temps du récit validé ("Objet"), toujours
 * sans couture, sans scroll. Silhouette tranchée : trois variantes réelles
 * ("La Stèle" ici, "Le Fuseau" effilé, "Le Biseau" à sommet incliné) ont
 * été construites et comparées côte à côte, même matière/lumière/
 * composition, avant de choisir. Recommandation donnée en faveur du
 * Biseau (silhouette la plus reconnaissable et la plus évocatrice
 * d'architecture) mais le client a tranché explicitement pour "La Stèle"
 * ("franchement je valide A") — c'est cette géométrie qui reste, les deux
 * autres n'ont existé que le temps du comparatif, jamais committées.
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

/* Grain de bois procédural, deux fréquences superposées (larges bandes
   douces pour la profondeur du veinage + traits fins et nets pour le
   micro-détail) — "presque imperceptible mais présent" (demande
   explicite). Toujours généré localement, aucune texture externe. */
function createWoodGrainTexture(): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 128;
  canvas.height = 512;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "rgb(140,140,140)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Bandes larges, douces — la profondeur du veinage.
  for (let i = 0; i < 26; i++) {
    const x = Math.random() * canvas.width;
    const w = 6 + Math.random() * 14;
    const alpha = 0.03 + Math.random() * 0.05;
    const dark = Math.random() > 0.5;
    ctx.fillStyle = dark ? `rgba(0,0,0,${alpha})` : `rgba(255,255,255,${alpha})`;
    ctx.fillRect(x - w / 2, 0, w, canvas.height);
  }

  // Traits fins, nets — le micro-détail.
  for (let i = 0; i < 320; i++) {
    const x = Math.random() * canvas.width;
    const dark = Math.random() > 0.46;
    const alpha = 0.05 + Math.random() * 0.13;
    ctx.strokeStyle = dark ? `rgba(0,0,0,${alpha})` : `rgba(255,255,255,${alpha})`;
    ctx.lineWidth = 0.3 + Math.random() * 1.3;
    const wobble = (Math.random() - 0.5) * 10;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.bezierCurveTo(
      x + wobble * 0.3,
      canvas.height * 0.33,
      x - wobble * 0.3,
      canvas.height * 0.66,
      x + wobble * 0.15,
      canvas.height
    );
    ctx.stroke();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(2, 1);
  return texture;
}

/* Écrin — "La Stèle", silhouette validée par le client : corps élancé sur
   un socle légèrement plus large, séparés d'un fin joint creux (proportion
   de plinthe, "ne pas être littéral" demande explicite). Chanfreins
   présents, arête qui accroche la lumière. */
function Monolith() {
  const grain = useMemo(() => createWoodGrainTexture(), []);

  const bodyWidth = 1.15;
  const bodyHeight = 1.72;
  const bodyDepth = 0.95;
  const baseWidth = 1.24;
  const baseHeight = 0.32;
  const baseDepth = 1.02;
  const gap = 0.022;
  const levitate = 0.035;

  const bodyGeometry = useMemo(() => {
    const shape = roundedRectShape(bodyWidth, bodyHeight, 0.055);
    const geo = new THREE.ExtrudeGeometry(shape, {
      depth: bodyDepth,
      bevelEnabled: true,
      bevelThickness: 0.05,
      bevelSize: 0.05,
      bevelSegments: 10,
      curveSegments: 32,
    });
    geo.center();
    return geo;
  }, []);

  const baseGeometry = useMemo(() => {
    const shape = roundedRectShape(baseWidth, baseHeight, 0.05);
    const geo = new THREE.ExtrudeGeometry(shape, {
      depth: baseDepth,
      bevelEnabled: true,
      bevelThickness: 0.045,
      bevelSize: 0.045,
      bevelSegments: 10,
      curveSegments: 32,
    });
    geo.center();
    return geo;
  }, []);

  const material = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: new THREE.Color(OBJECT_COLOR),
        roughness: 0.34,
        roughnessMap: grain,
        bumpMap: grain,
        bumpScale: 0.002,
        metalness: 0.02,
        clearcoat: 0.68,
        clearcoatRoughness: 0.07,
      }),
    [grain]
  );

  const groundY = -1.28;
  const baseY = groundY + levitate + baseHeight / 2;
  const bodyY = baseY + baseHeight / 2 + gap + bodyHeight / 2;

  return (
    <group>
      <mesh geometry={bodyGeometry} material={material} position={[0, bodyY, 0]} castShadow receiveShadow />
      <mesh geometry={baseGeometry} material={material} position={[0, baseY, 0]} castShadow receiveShadow />
    </group>
  );
}

/* Sol très sombre — l'objet lévite de quelques millimètres au-dessus,
   juste assez pour qu'un fin trait de vide sépare son ombre de contact du
   socle lui-même. */
function Ground() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.28, 0]} receiveShadow>
      <planeGeometry args={[14, 14]} />
      <meshStandardMaterial color="#0a0806" roughness={1} />
    </mesh>
  );
}

/* Halo atmosphérique — un unique sprite en dégradé radial, en fusion
   additive, placé derrière l'objet du côté de la clé lumineuse. */
function createHaloTexture(): THREE.CanvasTexture {
  const size = 256;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  gradient.addColorStop(0, "rgba(255,214,163,0.55)");
  gradient.addColorStop(0.45, "rgba(255,214,163,0.16)");
  gradient.addColorStop(1, "rgba(255,214,163,0)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);
  return new THREE.CanvasTexture(canvas);
}

function Halo() {
  const texture = useMemo(() => createHaloTexture(), []);
  return (
    <mesh position={[-1.1, 0.65, -1.9]}>
      <planeGeometry args={[3.4, 3.4]} />
      <meshBasicMaterial
        map={texture}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  );
}

/* Lumière sculpturale — deux lames étroites plutôt qu'une seule, chacune
   dédiée à une arête différente ("qui révèle les arêtes plutôt qu'elle
   n'éclaire l'objet", demande explicite). La clé (gauche, chaude, forte)
   reste dominante ; une deuxième lame beaucoup plus faible et froide vient
   dessiner un second reflet sur le bord opposé — la forme se lit par ses
   arêtes, pas par un dégradé unique sur la face. */
function KeyRectLight() {
  const ref = useRef<THREE.RectAreaLight>(null);
  useEffect(() => {
    ref.current?.lookAt(0, 0.1, 0);
  }, []);

  return (
    <rectAreaLight
      ref={ref}
      position={[-2.2, 1.0, 2.6]}
      width={0.16}
      height={2.5}
      intensity={420}
      color="#ffd9a8"
    />
  );
}

function RimRectLight() {
  const ref = useRef<THREE.RectAreaLight>(null);
  useEffect(() => {
    ref.current?.lookAt(0, 0.05, 0);
  }, []);

  return (
    <rectAreaLight
      ref={ref}
      position={[2.6, 0.7, 1.6]}
      width={0.12}
      height={2.2}
      intensity={70}
      color="#cfe0f0"
    />
  );
}

function StudioLight() {
  return (
    <>
      <KeyRectLight />
      <RimRectLight />
      <ambientLight intensity={0.018} />
      <directionalLight
        position={[-1.2, 5, 1.4]}
        intensity={0.13}
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
        camera={{ position: [0, 0.26, 6.7], fov: 30 }}
        gl={{ antialias: true }}
      >
        <color attach="background" args={[VOID_COLOR]} />
        <fogExp2 attach="fog" args={[VOID_COLOR, 0.055]} />
        <Suspense fallback={null}>
          <StudioLight />
          <Halo />
          <Monolith />
          <Ground />
        </Suspense>
      </Canvas>
      {/* Vignettage CSS — guide l'œil vers le centre du cadre, aucun coût
          de rendu WebGL. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 75% 70% at 50% 46%, transparent 42%, rgba(0,0,0,0.48) 100%)",
        }}
      />
    </div>
  );
}
