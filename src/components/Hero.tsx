"use client";

import { Fragment, useEffect, useRef } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import GlassPanel from "./GlassPanel";
import { HERO_MEDIA } from "@/lib/media";

// Courbe "ease-out-expo" : un départ franc qui ralentit en douceur vers la
// fin, la même utilisée ailleurs sur le site pour les mouvements d'entrée
// premium (cohérence de la signature de mouvement).
const PREMIUM_EASE = [0.16, 1, 0.3, 1] as const;

const fadeUp = {
  hidden: { opacity: 0, y: 22 },
  visible: { opacity: 1, y: 0 },
};

const wordContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.09, delayChildren: 0.3 } },
};

const wordItem = {
  hidden: { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0 },
};

const TITLE_WORDS = [
  { text: "Une" },
  { text: "qualité" },
  { text: "aussi" },
  { text: "noble", accent: true },
  { text: "que" },
  { text: "notre" },
  { text: "engagement." },
];

function ArrowIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className="h-4 w-4 shrink-0"
    >
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}

const CACHE_BUCKET = 0.2;

/**
 * Hero avec vidéo pilotée par le scroll, jamais lue en autoplay.
 *
 * Le scroll vers l'avant pilote video.play() + un playbackRate proportionnel
 * au retard à rattraper : lecture séquentielle, que les décodeurs gèrent
 * nativement bien — confirmé fluide.
 *
 * Le scroll vers l'arrière ne peut pas jouer la vidéo à l'envers, et un seek
 * loin de la dernière image-clé reste un redécodage coûteux quel que soit le
 * throttle. Plutôt qu'un warmup complet bloquant (essayé et abandonné : ça
 * figeait le hero plusieurs secondes le temps de lire toute la vidéo avant
 * d'activer le scroll), le cache se construit de façon opportuniste et non
 * bloquante : chaque fois que la vidéo joue vers l'avant (le cas normal),
 * on capture une image toutes les 0.2s via createImageBitmap — gratuit,
 * puisque le décodeur a de toute façon déjà cette frame sous la main pour
 * l'affichage. Le scroll vers l'arrière pioche dans ce cache s'il a de quoi
 * (dessiné sur un <canvas>) ; sinon repli sur le seek throttlé habituel,
 * jamais pire qu'avant.
 */
const WAVE_REVEAL_START = 0.52;
const WAVE_REVEAL_END = 1;
const SEEK_THROTTLE_MS = 110;
const SEEK_STEP_CAP = 0.22;

