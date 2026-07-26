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
 * Détourage au pixel : deux tentatives sur le premier tournage (studio
 * ton sur ton, sans fond dédié) ont échoué — distance de couleur globale
 * ("surexposé"), puis flood fill ("c'est pire", fragmenté à l'usage réel).
 * Diagnostic de l'époque : sur CE tournage, l'écart de couleur objet/fond
 * était du même ordre que le bruit de compression vidéo, donc aucun seuil
 * ne pouvait tenir — d'où le choix, à l'époque, d'abandonner le détourage
 * et de matcher le fond du conteneur à la teinte du studio.
 *
 * Le client a depuis refourni les 3 vidéos tournées sur un vrai fond vert
 * (chroma key), rgb(19, 255, 8) mesuré sur les 3 rendus, quasiment
 * identique aux 4 coins de chaque vidéo — un fond dédié au détourage,
 * plus la même contrainte ton sur ton. Le vert y est dominant par un très
 * grand écart (canal vert ≈230+ au-dessus des deux autres canaux) alors
 * qu'aucune teinte bois/horloge/maison ne s'en approche (canal rouge
 * toujours dominant ou égal) : un test de "dominance du vert" (le canal
 * vert moins le max des deux autres) sépare donc le sujet du fond sans
 * ambiguïté, contrairement au premier tournage. Un pixel est fond si cet
 * écart dépasse `KEY_HIGH`, sujet si sous `KEY_LOW`, dégradé linéaire
 * entre les deux (anti-crénelage). Les pixels de bord partiellement
 * transparents subissent en plus une suppression de spill (le vert du
 * fond qui déteint sur 1-2 pixels de bord) en plafonnant leur canal vert
 * au max(rouge, bleu) du même pixel.
 *
 * Ces vidéos n'ayant pas d'ombre portée (l'objet "flotte" sur le vert),
 * une ombre est resynthétisée : la boîte englobante du sujet (min/max x/y
 * des pixels opaques) est calculée à chaque frame pendant le même passage
 * pixel par pixel que le détourage — sans coût supplémentaire — puis une
 * ellipse dégradée (radiale, sombre puis transparente) est peinte sous le
 * sujet avant de composer l'objet détouré par-dessus. Recalculée à chaque
 * frame, elle suit naturellement la largeur et la position du sujet
 * pendant toute la métamorphose (bois → horloge → maison), sans jeu de
 * paramètres par vidéo. Sa largeur est volontairement un peu SUPÉRIEURE à
 * la boîte englobante (`shadowWidth = bboxWidth * 1.12`) : une largeur
 * inférieure (essayée d'abord) restait entièrement cachée derrière
 * l'objet opaque pour toute forme à base plate (bois, maison, dont la
 * silhouette occupe déjà toute la largeur jusqu'en bas) — seul le disque
 * de l'horloge, qui s'arrondit vers un point, laissait alors l'ombre
 * dépasser sur les côtés ("l'ombre rend bien seulement sur l'horloge").
 * Un léger dépassement garanti la rend visible quelle que soit la forme.
 *
 * Le conteneur n'a plus de fond ni de cadre propres : une fois le sujet
 * proprement détouré (fond vert réel, contrairement au premier tournage),
 * il se pose directement sur le fond de la page — plus la peine d'un
 * cadre crème pour masquer un fond de vidéo non retiré.
 *
 * Le détourage (lecture/écriture pixel par pixel) tourne sur un canvas de
 * travail à résolution réduite (`KEY_SCALE`), pas sur la pleine résolution
 * d'affichage — la version pleine résolution (jusqu'à ~2M pixels/frame en
 * desktop, DPR 2) donnait une animation "pas très fluide" en usage réel.
 * Le résultat est réagrandi via `drawImage` (lissage bilinéaire natif du
 * canvas) au moment de la composition finale, qui elle reste à pleine
 * résolution d'affichage.
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
// Filet de sécurité par transition (vidéos de ~3s chacune à vitesse 1x,
// large marge même accéléré).
const TRANSITION_TIMEOUT_MS = 6000;
// Vitesse de lecture des transitions — demande client ("l'animation aille
// plus vite"), vidéos de ~3s à vitesse native jugées trop lentes.
const PLAYBACK_RATE = 1.7;
// Seuils du détourage fond vert (voir note en tête de fichier) : écart
// mesuré sur les vraies vidéos entre le fond (spill ≈ 236) et le sujet
// (spill négatif) — larges marges des deux côtés, feather de quelques
// pixels seulement pour l'anti-crénelage du bord réel (~1-2px mesurés).
const KEY_LOW = 60;
const KEY_HIGH = 160;
// Résolution du canvas de travail utilisé pour le détourage, relative à la
// résolution d'affichage — retour client ("pas très fluide en vrai") : la
// lecture/écriture pixel par pixel en pleine résolution (jusqu'à ~2M
// pixels par frame en desktop, DPR 2) coûtait trop cher à 24-60 im/s.
// 0.6 ramène ça à ~36% des pixels, quasiment sans perte visible une fois
// le résultat réagrandi (lissage bilinéaire natif du canvas).
const KEY_SCALE = 0.6;

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
  // Miroir synchrone de `activeStep` : la boucle vit dans un `useEffect`
  // dont les closures ne voient jamais l'état React à jour. Le bouton
  // "avancer" (déclenché par un clic, donc en dehors du cycle de rendu)
  // a besoin de connaître l'étape courante au moment du clic, pas celle
  // capturée à la création de l'effet.
  const currentStepRef = useRef<0 | 1 | 2>(0);
  // Rempli par l'effet ci-dessous : permet au bouton "avancer" (JSX) de
  // déclencher la même mécanique de transition que la boucle automatique,
  // sans dupliquer cette mécanique ni la sortir de l'effet.
  const skipForwardRef = useRef<(() => void) | null>(null);
  // Canvas hors-écran réutilisé d'une frame à l'autre : reçoit le sujet
  // détouré (couleurs + alpha du fond vert) avant d'être composé par
  // `drawImage` sur le canvas visible, par-dessus l'ombre synthétique.
  // `putImageData` remplace des pixels bruts sans composer avec l'alpha —
  // il lui faut donc sa propre surface, distincte du canvas final.
  const objectCanvasRef = useRef<HTMLCanvasElement | null>(null);

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
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Le détourage (lecture/écriture pixel par pixel) tourne sur un canvas
    // de travail réduit (`KEY_SCALE`), pas sur la pleine résolution
    // d'affichage — c'était trop de calcul par frame ("pas très fluide en
    // vrai"), voir note en tête de fichier. Le canvas final reste net : le
    // `drawImage` de recomposition, lui, dessine à la pleine résolution
    // d'affichage, avec le lissage bilinéaire natif du canvas.
    const workWidth = Math.max(1, Math.round(canvas.width * KEY_SCALE));
    const workHeight = Math.max(1, Math.round(canvas.height * KEY_SCALE));

    if (!objectCanvasRef.current) {
      objectCanvasRef.current = document.createElement("canvas");
    }
    const objectCanvas = objectCanvasRef.current;
    if (objectCanvas.width !== workWidth || objectCanvas.height !== workHeight) {
      objectCanvas.width = workWidth;
      objectCanvas.height = workHeight;
    }
    const octx = objectCanvas.getContext("2d", { willReadFrequently: true });
    if (!octx) return;

    octx.clearRect(0, 0, workWidth, workHeight);
    octx.drawImage(video, 0, 0, workWidth, workHeight);

    const frame = octx.getImageData(0, 0, workWidth, workHeight);
    const data = frame.data;
    let minX = workWidth;
    let maxX = 0;
    let minY = workHeight;
    let maxY = 0;
    let hasSubject = false;

    for (let y = 0; y < workHeight; y++) {
      const rowStart = y * workWidth;
      for (let x = 0; x < workWidth; x++) {
        const i = (rowStart + x) * 4;
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        // Dominance du vert : le fond de ces tournages est un vert pur
        // (~rgb(19,255,8)), sans ambiguïté possible avec les teintes
        // bois/crème du sujet (canal rouge toujours dominant ou égal chez
        // lui). Voir la note en tête de fichier.
        const spill = g - Math.max(r, b);
        let alpha: number;
        if (spill >= KEY_HIGH) {
          alpha = 0;
        } else if (spill <= KEY_LOW) {
          alpha = 1;
        } else {
          alpha = 1 - (spill - KEY_LOW) / (KEY_HIGH - KEY_LOW);
        }
        if (alpha > 0 && spill > 0) {
          // Suppression de spill : sur les pixels de bord (partiellement
          // transparents, mais aussi certains pixels devenus pleinement
          // opaques après compression) le vert du fond déteint un peu sur
          // la couleur du sujet — plafonner le canal vert évite un liseré
          // verdâtre une fois composé sur le nouveau fond. Sans effet sur
          // les pixels bien à l'intérieur du sujet (vert déjà sous
          // max(rouge, bleu) chez lui, `min` ne change rien).
          data[i + 1] = Math.min(g, Math.max(r, b));
        }
        data[i + 3] = Math.round(alpha * 255);
        if (alpha > 0.5) {
          hasSubject = true;
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
        }
      }
    }
    octx.putImageData(frame, 0, 0);

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (hasSubject) {
      // Ombre resynthétisée : ces tournages n'en ont pas (le sujet
      // "flotte" sur le vert). Recalculée à partir de la boîte englobante
      // du sujet à CETTE frame (remise à l'échelle du canvas de travail
      // réduit vers le canvas d'affichage) — elle suit donc naturellement
      // la largeur et la position réelles pendant toute la métamorphose.
      const toDisplay = 1 / KEY_SCALE;
      const dMinX = minX * toDisplay;
      const dMaxX = maxX * toDisplay;
      const dMaxY = maxY * toDisplay;
      const bboxWidth = dMaxX - dMinX;
      // Largeur LÉGÈREMENT SUPÉRIEURE à la boîte englobante, jamais
      // inférieure : sinon l'ombre reste entièrement cachée derrière
      // l'objet opaque (dessiné juste après, par-dessus) pour toute forme
      // à base plate (bois, maison) — leur silhouette occupe déjà toute la
      // largeur de la boîte jusqu'en bas, contrairement au disque de
      // l'horloge qui s'arrondit vers un point et laissait l'ombre dépasser
      // sur les côtés. Un dépassement garanti la rend visible pour les 3.
      const shadowWidth = bboxWidth * 1.12;
      const shadowHeight = shadowWidth * 0.14;
      const centerX = (dMinX + dMaxX) / 2;
      const shadowY = dMaxY - shadowHeight * 0.1;

      ctx.save();
      ctx.translate(centerX, shadowY);
      ctx.scale(1, shadowHeight / shadowWidth);
      const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, shadowWidth / 2);
      gradient.addColorStop(0, "rgba(26, 22, 20, 0.3)");
      gradient.addColorStop(1, "rgba(26, 22, 20, 0)");
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(0, 0, shadowWidth / 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    ctx.drawImage(objectCanvas, 0, 0, workWidth, workHeight, 0, 0, canvas.width, canvas.height);
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

    // `setActiveStep` seul ne suffit pas au bouton "avancer" : il ne verra
    // jamais la valeur mise à jour (fermeture figée au montage de
    // l'effet). Chaque bascule d'étape passe donc par ce helper, qui met
    // aussi à jour `currentStepRef` en plus de l'état React.
    const goToStep = (step: 0 | 1 | 2) => {
      currentStepRef.current = step;
      setActiveStep(step);
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

    // Vrai pendant toute la durée d'une transition (vidéo en cours de
    // lecture, du premier appel de `playTransition` jusqu'au changement
    // d'étape) — empêche le bouton "avancer" de déclencher une 2e
    // transition par-dessus celle déjà en cours (double-clic, ou clic
    // pendant la lecture).
    let transitioning = false;

    const scheduleHold = (step: 0 | 1 | 2) => {
      holdTimeout = setTimeout(() => {
        if (cancelled) return;
        playTransition(step);
      }, HOLD_MS);
    };

    const playTransition = (fromStep: 0 | 1 | 2) => {
      transitioning = true;
      const video = videos[fromStep];
      const toStep = (((fromStep + 1) % 3) as 0 | 1 | 2);

      const start = () => {
        if (cancelled) return;
        video.playbackRate = PLAYBACK_RATE;
        video.play().catch(() => {});
        hardStop = setTimeout(() => {
          stopRaf();
          video.pause();
          transitioning = false;
          goToStep(toStep);
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
            transitioning = false;
            goToStep(toStep);
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

    // Bouton "avancer" (frise, clic manuel) : coupe l'attente en cours et
    // lance tout de suite la transition suivante — pour les clients qui
    // ne veulent pas attendre la boucle automatique. Ignoré si une
    // transition est déjà en train de jouer (évite les doubles-déclenchements).
    skipForwardRef.current = () => {
      if (cancelled || transitioning || !started) return;
      if (holdTimeout) {
        clearTimeout(holdTimeout);
        holdTimeout = null;
      }
      playTransition(currentStepRef.current);
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
      goToStep(0);
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
      skipForwardRef.current = null;
    };
  }, [prefersReducedMotion, drawFrame]);

  const step = STEPS[activeStep];

  return (
    <section id="concept" className="relative overflow-hidden py-28">
      <div className="relative mx-auto max-w-6xl px-6">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-20">
          <div
            ref={containerRef}
            className="relative order-2 mx-auto aspect-square w-full max-w-md lg:order-1 lg:max-w-none"
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

          <div className="order-1 lg:order-2">
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

            <div className="mt-14 flex items-center gap-6 sm:mt-16">
              <div className="flex-1">
                <div className="relative h-px w-full bg-encre-douce/15">
                  <motion.div
                    className="absolute inset-y-0 w-1/3 bg-laiton"
                    animate={{ left: `${(activeStep * 100) / 3}%` }}
                    transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                  />
                  {/* Un point au centre de chaque tiers : marque la position
                      exacte de chaque étape sur la frise plutôt qu'une simple
                      barre pleine, cohérent avec une vraie séquence 01→02→03. */}
                  {STEPS.map((s, i) => (
                    <span
                      key={s.id}
                      aria-hidden
                      className={`absolute top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full transition-all duration-300 ${
                        i < activeStep
                          ? "h-1.5 w-1.5 bg-laiton"
                          : i === activeStep
                            ? "h-2.5 w-2.5 bg-laiton shadow-[0_0_0_4px_rgba(173,138,85,0.18)]"
                            : "h-1.5 w-1.5 border border-encre-douce/30 bg-brume"
                      }`}
                      style={{ left: `${((i + 0.5) * 100) / 3}%` }}
                    />
                  ))}
                </div>
                <div className="mt-4 grid grid-cols-3">
                  {STEPS.map((s, i) => (
                    <div
                      key={s.id}
                      className="flex flex-col items-center gap-1 text-center"
                    >
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

              {!prefersReducedMotion && (
                <motion.button
                  type="button"
                  onClick={() => skipForwardRef.current?.()}
                  whileTap={{ scale: 0.9 }}
                  whileHover={{ scale: 1.05 }}
                  aria-label="Passer à l'étape suivante"
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-laiton/40 text-laiton transition-colors duration-300 hover:border-laiton hover:bg-laiton/10"
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={1.5}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-4 w-4"
                  >
                    <path d="M4 12h15M13 6l6 6-6 6" />
                  </svg>
                </motion.button>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
