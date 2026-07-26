"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

/**
 * Refonte complète sur direction précise du client, référence visuelle à
 * l'appui : à gauche un objet qui se transforme en boucle continue (bois →
 * horloge → maison → bois), à droite un texte qui change en même temps que
 * l'objet ; en bas, une frise à 3 étapes (Matière / Temps / Espace) qui
 * suit l'étape active. Remplace l'ancienne version (3 cartes glass côte à
 * côte, sans objet) — l'ancien contenu texte (subtitle/title/body de
 * chaque pilier) est conservé tel quel, seule la mise en forme change.
 *
 * Le client a fourni 3 vidéos, chacune une transformation complète dans un
 * seul sens (jamais besoin de les lire à l'envers) : bois→horloge,
 * horloge→maison, maison→bois — la troisième referme la boucle. Même
 * architecture que les matériaux de "Notre histoire" (`NotreHistoire.tsx`) :
 * chaque vidéo se relit nativement vers l'avant, jamais de scrub. Contexte
 * différent en revanche : ici pas de scroll-threshold, juste une boucle
 * automatique continue ("il y a pas d'animation au scroll, juste en
 * boucle") — la vidéo suivante se lance après un temps de pause fixe
 * (`HOLD_MS`), pas au franchissement d'une position de scroll.
 *
 * Fond des vidéos détouré au `<canvas>`, même technique que les matériaux
 * (couleur de fond échantillonnée aux 4 coins, détourage par distance au
 * carré + bande de fondu) : sans ça, le fond d'atelier chaud des rendus
 * (mesuré ~rgb(225,215,205)) tranchait nettement avec le fond de la page.
 * La boucle ne démarre qu'une fois la section réellement visible
 * (`IntersectionObserver`, une seule fois) — pas la peine de faire tourner
 * une vidéo que personne ne regarde encore au chargement de la page.
 *
 * Filet de sécurité (`TRANSITION_TIMEOUT_MS`) : comme pour les matériaux,
 * si une vidéo ne joue jamais (codec non supporté, fichier introuvable),
 * l'étape active avance quand même après un délai — jamais bloqué. Ce bac
 * à sable (Chromium sans décodeur H.264 propriétaire, déjà documenté dans
 * `NotreHistoire.tsx`) ne peut de toute façon jamais lire ces vidéos à
 * l'écran ici ; c'est ce filet de sécurité qui permet de vérifier la
 * mécanique (changement d'étape, texte, frise) malgré tout.
 */

const TRANSITIONS = [
  "/videos/piliers-bois-horloge.mp4",
  "/videos/piliers-horloge-maison.mp4",
  "/videos/piliers-maison-bois.mp4",
] as const;

const STEPS = [
  {
    id: "matiere",
    tabLabel: "Matière",
    icon: "tree",
    subtitle: "Une matière vivante",
    title: "Le bois, noblement",
    body: "Épicéa et Douglas certifiés, châssis acier soudé, finition à la main.",
  },
  {
    id: "temps",
    tabLabel: "Temps",
    icon: "clock",
    subtitle: "De la signature à la pose",
    title: "Le temps, maîtrisé",
    body: "Quatre à douze semaines. Pas d'imprévus, pas de surprises.",
  },
  {
    id: "espace",
    tabLabel: "Espace",
    icon: "home",
    subtitle: "Neuf combinaisons",
    title: "L'espace, à vous",
    body: "Trois gammes, neuf configurations à votre image.",
  },
] as const;

// Temps de pause sur chaque état statique avant de lancer la transition
// suivante — le temps de lire le texte associé.
const HOLD_MS = 3200;
// Filet de sécurité par transition (vidéos de ~3s chacune, large marge).
const TRANSITION_TIMEOUT_MS = 6000;

function StepIcon({ name }: { name: (typeof STEPS)[number]["icon"] }) {
  const common = {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.5,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    className: "h-6 w-6",
  };
  if (name === "tree") {
    return (
      <svg {...common}>
        <circle cx="12" cy="9" r="5.5" />
        <path d="M12 14.5V21M8.5 21h7" />
      </svg>
    );
  }
  if (name === "clock") {
    return (
      <svg {...common}>
        <circle cx="12" cy="12" r="8.5" />
        <path d="M12 7.5V12l3.2 2" />
      </svg>
    );
  }
  return (
    <svg {...common}>
      <path d="M3 11.5 12 4l9 7.5" />
      <path d="M5.5 10v10.5h13V10" />
    </svg>
  );
}

