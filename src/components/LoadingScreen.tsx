"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Bounds, Environment, Lightformer, useGLTF } from "@react-three/drei";
import { useReducedMotion } from "framer-motion";
import type { Group } from "three";

/**
 * Rideau de chargement premium demandé par le client : son propre modèle
 * 3D du blason Bellora (`.glb` fourni, exporté depuis Three.js — un seul
 * mesh, matériau PBR métallique doré `#a86f0a`-ish, `metalness=1`,
 * `roughness=0.15`, clearcoat — donc visuellement déjà assorti à
 * `--laiton`, la couleur laiton du reste du site) qui tourne sur
 * lui-même le temps que la page charge.
 *
 * Pas d'environnement HDR téléchargé (aucun `preset` drei, qui irait
 * chercher un fichier sur un CDN externe — fragile, et injustifiable
 * pour un simple écran de chargement) : `<Environment>` + `<Lightformer>`
 * construit un mini-studio 100% procédural, rendu dans un cubemap une
 * fois au montage, sans aucune requête réseau. Un matériau aussi
 * métallique/clearcoat a besoin de réflexions d'environnement pour ne
 * pas paraître plat ou noir — de simples lumières directionnelles ne
 * suffisent pas sur ce type de matériau.
 *
 * `<Bounds fit>` recadre la caméra automatiquement sur le vrai volume du
 * modèle au montage plutôt que deviner une distance de caméra à l'aveugle
 * (le fichier ne précise ni son échelle ni son centrage).
 *
 * Fermeture : temps minimum d'affichage (`MIN_VISIBLE_MS`) pour ne
 * jamais laisser un simple flash sur un chargement déjà rapide, puis
 * attente de l'événement `load` (toutes les ressources de la page,
 * pas seulement le HTML) avant de lancer le fondu de sortie. Le Canvas
 * est complètement démonté une fois le fondu terminé (`phase === "gone"`)
 * pour libérer le contexte WebGL — pas seulement caché en opacité 0, ce
 * qui laisserait tourner un rendu invisible indéfiniment.
 *
 * `prefers-reduced-motion` : la rotation s'arrête (le blason reste
 * affiché, immobile) plutôt que de désactiver tout l'écran de
 * chargement — c'est le mouvement décoratif qui doit céder, pas la
 * fonction (annoncer que la page charge encore).
 *
 * Détection WebGL : à l'échec (contexte `webgl`/`webgl2` indisponible),
 * repli sur un simple indicateur CSS (cercle laiton qui pulse) — jamais
 * d'écran figé ni d'erreur si le navigateur ou le device ne supporte pas
 * le rendu 3D.
 */

const MODEL_URL = "/models/blason.glb";
const MIN_VISIBLE_MS = 900;
const FADE_MS = 700;

function Blason({ spin }: { spin: boolean }) {
  const { scene } = useGLTF(MODEL_URL);
  const ref = useRef<Group>(null);

  useFrame((_, delta) => {
    if (spin && ref.current) {
      ref.current.rotation.y += delta * 0.7;
    }
  });

  return (
    <Bounds fit clip margin={1.3}>
      <primitive ref={ref} object={scene} />
    </Bounds>
  );
}

function StudioEnvironment() {
  return (
    <Environment resolution={256}>
      <Lightformer
        form="rect"
        intensity={8}
        color="#f4e9d8"
        position={[3, 3, 4]}
        scale={[5, 5, 1]}
      />
      <Lightformer
        form="rect"
        intensity={5}
        color="#ffffff"
        position={[-4, 1, 3]}
        scale={[4, 4, 1]}
      />
      <Lightformer
        form="rect"
        intensity={3}
        color="#ffffff"
        position={[0, 0, 5]}
        scale={[6, 6, 1]}
      />
      <Lightformer
        form="ring"
        intensity={4}
        color="#c9a24a"
        position={[0, -4, 2]}
        scale={6}
      />
    </Environment>
  );
}

export default function LoadingScreen() {
  const [phase, setPhase] = useState<"visible" | "fading" | "gone">("visible");
  const [mounted, setMounted] = useState(false);
  const [webglOk, setWebglOk] = useState(true);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    setMounted(true);

    try {
      const canvas = document.createElement("canvas");
      const gl =
        canvas.getContext("webgl2") ||
        canvas.getContext("webgl") ||
        canvas.getContext("experimental-webgl");
      if (!gl) setWebglOk(false);
    } catch {
      setWebglOk(false);
    }

    const start = Date.now();
    const finish = () => {
      const remaining = Math.max(0, MIN_VISIBLE_MS - (Date.now() - start));
      setTimeout(() => setPhase("fading"), remaining);
    };

    if (document.readyState === "complete") {
      finish();
    } else {
      window.addEventListener("load", finish, { once: true });
      return () => window.removeEventListener("load", finish);
    }
  }, []);

  useEffect(() => {
    if (phase !== "fading") return;
    const t = setTimeout(() => {
      setPhase("gone");
    }, FADE_MS);
    return () => clearTimeout(t);
  }, [phase]);

  // Rien avant l'hydratation (le SSR ne peut de toute façon rien savoir
  // de l'état de chargement réel) ni une fois le fondu terminé (Canvas
  // démonté, contexte WebGL libéré).
  if (!mounted || phase === "gone") return null;

  return (
    <div
      aria-hidden
      data-testid="loading-screen"
      data-phase={phase}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-encre"
      style={{
        opacity: phase === "fading" ? 0 : 1,
        transition: `opacity ${FADE_MS}ms ease`,
        pointerEvents: phase === "fading" ? "none" : "auto",
      }}
    >
      {webglOk ? (
        <div className="h-40 w-40 sm:h-56 sm:w-56">
          <Canvas camera={{ position: [0, 0, 5], fov: 35 }} dpr={[1, 2]}>
            <ambientLight intensity={0.6} />
            <Suspense fallback={null}>
              <StudioEnvironment />
              <Blason spin={!prefersReducedMotion} />
            </Suspense>
          </Canvas>
        </div>
      ) : (
        <div className="h-16 w-16 animate-pulse rounded-full border-2 border-laiton/50 bg-laiton/10" />
      )}
    </div>
  );
}

useGLTF.preload(MODEL_URL);
