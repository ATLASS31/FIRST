"use client";

import { useEffect, useRef, useState } from "react";
import {
  motion,
  useMotionTemplate,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from "framer-motion";

const AUTOPLAY_MS = 3500;

const FIGURES = [
  { value: "20 ans", label: "de garantie" },
  { value: "4–12 semaines", label: "de livraison" },
  { value: "100%", label: "fabriqué en France" },
];

/**
 * Retour complet à cette version sur demande explicite du client, après
 * plusieurs tours d'exploration 3D temps réel (Three.js/React Three
 * Fiber : coquille architecturale, monolithe, forêt Bellora). Diagnostic
 * client : *"le site commence à perdre en fluidité [...] nous passons
 * beaucoup de temps à résoudre des problèmes techniques au lieu
 * d'améliorer le site [...] je préfère repartir sur une base propre et
 * stable"*. Toute la piste WebGL est donc abandonnée pour l'instant —
 * `notre-histoire/ForestScene.tsx` et les dépendances `three`/
 * `@react-three/fiber`/`@react-three/drei` sont supprimées du projet,
 * aucune trace gardée "au cas où".
 *
 * Ce fichier restaure exactement l'état validé juste avant l'adoption de
 * Three.js (commit `2dff32e`, "l'objet 3D devient la carte, navigation
 * absorbée") : texte à gauche, objet 3D en CSS pur à droite (prisme
 * triangulaire, `transform-style: preserve-3d`, aucune dépendance WebGL),
 * dont une face différente fait face à l'écran à chaque étape — rotation
 * de 120°, inclinaison bornée au mouvement de la souris, reflet
 * mouse-tracké, matériau Liquid Glass identique sur les trois faces
 * (classes `.hs-object-*`, restaurées dans `globals.css`). Chaque face
 * porte directement une des trois preuves fortes (garantie, délai,
 * fabrication) — l'objet entier est le seul élément interactif de la
 * colonne, cliquable pour avancer, avec une rotation automatique toutes
 * les 3,5 s. Aucune scène à charger, aucun canvas, aucun import
 * dynamique : cette section revient au even coût de rendu qu'une carte
 * CSS ordinaire.
 *
 * Nous reviendrons sur une expérience 3D plus ambitieuse plus tard, une
 * fois le reste du site stabilisé — pas dans cette section tant que ce
 * chantier n'a pas de budget de temps dédié qui ne compromette pas le
 * reste du développement.
 */
function useObjectPointer() {
  const ref = useRef<HTMLElement>(null);
  const rafRef = useRef<number | null>(null);
  const latestPoint = useRef({ x: 0, y: 0 });
  const px = useMotionValue(0.5);
  const py = useMotionValue(0.5);
  const springConfig = { stiffness: 180, damping: 24, mass: 0.4 };
  const sx = useSpring(px, springConfig);
  const sy = useSpring(py, springConfig);

  useEffect(() => {
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  const handleMove = (e: React.MouseEvent<HTMLElement>) => {
    latestPoint.current = { x: e.clientX, y: e.clientY };
    if (rafRef.current !== null) return;
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null;
      const rect = ref.current?.getBoundingClientRect();
      if (!rect) return;
      px.set((latestPoint.current.x - rect.left) / rect.width);
      py.set((latestPoint.current.y - rect.top) / rect.height);
    });
  };

  const handleLeave = () => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    px.set(0.5);
    py.set(0.5);
  };

  return { ref, sx, sy, handleMove, handleLeave };
}

