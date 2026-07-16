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
    let waveRevealed = false;

    const bucketOf = (t: number) => Math.round(t / CACHE_BUCKET);

    const checkReady = () => {
      duration = video.duration || 0;
      ready =
        Number.isFinite(duration) &&
        duration > 0 &&
        video.readyState >= video.HAVE_FUTURE_DATA;
      if (ready && canvas.width === 0) {
        canvas.width = video.videoWidth || 1280;
        canvas.height = video.videoHeight || 720;
      }
    };

    video.addEventListener("loadedmetadata", checkReady);
    video.addEventListener("canplay", checkReady);
    video.addEventListener("progress", checkReady);
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
      ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
      displayedTime = time;
      return true;
    };

    const tick = () => {
      rafRef.current = null;
      const progress = getProgress();

      // La vague se révèle une seule fois, en douceur, sur le tout dernier
      // bout du scroll — indépendant de l'état de la vidéo.
      if (waveRef.current) {
        if (!waveRevealed && progress > 0.92) {
          waveRevealed = true;
          waveRef.current.classList.add("wave-revealed");
        } else if (waveRevealed && progress < 0.88) {
          waveRevealed = false;
          waveRef.current.classList.remove("wave-revealed");
        }
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

    const start = () => {
      if (cancelled) return;
      if (!ready) {
        rafRef.current = requestAnimationFrame(start);
        return;
      }
      runWarmup();
      rafRef.current = requestAnimationFrame(tick);
    };

    start();

    return () => {
      cancelled = true;
      video.removeEventListener("loadedmetadata", checkReady);
      video.removeEventListener("canplay", checkReady);
      video.removeEventListener("progress", checkReady);
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

        <div className="relative z-10 flex h-full w-full flex-col items-center justify-center px-6 text-center">
          <p className="eyebrow mb-6 text-xs text-brume sm:text-sm">
            Bellora
          </p>
          <h1 className="max-w-5xl text-[12vw] leading-[1.02] font-semibold text-brume sm:text-[8vw] lg:text-[96px]">
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

        {/* Vague : une fine ligne de lumière liquid glass qui trace le bord
            entre le hero et la section suivante, teintée comme le fond de
            la catégorie qui suit (brume). Se révèle en douceur sur le tout
            dernier bout du scroll (cf. tick()). */}
        <svg aria-hidden className="absolute h-0 w-0">
          <defs>
            <clipPath id="hero-wave-clip" clipPathUnits="objectBoundingBox">
              <path d="M0,0.55 C0.22,0.85 0.38,0.15 0.58,0.45 C0.72,0.65 0.88,0.25 1,0.5 L1,0.62 C0.88,0.37 0.72,0.77 0.58,0.57 C0.38,0.27 0.22,0.97 0,0.67 Z" />
            </clipPath>
          </defs>
        </svg>
        <div
          ref={waveRef}
          aria-hidden
          className="wave-shape wave-line pointer-events-none absolute inset-x-0 bottom-0 z-[6] h-24 sm:h-32"
          style={{ clipPath: "url(#hero-wave-clip)" }}
        />
      </div>
    </section>
  );
}
