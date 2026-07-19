"use client";

import { Suspense, useEffect, useMemo, useRef } from "react";
import { Canvas } from "@react-three/fiber";
import * as THREE from "three";
import { RectAreaLightUniformsLib } from "three/examples/jsm/lights/RectAreaLightUniformsLib.js";

RectAreaLightUniformsLib.init();

const VOID_COLOR = "#0d0a08";
const OBJECT_COLOR = "#2a2116";

/**
 * Itération 1 d'un chantier délibérément fractionné en plusieurs passes,
 * deuxième passe de réglage. Toujours uniquement le premier temps du récit
 * validé — "Objet → Mystère → Ouverture → Révélation → Maison" — un volume
 * unique au repos, sans couture, sans scroll. Retour client détaillé après
 * la première version ("une planche, pas un objet iconique") : cette passe
 * ne change ni la narration ni la structure du chantier, seulement
 * l'exécution — proportions, matière, lumière, atmosphère, tension —
 * exactement le travail que le client a demandé de faire avant de passer à
 * la moindre animation.
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

/* Grain de bois procédural, très discret — dessiné une fois sur un canvas
   hors-écran plutôt qu'importé (aucune texture externe à charger, cohérent
   avec l'absence de dépendance réseau déjà retenue pour l'éclairage). Fond
   gris moyen (= multiplicateur neutre pour roughnessMap/bumpMap), traits
   verticaux clairs et sombres à faible opacité pour un veinage qui ne se
   voit vraiment que là où la lumière rase la surface — jamais comme un
   motif imprimé. */
function createWoodGrainTexture(): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 128;
  canvas.height = 512;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "rgb(140,140,140)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  for (let i = 0; i < 260; i++) {
    const x = Math.random() * canvas.width;
    const dark = Math.random() > 0.48;
    const alpha = 0.05 + Math.random() * 0.12;
    ctx.strokeStyle = dark ? `rgba(0,0,0,${alpha})` : `rgba(255,255,255,${alpha})`;
    ctx.lineWidth = 0.4 + Math.random() * 1.6;
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

/* Écrin — deux volumes plutôt qu'un seul, séparés d'un fin joint creux :
   un socle légèrement plus large que le corps au-dessus, comme une
   plinthe. "Ne pas être littéral" (demande explicite) — ce n'est ni une
   maison ni une façade dessinée, juste la proportion classique d'un socle
   qui porte un corps, le genre de détail qui fait qu'un volume fermé
   évoque déjà une architecture plutôt qu'une boîte, un livre ou une
   enceinte. Chanfreins nettement plus présents qu'à la première passe
   (jugée "une planche") : l'arête doit accrocher la lumière, pas
   simplement exister. */
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
        roughness: 0.38,
        roughnessMap: grain,
        bumpMap: grain,
        bumpScale: 0.0015,
        metalness: 0.02,
        clearcoat: 0.55,
        clearcoatRoughness: 0.12,
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

/* Sol très sombre — l'objet lévite de quelques millimètres (échelle scène)
   au-dessus, juste assez pour qu'un fin trait de vide sépare son ombre de
   contact du socle lui-même ("comme s'il était précieux", demande
   explicite) sans pour autant paraître en apesanteur complète. */
function Ground() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.28, 0]} receiveShadow>
      <planeGeometry args={[14, 14]} />
      <meshStandardMaterial color="#0a0806" roughness={1} />
    </mesh>
  );
}

/* Halo atmosphérique — un unique sprite en dégradé radial, en fusion
   additive, placé derrière l'objet du côté de la clé lumineuse. Pas un
   élément supplémentaire à proprement parler ("je ne rajouterais surtout
   pas des éléments", demande explicite) : une ambiance, pas un objet — un
   seul plan, une seule texture générée localement, pour guider le regard
   plutôt que pour décorer. */
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

/* Lumière quasi entièrement construite autour d'une seule idée : ne
   révéler qu'une arête et laisser le reste disparaître ("presque comme
   une publicité Hermès ou B&O", demande explicite). La clé n'est plus un
   large panneau mais une lame étroite et rasante — un reflet net le long
   d'un bord plutôt qu'un dégradé large sur toute la face. Ambiant et
   contre-jour ramenés très bas : à la première passe ils avaient été
   remontés pour compenser un rendu trop sombre, au prix du contraste qui
   fait justement la dramaturgie recherchée ici. */
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
      intensity={400}
      color="#ffd9a8"
    />
  );
}

function StudioLight() {
  return (
    <>
      <KeyRectLight />
      <directionalLight position={[3.2, 0.8, -3.4]} intensity={0.05} color="#dbe4f2" />
      <ambientLight intensity={0.02} />
      <directionalLight
        position={[-1.2, 5, 1.4]}
        intensity={0.14}
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
        <fogExp2 attach="fog" args={[VOID_COLOR, 0.05]} />
        <Suspense fallback={null}>
          <StudioLight />
          <Halo />
          <Monolith />
          <Ground />
        </Suspense>
      </Canvas>
      {/* Vignettage CSS — pas un effet décoratif, un guide pour l'œil vers
          le centre du cadre (demande explicite : "pas pour faire joli,
          pour guider le regard"). Fait en CSS plutôt qu'en post-traitement
          WebGL : aucun coût de rendu, aucune dépendance supplémentaire. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 75% 70% at 50% 46%, transparent 45%, rgba(0,0,0,0.45) 100%)",
        }}
      />
    </div>
  );
}
