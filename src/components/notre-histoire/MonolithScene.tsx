"use client";

import { Suspense, useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { RectAreaLightUniformsLib } from "three/examples/jsm/lights/RectAreaLightUniformsLib.js";

RectAreaLightUniformsLib.init();

const VOID_COLOR = "#0d0a08";
const OBJECT_COLOR = "#2a2116";
const GLOW_COLOR = "#ffb774";

const BODY_WIDTH = 1.15;
const BODY_HEIGHT = 1.72;
const BODY_DEPTH = 0.95;
const BASE_WIDTH = 1.24;
const BASE_HEIGHT = 0.32;
const BASE_DEPTH = 1.02;
const GAP = 0.022;
const LEVITATE = 0.035;
const GROUND_Y = -1.28;
const BASE_Y = GROUND_Y + LEVITATE + BASE_HEIGHT / 2;
const BODY_Y = BASE_Y + BASE_HEIGHT / 2 + GAP + BODY_HEIGHT / 2;

function easeInOutCubic(t: number) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

/**
 * Itération 2 : premier temps scrollé — "Mystère → Ouverture". Silhouette
 * "La Stèle" validée par le client ("franchement je valide A") après
 * comparaison de trois variantes réelles ; matière/lumière/composition
 * déjà travaillées à l'itération 1. Le client a confirmé être satisfait de
 * l'état "Objet" ("oui go") : ce fichier construit maintenant les deux
 * temps suivants du récit en cinq temps — "Une couture apparaît. Le volume
 * s'ouvre très lentement. Une lumière chaude s'en échappe." — rien de plus
 * à ce stade : ni "Révélation" (les éléments qui s'assemblent en
 * architecture) ni "Maison" (la signature "100 % fabriqué en France"),
 * volontairement laissés à une prochaine itération contrôlée.
 *
 * Le corps ("La Stèle") est maintenant scindé en deux moitiés qui se
 * touchent exactement au repos — indiscernables d'un seul volume plein,
 * "Objet" et "Mystère" doivent rester visuellement identiques tant que le
 * scroll n'a pas commencé. La progression de scroll (même schéma que le
 * squelette initial : `getBoundingClientRect` throttlé par
 * `requestAnimationFrame`, lu dans `useFrame` plutôt que via un state React
 * pour ne jamais re-render tout l'arbre R3F au pixel scrollé) pilote deux
 * choses dans la moitié basse de la course : une fine ligne de lumière
 * chaude qui apparaît le long de la couture (0 → 40 % du scroll de la
 * section) ; puis une rotation très lente des deux moitiés autour de cette
 * même couture, comme deux portes qui s'entrouvrent, laissant s'échapper
 * la lumière qu'on vient de voir naître (40 % → 100 %). Angle maximal
 * volontairement faible (9°) : ce n'est que le tout début de l'ouverture,
 * pas la révélation de l'intérieur.
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

/* Profil d'une moitié du corps : arête extérieure arrondie (chanfrein),
   arête de couture (x=0, le pivot de la "porte") laissée droite — c'est
   elle qui doit lire comme une coupe nette, pas comme un bord fini. */
function halfBodyShape(halfWidth: number, height: number, radius: number, side: "left" | "right") {
  const h = height / 2;
  const sign = side === "right" ? 1 : -1;
  const shape = new THREE.Shape();
  shape.moveTo(0, -h);
  shape.lineTo(sign * (halfWidth - radius), -h);
  shape.quadraticCurveTo(sign * halfWidth, -h, sign * halfWidth, -h + radius);
  shape.lineTo(sign * halfWidth, h - radius);
  shape.quadraticCurveTo(sign * halfWidth, h, sign * (halfWidth - radius), h);
  shape.lineTo(0, h);
  shape.lineTo(0, -h);
  return shape;
}

function buildHalfGeometry(side: "left" | "right") {
  const shape = halfBodyShape(BODY_WIDTH / 2, BODY_HEIGHT, 0.055, side);
  // Pas de chanfrein d'extrusion (bevelEnabled) sur les moitiés : ce
  // chanfrein s'applique à tout le pourtour du profil, y compris l'arête
  // de couture (x=0) — qui n'a pourtant aucune courbure dans le tracé 2D.
  // Deux moitiés dont les chanfreins de couture se touchent forment une
  // arête convexe qui accroche fortement la lumière, visible même au
  // repos (bug trouvé à l'écran : un trait clair au centre de l'objet,
  // identique à l'état fermé et ouvert — la preuve qu'il vient de la
  // géométrie, pas de l'animation). L'arrondi des coins extérieurs dans
  // le tracé 2D (`radius` ci-dessus) suffit à donner une arête douce vue
  // de face ; la couture elle-même reste une coupe franche, cohérente
  // avec l'idée d'une coupure nette plutôt qu'un bord fini.
  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: BODY_DEPTH,
    bevelEnabled: false,
    curveSegments: 32,
  });
  geo.translate(0, 0, -BODY_DEPTH / 2);
  return geo;
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

