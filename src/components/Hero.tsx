"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { HERO_MEDIA } from "@/lib/media";

/**
 * Hero avec vidéo pilotée par le scroll, jamais lue en autoplay.
 *
 * Le scroll vers l'avant pilote video.play() + un playbackRate proportionnel
 * au retard à rattraper : lecture séquentielle, que les décodeurs gèrent
 * nativement bien. C'est fluide, mais ça ne marche que dans un sens — une
 * vidéo ne sait pas jouer à l'envers, donc le scroll vers l'arrière devait
 * jusqu'ici retomber sur des seeks, coûteux quelle que soit la façon dont on
 * les throttle (un seek loin de la dernière image-clé force un redécodage).
 *
 * Solution : au chargement, on lit la vidéo une fois en entier, cachée
 * (recouverte par le poster), en capturant une image toutes les 0.2s via
 * createImageBitmap. Le scroll vers l'arrière n'a alors plus besoin de
 * seeker la vidéo du tout : on affiche l'image mise en cache la plus proche
 * sur un <canvas> superposé. Le scroll vers l'avant repasse sur la vraie
 * vidéo (un seul seek de resynchronisation au moment du changement de sens).
 */
const CACHE_BUCKET = 0.2;

// Fenêtre de scroll sur laquelle la vague se révèle : liée en continu à la
// progression du scroll (pas à un seuil + une transition CSS à durée fixe)
// pour que ça ne puisse jamais "manquer de temps" avant la fin du hero, et
// pour que ça se scrub dans les deux sens comme le reste du hero. Se termine
// pile à la fin du scroll (1) plutôt qu'avant : sinon la vague finit son
// mouvement puis reste figée pendant le reste du scroll avant le vrai
// changement de section — ce "temps mort" est ce qui donnait l'impression
// d'une séparation, pas premium.
const WAVE_REVEAL_START = 0.68;
const WAVE_REVEAL_END = 1;

