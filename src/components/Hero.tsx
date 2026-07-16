"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { HERO_MEDIA } from "@/lib/media";

/**
 * Hero avec vidéo pilotée par le scroll, jamais lue en autoplay.
 *
 * Technique : plutôt que de forcer video.currentTime à chaque frame de
 * scroll (un seek aléatoire loin de la dernière image-clé force un
 * redécodage coûteux — c'est ce qui saccadait, même en throttlant la
 * fréquence des seeks), on laisse le décodeur travailler dans son mode le
 * moins coûteux : la lecture séquentielle.
 *
 * En scrollant vers l'avant, on appelle video.play() avec un playbackRate
 * proportionnel au retard à rattraper (le décodeur avance frame par frame,
 * ce qu'il fait nativement bien) puis on pause dès que la cible est
 * atteinte. Le scroll vers l'arrière ne peut pas jouer la vidéo à l'envers
 * — il retombe sur des seeks, mais throttlés ET limités à un petit pas à
 * chaque fois (jamais un saut direct vers la cible), pour rester dans le
 * même esprit que l'avant : des mouvements courts et rapprochés plutôt que
 * des sauts coûteux.
 */
export default function Hero() {
  const sectionRef = useRef<HTMLElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const waveRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const section = sectionRef.current;
    const video = videoRef.current;
    if (!section || !video) return;

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    if (prefersReducedMotion) return;

    let duration = 0;
    let ready = false;
    let lastSeekAt = 0;
    let playPending = false;
    let waveRevealed = false;

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
      video.play().catch(() => {}).finally(() => {
        playPending = false;
      });
    };

    const tick = () => {
      rafRef.current = null;
      const progress = getProgress();

      // La vague se révèle une seule fois, en douceur, sur le tout dernier
      // bout du scroll — indépendant de l'état de la vidéo (transition CSS
      // pure sur un simple toggle de classe).
      if (waveRef.current) {
        if (!waveRevealed && progress > 0.92) {
          waveRevealed = true;
          waveRef.current.classList.add("wave-revealed");
        } else if (waveRevealed && progress < 0.88) {
          waveRevealed = false;
          waveRef.current.classList.remove("wave-revealed");
        }
      }

      if (!ready) {
        rafRef.current = requestAnimationFrame(tick);
        return;
      }

      const targetTime = Math.min(progress * duration, duration - 0.05);
      const diff = targetTime - video.currentTime;

      if (Math.abs(diff) < 0.06) {
        if (!video.paused) video.pause();
      } else if (diff > 0) {
        // Scroll vers l'avant : lecture séquentielle accélérée, jamais de seek.
        video.playbackRate = Math.min(Math.max(diff / 0.4, 1), 6);
        safePlay();
      } else {
        // Scroll vers l'arrière : pas de lecture inversée possible. Seek
        // throttlé ET limité à un petit pas à chaque fois (jamais un saut
        // direct vers la cible, qui peut être loin et donc coûteux) — la
        // vidéo rattrape le scroll arrière par petites étapes rapprochées.
        if (!video.paused) video.pause();
        const now = performance.now();
        if (now - lastSeekAt >= 120) {
          lastSeekAt = now;
          const step = Math.max(diff, -0.25);
          const nextTime = Math.max(0, video.currentTime + step);
          try {
            video.currentTime = nextTime;
          } catch {
            // Pas encore seekable — on retentera au prochain tick.
          }
        }
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      video.removeEventListener("loadedmetadata", checkReady);
      video.removeEventListener("canplay", checkReady);
      video.removeEventListener("progress", checkReady);
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      video.pause();
    };
  }, []);

  return (
    <section ref={sectionRef} className="relative h-[320vh]">
      <div className="sticky top-0 h-screen w-full overflow-hidden bg-encre">
        <video
          ref={videoRef}
          className="absolute inset-0 h-full w-full object-cover"
          src={HERO_MEDIA.videoUrl}
          poster={HERO_MEDIA.posterUrl}
          muted
          playsInline
          preload="auto"
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

        {/* Vague en verre : transition entre le hero et la section
            suivante, pour ne jamais couper net le visuel. Se révèle en
            douceur sur le dernier bout du scroll (cf. tick()). */}
        <svg aria-hidden className="absolute h-0 w-0">
          <defs>
            <clipPath id="hero-wave-clip" clipPathUnits="objectBoundingBox">
              <path d="M0,0.55 C0.22,0.85 0.38,0.15 0.58,0.45 C0.72,0.65 0.88,0.25 1,0.5 L1,1 L0,1 Z" />
            </clipPath>
          </defs>
        </svg>
        <div
          ref={waveRef}
          aria-hidden
          className="glass wave-shape pointer-events-none absolute inset-x-0 bottom-0 z-[6] h-24 sm:h-32"
          style={{ clipPath: "url(#hero-wave-clip)" }}
        />
      </div>
    </section>
  );
}