export default function ThreePiliers() {
  const prefersReducedMotion = useReducedMotion();
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const video0Ref = useRef<HTMLVideoElement>(null);
  const video1Ref = useRef<HTMLVideoElement>(null);
  const video2Ref = useRef<HTMLVideoElement>(null);
  const [activeStep, setActiveStep] = useState<0 | 1 | 2>(0);
  const keyColorRef = useRef<[number, number, number] | null>(null);
  const keyingDisabledRef = useRef(false);

  const drawFrame = useCallback((video: HTMLVideoElement) => {
    const canvas = canvasRef.current;
    if (!canvas || video.videoWidth === 0) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const cssWidth = canvas.getBoundingClientRect().width || video.videoWidth;
    const targetWidth = Math.max(
      1,
      Math.min(video.videoWidth, Math.round(cssWidth * dpr))
    );
    const scale = targetWidth / video.videoWidth;
    const targetHeight = Math.max(1, Math.round(video.videoHeight * scale));

    if (canvas.width !== targetWidth || canvas.height !== targetHeight) {
      canvas.width = targetWidth;
      canvas.height = targetHeight;
    }
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    if (keyingDisabledRef.current) return;

    try {
      const frame = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = frame.data;

      if (!keyColorRef.current) {
        // Moyenne des 4 coins (fond d'atelier légèrement dégradé), même
        // technique que `drawSource` dans `NotreHistoire.tsx`. Échantillonné
        // une seule fois puis réutilisé pour les 3 vidéos : même fond
        // d'atelier sur les 3 rendus.
        const w = canvas.width;
        const h = canvas.height;
        const corners = [
          0,
          (w - 1) * 4,
          (h - 1) * w * 4,
          ((h - 1) * w + (w - 1)) * 4,
        ];
        let r = 0;
        let g = 0;
        let b = 0;
        for (const idx of corners) {
          r += data[idx];
          g += data[idx + 1];
          b += data[idx + 2];
        }
        keyColorRef.current = [r / corners.length, g / corners.length, b / corners.length];
      }
      const [kr, kg, kb] = keyColorRef.current;
      const threshold = 34;
      const feather = 30;
      const t2 = threshold * threshold;
      const tf2 = (threshold + feather) * (threshold + feather);

      for (let i = 0; i < data.length; i += 4) {
        const dr = data[i] - kr;
        const dg = data[i + 1] - kg;
        const db = data[i + 2] - kb;
        const dist2 = dr * dr + dg * dg + db * db;
        if (dist2 < t2) {
          data[i + 3] = 0;
        } else if (dist2 < tf2) {
          const dist = Math.sqrt(dist2);
          data[i + 3] = Math.round(((dist - threshold) / feather) * 255);
        }
      }
      ctx.putImageData(frame, 0, 0);
    } catch {
      keyingDisabledRef.current = true;
    }
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    const v0 = video0Ref.current;
    const v1 = video1Ref.current;
    const v2 = video2Ref.current;
    if (!container || !v0 || !v1 || !v2) return;

    const videos = [v0, v1, v2] as const;
    let cancelled = false;
    let started = false;
    let holdTimeout: ReturnType<typeof setTimeout> | null = null;
    let hardStop: ReturnType<typeof setTimeout> | null = null;
    let rafId: number | null = null;

    const stopRaf = () => {
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
    };

    if (prefersReducedMotion) {
      const onReady = () => {
        if (cancelled) return;
        drawFrame(v0);
      };
      v0.addEventListener("loadeddata", onReady, { once: true });
      return () => {
        cancelled = true;
        v0.removeEventListener("loadeddata", onReady);
      };
    }

    const scheduleHold = (step: 0 | 1 | 2) => {
      holdTimeout = setTimeout(() => {
        if (cancelled) return;
        playTransition(step);
      }, HOLD_MS);
    };

    const playTransition = (fromStep: 0 | 1 | 2) => {
      const video = videos[fromStep];
      const toStep = (((fromStep + 1) % 3) as 0 | 1 | 2);

      const start = () => {
        if (cancelled) return;
        video.playbackRate = 1;
        video.play().catch(() => {});
        hardStop = setTimeout(() => {
          stopRaf();
          video.pause();
          setActiveStep(toStep);
          scheduleHold(toStep);
        }, TRANSITION_TIMEOUT_MS);

        const loop = () => {
          if (cancelled) return;
          drawFrame(video);
          const atEnd =
            video.ended ||
            (Number.isFinite(video.duration) &&
              video.currentTime >= video.duration - 0.03);
          if (video.paused && !atEnd) {
            rafId = requestAnimationFrame(loop);
            return;
          }
          if (atEnd) {
            if (hardStop) {
              clearTimeout(hardStop);
              hardStop = null;
            }
            video.pause();
            setActiveStep(toStep);
            scheduleHold(toStep);
            return;
          }
          rafId = requestAnimationFrame(loop);
        };
        rafId = requestAnimationFrame(loop);
      };

      if (video.currentTime > 0.03) {
        const onSeeked = () => start();
        video.addEventListener("seeked", onSeeked, { once: true });
        try {
          video.currentTime = 0;
        } catch {
          video.removeEventListener("seeked", onSeeked);
          start();
        }
      } else {
        start();
      }
    };

    // Ne dépend PAS d'un événement vidéo (`loadeddata`) pour démarrer : ça a
    // été essayé, puis corrigé — cet événement demande que le décodeur ait
    // vraiment une frame prête, et rien ne garantit qu'il se déclenche vite
    // (réseau lent, ou jamais du tout dans ce bac à sable qui n'a pas de
    // décodeur H.264). `drawFrame`/`.play()` sont déjà sans risque si la
    // vidéo n'est pas encore prête (`drawFrame` sort tôt si `videoWidth`
    // vaut 0, `.play()` sur une vidéo pas assez chargée ne fait rien de
    // grave) et le filet de sécurité (`TRANSITION_TIMEOUT_MS`) fait de
    // toute façon avancer l'étape même si la vidéo ne joue jamais — donc la
    // bascule ne doit dépendre que de la visibilité de la section.
    const maybeStart = () => {
      if (started || cancelled) return;
      started = true;
      drawFrame(v0);
      setActiveStep(0);
      scheduleHold(0);
    };

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          maybeStart();
          observer.disconnect();
        }
      },
      { threshold: 0.2 }
    );
    observer.observe(container);

    return () => {
      cancelled = true;
      stopRaf();
      if (holdTimeout) clearTimeout(holdTimeout);
      if (hardStop) clearTimeout(hardStop);
      observer.disconnect();
      videos.forEach((v) => v.pause());
    };
  }, [prefersReducedMotion, drawFrame]);

  const step = STEPS[activeStep];

  return (
    <section id="concept" className="relative overflow-hidden py-28">
      <div className="relative mx-auto max-w-6xl px-6">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-20">
          <div
            ref={containerRef}
            className="relative mx-auto aspect-square w-full max-w-md lg:max-w-none"
          >
            <video
              ref={video0Ref}
              src={TRANSITIONS[0]}
              muted
              playsInline
              preload="auto"
              aria-hidden
              className="absolute inset-0 h-full w-full object-contain opacity-0"
            />
            <video
              ref={video1Ref}
              src={TRANSITIONS[1]}
              muted
              playsInline
              preload="auto"
              aria-hidden
              className="absolute inset-0 h-full w-full object-contain opacity-0"
            />
            <video
              ref={video2Ref}
              src={TRANSITIONS[2]}
              muted
              playsInline
              preload="auto"
              aria-hidden
              className="absolute inset-0 h-full w-full object-contain opacity-0"
            />
            <canvas
              ref={canvasRef}
              aria-hidden
              className="absolute inset-0 h-full w-full object-contain"
            />
          </div>

          <div>
            <AnimatePresence mode="wait">
              <motion.div
                key={`icon-${activeStep}`}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                className="flex h-14 w-14 items-center justify-center rounded-full border border-laiton/40 text-laiton"
              >
                <StepIcon name={step.icon} />
              </motion.div>
            </AnimatePresence>

            <p className="eyebrow mt-6 text-xs text-laiton">Concept</p>

            <AnimatePresence mode="wait">
              <motion.div
                key={`text-${activeStep}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              >
                <h2 className="mt-4 text-4xl font-semibold text-encre sm:text-5xl">
                  {step.subtitle}
                </h2>
                <span aria-hidden className="mt-6 block h-px w-8 bg-laiton" />
                <p className="mt-6 max-w-md text-base leading-relaxed text-encre-doux">
                  <strong className="font-semibold text-encre">
                    {step.title}.
                  </strong>{" "}
                  {step.body}
                </p>
              </motion.div>
            </AnimatePresence>

            <div className="mt-14 sm:mt-16">
              <div className="relative h-px w-full bg-encre-douce/15">
                <motion.div
                  className="absolute inset-y-0 w-1/3 bg-laiton"
                  animate={{ left: `${(activeStep * 100) / 3}%` }}
                  transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                />
              </div>
              <div className="mt-4 grid grid-cols-3">
                {STEPS.map((s, i) => (
                  <div key={s.id} className="flex flex-col gap-1">
                    <span
                      className={`eyebrow text-[11px] transition-colors duration-300 ${
                        i === activeStep ? "text-laiton" : "text-encre-douce/50"
                      }`}
                    >
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span
                      className={`text-sm font-medium transition-colors duration-300 ${
                        i === activeStep ? "text-encre" : "text-encre-douce"
                      }`}
                    >
                      {s.tabLabel}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