function MonolithBody({
  progressRef,
  material,
}: {
  progressRef: React.RefObject<number>;
  material: THREE.MeshPhysicalMaterial;
}) {
  const leftGeometry = useMemo(() => buildHalfGeometry("left"), []);
  const rightGeometry = useMemo(() => buildHalfGeometry("right"), []);

  const leftRef = useRef<THREE.Mesh>(null);
  const rightRef = useRef<THREE.Mesh>(null);
  const glowLightRef = useRef<THREE.PointLight>(null);
  const glowPlaneRef = useRef<THREE.Mesh>(null);

  useFrame(() => {
    const raw = Math.min(1, Math.max(0, progressRef.current));
    // Le corps est vertical-centré dans la section : par construction, le
    // haut de la section entre dans le cadre bien avant que le volume
    // lui-même ne soit lisible à l'écran. Décaler les deux phases plus
    // loin dans la course (au lieu de 0→0.4 et 0.4→1) laisse un vrai
    // temps "Objet" fermé une fois l'objet effectivement visible, avant
    // que "Mystère" ne commence — vérifié à l'écran, pas seulement en
    // théorie (un premier réglage 0→0.4/0.4→1 montrait la couture déjà
    // allumée dès que l'objet apparaissait à l'écran).
    const seamT = Math.max(0, Math.min(1, (raw - 0.35) / 0.3));
    const openT = Math.max(0, Math.min(1, (raw - 0.65) / 0.35));
    const openEased = easeInOutCubic(openT);
    const maxAngle = THREE.MathUtils.degToRad(9);

    if (leftRef.current) leftRef.current.rotation.y = maxAngle * openEased;
    if (rightRef.current) rightRef.current.rotation.y = -maxAngle * openEased;

    const glowIntensity = seamT * 1 + openEased * 7;
    if (glowLightRef.current) glowLightRef.current.intensity = glowIntensity;
    if (glowPlaneRef.current) {
      const mat = glowPlaneRef.current.material as THREE.MeshBasicMaterial;
      mat.opacity = Math.min(1, seamT * 0.55 + openEased * 0.85);
    }
  });

  return (
    <group position={[0, BODY_Y, 0]}>
      <mesh ref={leftRef} geometry={leftGeometry} material={material} castShadow receiveShadow />
      <mesh ref={rightRef} geometry={rightGeometry} material={material} castShadow receiveShadow />
      {/* La lumière qui "s'échappe" de la couture — une lame fine et un
          point light très localisé, tous deux à intensité nulle au repos. */}
      <mesh ref={glowPlaneRef} position={[0, 0, BODY_DEPTH / 2 + 0.08]}>
        <planeGeometry args={[0.05, BODY_HEIGHT * 0.92]} />
        <meshBasicMaterial color={GLOW_COLOR} transparent opacity={0} depthWrite={false} />
      </mesh>
      <pointLight
        ref={glowLightRef}
        position={[0, 0, BODY_DEPTH / 2 + 0.08]}
        color={GLOW_COLOR}
        intensity={0}
        distance={1.6}
        decay={2}
      />
    </group>
  );
}

/* Socle — reste immobile pendant toute la séquence : c'est l'ancrage
   architectural, ce n'est pas lui qui "s'ouvre". Partage le même matériau
   que le corps (une seule texture de grain générée, pas une par pièce). */
function Base({ material }: { material: THREE.MeshPhysicalMaterial }) {
  const baseGeometry = useMemo(() => {
    const shape = roundedRectShape(BASE_WIDTH, BASE_HEIGHT, 0.05);
    const geo = new THREE.ExtrudeGeometry(shape, {
      depth: BASE_DEPTH,
      bevelEnabled: true,
      bevelThickness: 0.045,
      bevelSize: 0.045,
      bevelSegments: 10,
      curveSegments: 32,
    });
    geo.center();
    return geo;
  }, []);

  return (
    <mesh geometry={baseGeometry} material={material} position={[0, BASE_Y, 0]} castShadow receiveShadow />
  );
}

/* Sol très sombre — l'objet lévite de quelques millimètres au-dessus,
   juste assez pour qu'un fin trait de vide sépare son ombre de contact du
   socle lui-même. */
function Ground() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, GROUND_Y, 0]} receiveShadow>
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
   dédiée à une arête différente. La clé (gauche, chaude, forte) reste
   dominante ; une deuxième lame beaucoup plus faible et froide vient
   dessiner un second reflet sur le bord opposé. */
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
  const containerRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef(0);
  const grain = useMemo(() => createWoodGrainTexture(), []);
  const woodMaterial = useMemo(
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

  useEffect(() => {
    let rafId: number | null = null;

    const updateProgress = () => {
      rafId = null;
      const el = containerRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const viewportH = window.innerHeight;
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
          <MonolithBody progressRef={progressRef} material={woodMaterial} />
          <Base material={woodMaterial} />
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
