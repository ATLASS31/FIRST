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
 * Pointeur souris mesuré contre l'objet 3D lui-même — pilote à la fois
 * l'inclinaison (`rotateX`) et le reflet mouse-tracké de la face visible.
 * Un seul repère puisqu'il n'y a plus qu'un seul élément interactif dans
 * cette colonne (voir le commentaire au-dessus du composant principal).
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

/**
 * Quatrième repartie sur cette section, la plus radicale : le client
 * confirme que l'objet 3D "fonctionne beaucoup mieux que le soleil" et
 * demande d'aller jusqu'au bout de l'idée plutôt que de la garder comme
 * simple accompagnement. Trois changements structurels :
 *
 * 1. Les trois faces partagent désormais exactement le même matériau —
 *    plus de variantes bronze/pierre. "Peu importe la rotation, je veux
 *    toujours retrouver le même Liquid Glass." Une seule classe de
 *    matière (`.hs-face`) reprend telle quelle la recette de l'ancienne
 *    carte (`.hs-card`) : dégradés diagonal + vertical, réfraction SVG
 *    réelle (`url(#glass-distortion)`), anneau de bord en gradient-border,
 *    reflet mouse-tracké à deux couches.
 * 2. Le contenu (chiffre + libellé) est gravé directement sur chaque
 *    face plutôt que dans une carte séparée à côté de l'objet — "chaque
 *    face devient la carte". L'ancienne carte (`GlassPanel` + `.hs-card`)
 *    disparaît entièrement ; l'objet grandit pour porter ce contenu
 *    (mêmes dimensions que l'ancienne carte, `204px`/`280px`).
 * 3. Plus aucune navigation séparée : l'objet entier devient un
 *    `<button>`, cliquable pour avancer d'une étape — "toute
 *    l'interaction repose sur l'objet". La rotation de 120° EST la
 *    transition de contenu, donc le fondu/rebond de texte qui existait
 *    sur l'ancienne carte disparaît aussi : il n'a plus de raison d'être
 *    quand le changement de face fait déjà tout le travail visuel.
 *
 * Autre conséquence : la rotation d'ambiance continue (le lent tour
 * perpétuel du tour précédent) est retirée. Elle avait du sens sur un
 * petit objet purement décoratif ; elle n'en a plus sur l'élément qui
 * porte maintenant le texte à lire — un objet qui dérive légèrement en
 * permanence rendrait la lecture inconfortable. L'objet reste donc
 * parfaitement stable entre deux étapes ; seule l'inclinaison bornée au
 * mouvement de la souris continue de bouger.
 */
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
  // large et doux (éclairage ambiant réfléchi) — identique à l'ancienne
  // carte, appliqué maintenant sur chaque face plutôt que sur un seul
  // panneau séparé.
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