export default function Hero() {
  const sectionRef = useRef<HTMLElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const posterRef = useRef<HTMLImageElement>(null);
  const waveRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const section = sectionRef.current;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const posterEl = posterRef.current;
    if (!section || !video || !canvas) return;

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    if (prefersReducedMotion) return;

    const ctx = canvas.getContext("2d");
    const applySmoothing = () => {
      if (!ctx) return;
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
    };
    applySmoothing();
    const frameCache = new Map<number, ImageBitmap>();
    const canUseCache = typeof window.createImageBitmap === "function";

    let cancelled = false;
    let duration = 0;
    let ready = false;
    let warmedUp = false;
    let displayedTime = 0;
    let showingCanvas = false;
    let lastSeekAt = 0;
    let playPending = false;

    const bucketOf = (t: number) => Math.round(t / CACHE_BUCKET);

    // La résolution interne du canvas est calée sur sa taille d'affichage
    // réelle (× devicePixelRatio), pas sur la résolution native de la
    // vidéo — sinon le navigateur agrandit un bitmap 720p à la taille de
    // l'écran via un simple scale CSS et le résultat pixellise. On calcule
    // nous-mêmes le recadrage "object-cover" dans drawCachedFrame pour que
    // l'image, une fois dessinée, n'ait plus besoin d'être réétirée.
    const resizeCanvas = () => {
      // Le conteneur sticky fait toujours exactement un écran (h-screen).
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = Math.round(window.innerWidth * dpr);
      const h = Math.round(window.innerHeight * dpr);
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
        applySmoothing();
      }
    };

    let warmupStarted = false;
    const checkReady = () => {
      duration = video.duration || 0;
      ready =
        Number.isFinite(duration) &&
        duration > 0 &&
        video.readyState >= video.HAVE_FUTURE_DATA;
      if (ready && canvas.width === 0) {
        resizeCanvas();
      }
      if (ready && !warmupStarted) {
        warmupStarted = true;
        runWarmup();
      }
    };

    video.addEventListener("loadedmetadata", checkReady);
    video.addEventListener("canplay", checkReady);
    video.addEventListener("progress", checkReady);
    window.addEventListener("resize", resizeCanvas);
    checkReady();

    const seekTo = (time: number) =>
      new Promise<void>((resolve) => {
        const onSeeked = () => {
          video.removeEventListener("seeked", onSeeked);
          resolve();
        };
        video.addEventListener("seeked", onSeeked);
        try {
          video.currentTime = time;
        } catch {
          video.removeEventListener("seeked", onSeeked);
          resolve();
        }
      });

    const captureFrame = async (bucket: number) => {
      if (frameCache.has(bucket)) return;
      try {
        const bitmap = await createImageBitmap(video);
        if (!cancelled) frameCache.set(bucket, bitmap);
      } catch {
        // Pas grave : ce bucket restera absent du cache, le scroll arrière
        // retombera sur le repli seek plus bas s'il tombe pile dessus.
      }
    };

    const runWarmup = async () => {
      if (!canUseCache) {
        warmedUp = true;
        return;
      }
      const totalBuckets = Math.min(Math.ceil(duration / CACHE_BUCKET), 60);
      for (let b = 0; b <= totalBuckets && !cancelled; b++) {
        const t = Math.min(b * CACHE_BUCKET, Math.max(duration - 0.05, 0));
        await seekTo(t);
        if (cancelled) return;
        await captureFrame(b);
      }
      if (cancelled) return;
      video.pause();
      try {
        video.currentTime = 0;
      } catch {
        // ignore
      }
      warmedUp = true;
    };

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
      for (let d = 1; d <= 5 && !bitmap; d++) {
        bitmap = frameCache.get(bucket - d) || frameCache.get(bucket + d);
      }
      if (!bitmap) return false;
      // Recadrage "object-cover" manuel : la vidéo source (720p, 16:9) et le
      // canvas (résolution écran) n'ont pas forcément le même ratio, et un
      // <canvas> ne connaît pas object-fit. Sans ça le bitmap serait étiré
      // plutôt que recadré, en plus d'être flou.
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

      // La vague : un vrai mouvement (balayage par clip-path), lié en continu
      // à la progression du scroll — indépendant de l'état de la vidéo, et
      // scrubbable dans les deux sens comme le reste du hero. Pas de seuil +
      // transition à durée fixe qui pourrait ne pas avoir le temps de finir.
      if (waveRef.current) {
        const waveProgress = Math.min(
          Math.max(
            (progress - WAVE_REVEAL_START) /
              (WAVE_REVEAL_END - WAVE_REVEAL_START),
            0
          ),
          1
        );
        waveRef.current.style.clipPath = `inset(0 ${(1 - waveProgress) * 100}% 0 0)`;
        waveRef.current.style.transform = `translateY(${(1 - waveProgress) * 14}px)`;
      }

      if (!ready || !warmedUp) {
        rafRef.current = requestAnimationFrame(tick);
        return;
      }

      if (posterEl && posterEl.style.opacity !== "0") {
        posterEl.style.opacity = "0";
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
        // Arrière : on affiche l'image en cache la plus proche, aucun seek.
        if (!video.paused) video.pause();
        const drew = drawCachedFrame(Math.max(0, targetTime));
        if (drew) {
          showCanvasLayer();
        } else {
          // Repli si le cache n'a rien pour cette position (navigateur sans
          // createImageBitmap, par exemple) : seek throttlé et amorti.
          showVideoLayer();
          const now = performance.now();
          if (now - lastSeekAt >= 120) {
            lastSeekAt = now;
            const step = Math.max(diff, -0.25);
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

    // La boucle démarre immédiatement, indépendamment du chargement de la
    // vidéo : la vague (et plus généralement le scroll) ne doit jamais
    // rester figée en attendant que la vidéo soit prête. Le warmup du cache
    // de frames, lui, ne démarre que quand la vidéo est vraiment prête
    // (déclenché depuis checkReady ci-dessus).
    if (!cancelled) {
      rafRef.current = requestAnimationFrame(tick);
    }

    return () => {
      cancelled = true;
      video.removeEventListener("loadedmetadata", checkReady);
      video.removeEventListener("canplay", checkReady);
      video.removeEventListener("progress", checkReady);
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
        <video
          ref={videoRef}
          className="absolute inset-0 h-full w-full object-cover transition-opacity duration-200"
          src={HERO_MEDIA.videoUrl}
          poster={HERO_MEDIA.posterUrl}
          muted
          playsInline
          preload="auto"
        />
        <canvas
          ref={canvasRef}
          aria-hidden
          className="absolute inset-0 h-full w-full object-cover opacity-0 transition-opacity duration-200"
        />
        {/* Recouvre la vidéo pendant la pré-lecture cachée qui remplit le
            cache de frames (sinon on verrait défiler la vidéo en accéléré
            avant que l'utilisateur n'ait même scrollé). */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          ref={posterRef}
          aria-hidden
          src={HERO_MEDIA.posterUrl}
          alt=""
          className="absolute inset-0 h-full w-full object-cover transition-opacity duration-300"
        />

        {/* Voile très léger, uniquement pour garantir la lisibilité du texte — jamais un dégradé de couleur plat en remplacement de la photo. */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-encre/15 via-transparent to-transparent" />

        <div className="relative z-10 flex h-full w-full flex-col items-start justify-center px-6 text-left sm:px-12 lg:px-20">
          <p className="eyebrow mb-6 text-xs text-brume sm:text-sm">
            Bellora
          </p>
          <h1 className="max-w-2xl text-[11vw] leading-[1.05] font-semibold text-brume sm:text-[6.5vw] lg:text-[72px]">
            Une qualité aussi <span className="text-laiton">noble</span> que
            notre engagement.
          </h1>

          <Link
            href="/#gammes"
            className="glass-dark mt-10 rounded-full px-8 py-3 text-sm font-medium text-brume transition-opacity hover:opacity-90"
          >
            Découvrir nos gammes
          </Link>
        </div>

        <div
          aria-hidden
          className="absolute bottom-10 left-1/2 z-10 h-12 w-px -translate-x-1/2 bg-gradient-to-b from-brume/70 to-transparent"
        />

        {/* Vague : un aplat plein teinté brume (couleur du fond de la
            section suivante) avec un contour lumineux en liquid glass —
            pas toute la forme en verre, seulement son bord. Balayée par un
            clip-path lié en continu à la progression du scroll (cf.
            tick()) : un vrai mouvement de vague, jamais un fondu, et ça ne
            peut jamais arriver "en retard" sur la fin du scroll puisque ce
            n'est pas basé sur une durée mais sur la position de scroll. */}
        <div
          ref={waveRef}
          aria-hidden
          className="wave-reveal pointer-events-none absolute inset-x-0 bottom-0 z-[6] h-32 sm:h-48"
          style={{ clipPath: "inset(0 100% 0 0)" }}
        >
          <svg
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            className="h-full w-full overflow-visible"
          >
            <path
              className="wave-fill"
              d="M0,52 C22,80 38,16 58,46 C72,66 88,24 100,50 L100,100 L0,100 Z"
            />
            <path
              className="wave-rim"
              vectorEffect="non-scaling-stroke"
              d="M0,52 C22,80 38,16 58,46 C72,66 88,24 100,50"
            />
          </svg>
        </div>
      </div>
    </section>
  );
}
