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
 * Fond des vidéos détouré au `<canvas>` — mais PAS avec la même technique
 * que les matériaux de "Notre histoire" (distance de couleur globale) :
 * essayée d'abord, elle "surexposait" l'objet ("il faut que les éléments
 * soient bien visibles à 100%"). Cause mesurée en échantillonnant les
 * pixels des vraies vidéos : contrairement aux matériaux (bois foncé sur
 * fond clair, bonne séparation), ces rendus sont volontairement ton sur
 * ton — la façade de l'horloge et les murs de la maison sont PARFOIS PLUS
 * PROCHES en couleur du fond que le bruit du fond lui-même (écart mesuré
 * ~5-6 sur les murs de la maison contre ~19-24 de variation du fond).
 * Un seuil de distance de couleur globale ne peut donc pas séparer les
 * deux sans effacer une partie de l'objet — ce n'est pas réglable en
 * ajustant juste le seuil, c'est la méthode qui ne convient pas ici.
 *
 * Remplacé par un remplissage par propagation (flood fill / BFS) depuis
 * les bords de l'image, sur un petit canvas basse résolution (96×96,
 * calcul quasi gratuit) : seuls les pixels à la fois proches de la
 * couleur du fond ET reliés aux bords sans traverser une rupture de
 * couleur (le rebord de l'horloge, l'arête du toit...) sont considérés
 * "fond". Un pixel à l'intérieur de l'objet qui a la même couleur que le
 * fond mais qui n'est PAS relié aux bords (parce qu'une rupture de
 * couleur l'entoure) reste opaque à 100%, même si sa couleur seule
 * ressemblerait à un match. Le masque basse résolution est ensuite
 * suréchantillonné (interpolation bilinéaire) sur l'image pleine
 * résolution — le bord de l'objet reste net, la transition de quelques
 * pixels donnant un anti-crénelage naturel plutôt qu'un contour dur.
 *
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
  const maskCanvasRef = useRef<HTMLCanvasElement | null>(null);

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
      // Détourage par propagation (flood fill) plutôt que par simple
      // distance de couleur — voir la note en tête de fichier : ces rendus
      // sont ton sur ton (l'objet peut être PLUS proche de la couleur du
      // fond que le bruit du fond lui-même), une distance de couleur seule
      // efface donc des pans entiers de l'objet. Calculé sur un petit
      // canvas basse résolution (rapide) puis suréchantillonné.
      const MASK_SIZE = 96;
      if (!maskCanvasRef.current) {
        maskCanvasRef.current = document.createElement("canvas");
        maskCanvasRef.current.width = MASK_SIZE;
        maskCanvasRef.current.height = MASK_SIZE;
      }
      const maskCanvas = maskCanvasRef.current;
      const maskCtx = maskCanvas.getContext("2d", { willReadFrequently: true });
      if (!maskCtx) throw new Error("no mask context");
      maskCtx.clearRect(0, 0, MASK_SIZE, MASK_SIZE);
      maskCtx.drawImage(video, 0, 0, MASK_SIZE, MASK_SIZE);
      const maskFrame = maskCtx.getImageData(0, 0, MASK_SIZE, MASK_SIZE);
      const maskData = maskFrame.data;

      if (!keyColorRef.current) {
        // Moyenne des 4 coins (fond d'atelier légèrement dégradé),
        // échantillonnée une seule fois puis réutilisée pour les 3 vidéos.
        const corners = [
          0,
          (MASK_SIZE - 1) * 4,
          (MASK_SIZE - 1) * MASK_SIZE * 4,
          ((MASK_SIZE - 1) * MASK_SIZE + (MASK_SIZE - 1)) * 4,
        ];
        let r = 0;
        let g = 0;
        let b = 0;
        for (const idx of corners) {
          r += maskData[idx];
          g += maskData[idx + 1];
          b += maskData[idx + 2];
        }
        keyColorRef.current = [r / corners.length, g / corners.length, b / corners.length];
      }
      const [kr, kg, kb] = keyColorRef.current;
      // Seuil calé sur les pixels réels des 3 vidéos (échantillonnés hors
      // ligne, et vérifié visuellement sur les vraies frames extraites) :
      // 22 (le bruit du fond de l'horloge) laissait des zones de fond non
      // détourées sur la vidéo maison — son dégradé d'atelier varie
      // jusqu'à ~24-30 selon la zone, plus que celui de l'horloge. 30
      // couvre proprement ce dégradé sur les 3 vidéos tout en restant
      // sous la plus proche rupture de couleur sur l'objet (~35+).
      const threshold = 30;
      const t2 = threshold * threshold;

      const isBg = new Uint8Array(MASK_SIZE * MASK_SIZE);
      const visited = new Uint8Array(MASK_SIZE * MASK_SIZE);
      const queue = new Int32Array(MASK_SIZE * MASK_SIZE);
      let qHead = 0;
      let qTail = 0;

      const tryEnqueue = (x: number, y: number) => {
        if (x < 0 || y < 0 || x >= MASK_SIZE || y >= MASK_SIZE) return;
        const idx = y * MASK_SIZE + x;
        if (visited[idx]) return;
        visited[idx] = 1;
        const di = idx * 4;
        const dr = maskData[di] - kr;
        const dg = maskData[di + 1] - kg;
        const db = maskData[di + 2] - kb;
        if (dr * dr + dg * dg + db * db < t2) {
          isBg[idx] = 1;
          queue[qTail++] = idx;
        }
      };

      for (let x = 0; x < MASK_SIZE; x++) {
        tryEnqueue(x, 0);
        tryEnqueue(x, MASK_SIZE - 1);
      }
      for (let y = 0; y < MASK_SIZE; y++) {
        tryEnqueue(0, y);
        tryEnqueue(MASK_SIZE - 1, y);
      }
      while (qHead < qTail) {
        const idx = queue[qHead++];
        const x = idx % MASK_SIZE;
        const y = (idx / MASK_SIZE) | 0;
        tryEnqueue(x + 1, y);
        tryEnqueue(x - 1, y);
        tryEnqueue(x, y + 1);
        tryEnqueue(x, y - 1);
      }

      // Applique le masque basse résolution à l'image pleine résolution,
      // avec interpolation bilinéaire pour un bord lisse plutôt qu'un
      // contour en escalier.
      const frame = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = frame.data;
      const sx = MASK_SIZE / canvas.width;
      const sy = MASK_SIZE / canvas.height;
      for (let y = 0; y < canvas.height; y++) {
        const my = y * sy;
        const my0 = Math.min(MASK_SIZE - 1, Math.floor(my));
        const my1 = Math.min(MASK_SIZE - 1, my0 + 1);
        const fy = my - my0;
        for (let x = 0; x < canvas.width; x++) {
          const mx = x * sx;
          const mx0 = Math.min(MASK_SIZE - 1, Math.floor(mx));
          const mx1 = Math.min(MASK_SIZE - 1, mx0 + 1);
          const fx = mx - mx0;
          const v00 = isBg[my0 * MASK_SIZE + mx0];
          const v10 = isBg[my0 * MASK_SIZE + mx1];
          const v01 = isBg[my1 * MASK_SIZE + mx0];
          const v11 = isBg[my1 * MASK_SIZE + mx1];
          const vTop = v00 + (v10 - v00) * fx;
          const vBot = v01 + (v11 - v01) * fx;
          const bgAmount = vTop + (vBot - vTop) * fy;
          data[(y * canvas.width + x) * 4 + 3] = Math.round((1 - bgAmount) * 255);
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