export default function NotreHistoire() {
  const [active, setActive] = useState(0);
  const prefersReducedMotion = useReducedMotion();
  const { ref: objectRef, sx, sy, handleMove, handleLeave } = useObjectPointer();

  const tiltX = useTransform(sy, [0, 1], [9, -9]);
  const tiltY = useTransform(sx, [0, 1], [-9, 9]);

  const shineX = useTransform(sx, [0, 1], ["0%", "100%"]);
  const shineY = useTransform(sy, [0, 1], ["0%", "100%"]);
  // Spéculaire à deux couches : un point chaud étroit (réflexion directe
  // d'une source de lumière sur une surface polie) superposé à un halo
  // large et doux (éclairage ambiant réfléchi), identique sur les trois
  // faces (même `shineBackground`, calculé une seule fois contre l'objet
  // entier) : seule la face tournée vers l'écran le montre réellement.
  const shineBackground = useMotionTemplate`radial-gradient(80px circle at ${shineX} ${shineY}, rgba(255,255,255,0.6), transparent 45%), radial-gradient(280px circle at ${shineX} ${shineY}, rgba(255,255,255,0.22), transparent 65%)`;

  useEffect(() => {
    const id = setInterval(() => {
      setActive((i) => (i + 1) % FIGURES.length);
    }, AUTOPLAY_MS);
    return () => clearInterval(id);
  }, [active]);

  const handleAdvance = () => setActive((i) => (i + 1) % FIGURES.length);
  const figure = FIGURES[active];

  return (
    <section className="relative overflow-hidden bg-ciel px-6 py-20 sm:py-24">
      <div className="relative z-10 mx-auto grid max-w-6xl gap-16 lg:grid-cols-[1fr_1.2fr] lg:items-center">
        <div className="min-w-0">
          <p className="eyebrow text-xs text-encre-douce">Notre histoire</p>
          <h2 className="mt-4 text-4xl font-semibold text-encre sm:text-5xl">
            Le modulaire bois, sans compromis.
          </h2>
          <p className="mt-6 text-base leading-relaxed text-encre-doux">
            Le modulaire bois traîne une réputation : préfabriqué bon marché,
            finitions médiocres, durée de vie courte.
          </p>
          <span aria-hidden className="mt-4 block h-px w-8 bg-laiton" />
          <p className="mt-4 text-base leading-relaxed text-encre-doux">
            <strong className="font-semibold text-encre">
              Nous construisons l&apos;inverse.
            </strong>{" "}
            Ossature Douglas certifiée, isolation conforme RE2020, bardage
            Cryptomeria — les matériaux et les gestes sont ceux d&apos;une
            maison construite sur place. Chaque maison est conçue et
            assemblée en atelier français par des charpentiers et menuisiers
            expérimentés.
          </p>
        </div>

        <div className="flex min-w-0 justify-center">
          <motion.button
            ref={objectRef as React.RefObject<HTMLButtonElement>}
            type="button"
            onClick={handleAdvance}
            onMouseMove={handleMove}
            onMouseLeave={handleLeave}
            aria-label={`Étape ${active + 1} sur ${FIGURES.length} : ${figure.value} ${figure.label}. Cliquer pour voir l'étape suivante.`}
            className="hs-object-scene"
            whileHover={{ scale: 1.015 }}
            whileTap={{ scale: 0.97 }}
            transition={{ type: "spring", stiffness: 400, damping: 22 }}
          >
            <motion.div
              className="hs-object-tilt"
              initial={{ opacity: 0, y: 26, scale: 0.94, filter: "blur(14px)" }}
              whileInView={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
              viewport={{ once: true, amount: 0.6 }}
              transition={
                prefersReducedMotion
                  ? { duration: 0 }
                  : { duration: 1, ease: [0.16, 1, 0.3, 1] }
              }
              style={{ rotateX: tiltX, rotateY: tiltY }}
            >
              <motion.div
                className="hs-object-step"
                animate={{ rotateY: -active * 120 }}
                transition={
                  prefersReducedMotion
                    ? { duration: 0 }
                    : { type: "spring", stiffness: 70, damping: 14, mass: 1 }
                }
              >
                {FIGURES.map((f) => (
                  <div key={f.label} className="hs-object-face">
                    <div aria-hidden className="hs-object-face-rim" />
                    <motion.div
                      aria-hidden
                      className="hs-object-face-shine"
                      style={{ background: shineBackground }}
                    />
                    <div aria-hidden className="hs-object-face-content">
                      <p className="text-balance text-2xl font-semibold leading-snug text-encre sm:text-4xl">
                        {f.value}
                      </p>
                      <p className="eyebrow mt-3 text-xs text-encre-douce sm:text-sm">
                        {f.label}
                      </p>
                      <span
                        aria-hidden
                        className="mx-auto mt-4 block h-px w-7 bg-laiton/70"
                      />
                    </div>
                  </div>
                ))}
              </motion.div>
            </motion.div>
            <div aria-hidden className="hs-object-shadow" />
          </motion.button>
        </div>
      </div>
    </section>
  );
}