export default function Hero() {
  const sectionRef = useRef<HTMLElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const waveRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    const section = sectionRef.current;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!section || !video || !canvas) return;

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    if (prefersReducedMotion) return;

    const ctx = canvas.getContext("2d");
    const canUseCache = typeof window.createImageBitmap === "function";
    const frameCache = new Map<number, ImageBitmap>();
    const bucketOf = (t: number) => Math.round(t / CACHE_BUCKET);

    let cancelled = false;
    let duration = 0;
    let ready = false;
    let lastSeekAt = 0;
    let playPending = false;
    let showingCanvas = false;
    let capturingFrame = false;
    // Suit la position "affichée" d'une frame à l'autre — jamais recalculée
    // à partir de `progress` directement (ça collapserait diff à ~0 en
    // continu dès qu'on affiche le canvas et figerait tout : c'est le bug
    // qui faisait geler le scroll arrière après la toute première image).
    let displayedTime = 0;

    const checkReady = () => {
      duration = video.duration || 0;
      ready =
        Number.isFinite(duration) &&
        duration > 0 &&
        video.readyState >= video.HAVE_FUTURE_DATA;
    };

    video.addEventListener("loadedmetadata", checkReady);
    video.addEventListener("canplay", checkReady);
    video.addEventListener("progress", checkReady);
    checkReady();

    // Capture opportuniste : ne bloque jamais rien, se contente de garnir le
    // cache pendant que la vidéo joue déjà normalement vers l'avant.
    const maybeCaptureFrame = () => {
      if (!canUseCache || capturingFrame || video.paused || video.seeking) {
        return;
      }
      const bucket = bucketOf(video.currentTime);
      if (frameCache.has(bucket)) return;
      capturingFrame = true;
      createImageBitmap(video)
        .then((bitmap) => {
          if (cancelled || frameCache.has(bucket)) {
            bitmap.close();
            return;
          }
          frameCache.set(bucket, bitmap);
        })
        .catch(() => {
          // Pas grave : ce bucket restera absent, le scroll arrière
          // retombera sur le seek s'il tombe pile dessus.
        })
        .finally(() => {
          capturingFrame = false;
        });
    };
    video.addEventListener("timeupdate", maybeCaptureFrame);

    const resizeCanvas = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = Math.round(window.innerWidth * dpr);
      const h = Math.round(window.innerHeight * dpr);
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
        if (ctx) {
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = "high";
        }
      }
    };
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    const getProgress = () => {
      const rect = section.getBoundingClientRect();
      const scrollable = rect.height - window.innerHeight;
      return scrollable > 0
        ? Math.min(Math.max(-rect.top / scrollable, 0), 1)
        : 0;
    };

    const safePlay = () => {
      if (playPending || !video.paused) return;
      playPending = true;
      video
        .play()
        .catch(() => {})
        .finally(() => {
          playPending = false;
        });
    };

    const showVideoLayer = () => {
      if (!showingCanvas) return;
      showingCanvas = false;
      canvas.style.opacity = "0";
      video.style.opacity = "1";
    };

    const showCanvasLayer = () => {
      if (showingCanvas) return;
      showingCanvas = true;
      video.style.opacity = "0";
      canvas.style.opacity = "1";
    };

    const drawCachedFrame = (time: number) => {
      if (!ctx) return false;
      const bucket = bucketOf(time);
      let bitmap = frameCache.get(bucket);
      for (let d = 1; d <= 3 && !bitmap; d++) {
        bitmap = frameCache.get(bucket - d) || frameCache.get(bucket + d);
      }
      if (!bitmap) return false;
      const scale = Math.max(
        canvas.width / bitmap.width,
        canvas.height / bitmap.height
      );
      const sw = canvas.width / scale;
      const sh = canvas.height / scale;
      const sx = (bitmap.width - sw) / 2;
      const sy = (bitmap.height - sh) / 2;
      ctx.drawImage(bitmap, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);
      displayedTime = time;
      return true;
    };

    const tick = () => {
      rafRef.current = null;
      const progress = getProgress();

      // La vague : la forme entière existe toujours (jamais un reveal
      // progressif type clip-path) — elle apparaît par un fondu rapide tout
      // en montant depuis hors-champ, et glisse horizontalement vers la
      // droite en même temps, pour simuler une vague qui bouge. Liée en
      // continu à la progression du scroll, scrubbable dans les deux sens.
      if (waveRef.current) {
        const waveProgress = Math.min(
          Math.max(
            (progress - WAVE_REVEAL_START) /
              (WAVE_REVEAL_END - WAVE_REVEAL_START),
            0
          ),
          1
        );
        // Retour client, prise 2 : accélérer la fenêtre (essayé au round
        // précédent) ne suffisait pas — le glissement se terminait tôt puis
        // la vague restait immobile pendant le reste du scroll, donc rien
        // à percevoir comme "mouvement" une fois l'apparition passée. Ce
        // que le client demande, c'est un vrai glissement vers la gauche,
        // visible en continu tant qu'on scrolle dans la fenêtre — pas un
        // réglage fin puis un arrêt. Fondu et montée se terminent vite
        // (apparition nette), mais le glissement horizontal, lui, dure
        // maintenant tout le long de `waveProgress` (0 → 1) au lieu de
        // s'arrêter à 55% : la vague continue de glisser vers la gauche
        // (X de plus en plus négatif) sur toute la fenêtre de scroll, avec
        // une amplitude augmentée (34% au lieu de 26%) pour que ce
        // glissement soit sans ambiguïté perceptible.
        const opacity = Math.min(waveProgress / 0.08, 1);
        const riseY = (1 - Math.min(waveProgress / 0.2, 1)) * 100;
        const driftX = -waveProgress * 34;
        waveRef.current.style.opacity = String(opacity);
        waveRef.current.style.transform = `translate(${driftX}%, ${riseY}%)`;
      }

      if (!ready) {
        rafRef.current = requestAnimationFrame(tick);
        return;
      }

      if (!showingCanvas) {
        displayedTime = video.currentTime;
      }
      const targetTime = Math.min(progress * duration, duration - 0.05);
      const diff = targetTime - displayedTime;

      if (Math.abs(diff) < 0.06) {
        if (!video.paused) video.pause();
      } else if (diff > 0) {
        // Avant : on repasse sur la vraie vidéo (un seul seek de sync si on
        // venait du canvas), puis lecture séquentielle accélérée.
        if (showingCanvas) {
          try {
            video.currentTime = displayedTime;
          } catch {
            // ignore
          }
          showVideoLayer();
        }
        video.playbackRate = Math.min(Math.max(diff / 0.4, 1), 6);
        safePlay();
      } else {
        // Arrière : cache d'abord (aucun seek), repli sur seek throttlé sinon.
        if (!video.paused) video.pause();
        const drew = drawCachedFrame(Math.max(0, targetTime));
        if (drew) {
          showCanvasLayer();
        } else {
          showVideoLayer();
          const now = performance.now();
          if (now - lastSeekAt >= SEEK_THROTTLE_MS) {
            lastSeekAt = now;
            const step = Math.max(diff, -SEEK_STEP_CAP);
            const nextTime = Math.max(0, video.currentTime + step);
            try {
              video.currentTime = nextTime;
            } catch {
              // ignore
            }
          }
        }
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      cancelled = true;
      video.removeEventListener("loadedmetadata", checkReady);
      video.removeEventListener("canplay", checkReady);
      video.removeEventListener("progress", checkReady);
      video.removeEventListener("timeupdate", maybeCaptureFrame);
      window.removeEventListener("resize", resizeCanvas);
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      video.pause();
      frameCache.forEach((bitmap) => bitmap.close());
      frameCache.clear();
    };
  }, []);

  return (
    <section ref={sectionRef} className="relative h-[320vh]">
      <div className="sticky top-0 h-screen w-full overflow-hidden bg-encre">
        {/* Pas d'attribut poster : l'image de référence et la première
            frame de la vidéo sont deux plans différents (angle, cadrage) —
            les montrer l'un après l'autre créait un cut visible au moindre
            scroll. Seule la vidéo elle-même s'affiche, jamais une autre
            image à la place. */}
        <video
          ref={videoRef}
          className="absolute inset-0 h-full w-full object-cover transition-opacity duration-150"
          src={HERO_MEDIA.videoUrl}
          muted
          playsInline
          preload="auto"
        />
        {/* Canvas du cache de frames : ne s'affiche que quand on scrolle
            vers l'arrière et qu'une image y a déjà été capturée pendant la
            lecture avant (cf. useEffect). Invisible sinon. */}
        <canvas
          ref={canvasRef}
          aria-hidden
          className="absolute inset-0 h-full w-full object-cover opacity-0 transition-opacity duration-150"
        />

        {/* Voile très léger, uniquement pour garantir la lisibilité du texte — jamais un dégradé de couleur plat en remplacement de la photo. */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-encre/15 via-transparent to-transparent" />

        <div className="relative z-10 flex h-full w-full flex-col items-start justify-center px-6 text-left sm:px-12 lg:px-20">
          <motion.p
            initial={prefersReducedMotion ? false : "hidden"}
            animate="visible"
            variants={fadeUp}
            transition={{ duration: 0.7, delay: 0.15, ease: PREMIUM_EASE }}
            className="eyebrow mb-6 text-xs text-brume sm:text-sm"
          >
            Bellora
          </motion.p>
          <motion.h1
            initial={prefersReducedMotion ? false : "hidden"}
            animate="visible"
            variants={wordContainer}
            className="max-w-2xl text-[11vw] leading-[1.05] font-semibold text-brume sm:text-[6.5vw] lg:text-[72px]"
          >
            {TITLE_WORDS.map((word, i) => (
              // Fragment plutôt qu'un wrapper : le <br> forcé avant "que"
              // (seul sur mobile — le retour à la ligne y tombait mal, le
              // mot isolé en fin de ligne) doit rester un frère direct des
              // mots dans le flux du titre, pas un enfant d'un conteneur
              // qui casserait le wrap naturel des autres mots.
              <Fragment key={word.text}>
                {word.text === "que" && <br aria-hidden className="sm:hidden" />}
                <motion.span
                  variants={wordItem}
                  transition={{ duration: 0.55, ease: PREMIUM_EASE }}
                  className={`inline-block ${word.accent ? "text-laiton" : ""}`}
                >
                  {word.text}
                  {i < TITLE_WORDS.length - 1 ? " " : ""}
                </motion.span>
              </Fragment>
            ))}
          </motion.h1>

          <motion.div
            initial={prefersReducedMotion ? false : "hidden"}
            animate="visible"
            variants={fadeUp}
            transition={{ duration: 0.7, delay: 1.05, ease: PREMIUM_EASE }}
            className="mt-11"
          >
            <GlassPanel
              as={Link}
              href="/#gammes"
              tone="dark"
              rounded="rounded-full"
              className="hero-cta flex items-center gap-8 py-4 pl-8 pr-7 text-base"
            >
              <span>Découvrir nos gammes</span>
              <ArrowIcon />
            </GlassPanel>
          </motion.div>
        </div>

        <div
          aria-hidden
          className="absolute bottom-10 left-1/2 z-10 h-12 w-px -translate-x-1/2 bg-gradient-to-b from-brume/70 to-transparent"
        />

        {/* Vague : un aplat plein teinté brume (couleur du fond de la
            section suivante) avec un contour lumineux en liquid glass —
            pas toute la forme en verre, seulement son bord. Collée au bas
            du hero (le haut de la section suivante). Plus large que
            l'écran (bords cachés par l'overflow-hidden du conteneur
            sticky) pour pouvoir glisser horizontalement sans jamais
            découvrir de bord vide. Toujours entière : jamais un reveal
            progressif, seulement un fondu + une montée + un glissement
            (cf. tick()). */}
        <div
          ref={waveRef}
          aria-hidden
          className="wave-reveal pointer-events-none absolute bottom-0 z-[6] h-32 sm:h-48"
          style={{
            left: "-12%",
            right: "-12%",
            opacity: 0,
            transform: "translate(-6%, 100%)",
          }}
        >
          <svg
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            className="h-full w-full overflow-visible"
          >
            <path
              className="wave-fill"
              d="M0,58 C14,86 26,22 42,50 C52,66 60,32 72,54 C80,68 88,36 100,52 L100,100 L0,100 Z"
            />
            <path
              className="wave-rim"
              vectorEffect="non-scaling-stroke"
              d="M0,58 C14,86 26,22 42,50 C52,66 60,32 72,54 C80,68 88,36 100,52"
            />
          </svg>
        </div>
      </div>
    </section>
  );
}
