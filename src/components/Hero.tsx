"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { HERO_MEDIA } from "@/lib/media";

/**
 * Hero avec vidéo scrubée par le scroll (technique Apple), jamais lue en
 * autoplay. La progression du scroll (0→1) sur la hauteur de la section
 * pilote video.currentTime.
 *
 * La vidéo source (générée) n'a probablement une image-clé que toutes les
 * 1-2s : chaque seek loin d'une keyframe force un redécodage depuis celle-ci,
 * ce qui devient très coûteux si on seek à chaque frame de scroll (jusqu'à
 * 60×/s). On privilégie ici la fluidité sur la précision 1:1 scroll↔frame :
 * seeks espacés d'au moins MIN_SEEK_INTERVAL_MS, chacun limité à
 * MAX_STEP_SECONDS de déplacement. La vidéo "rattrape" son retard en douceur
 * plutôt que de suivre le scroll au pixel près — c'est un compromis
 * volontaire (mieux vaut un léger décalage perçu qu'une saccade), pas un
 * réglage définitif : si ça reste saccadé, la vraie correction est de
 * ré-encoder la vidéo avec une image-clé par frame (voir README).
 */
const MIN_SEEK_INTERVAL_MS = 180;
const MAX_STEP_SECONDS = 0.18;
const EASE = 0.3;

export default function Hero() {
  const sectionRef = useRef<HTMLElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const grassRef = useRef<HTMLDivElement>(null);
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
    let appliedTime = 0;
    let lastSeekAt = 0;

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

    const tick = () => {
      rafRef.current = null;
      const progress = getProgress();

      // L'herbe entre en scène sur le dernier quart du scroll, comme si le
      // drone se posait au ras du sol. Transform CSS pur, indépendant de
      // l'état de la vidéo.
      if (grassRef.current) {
        const grassProgress = Math.min(
          Math.max((progress - 0.72) / 0.28, 0),
          1
        );
        grassRef.current.style.transform = `translateY(${(1 - grassProgress) * 100}%)`;
      }

      let settled = true;

      if (ready) {
        const targetTime = Math.min(progress * duration, duration - 0.05);
        const diff = targetTime - appliedTime;

        if (Math.abs(diff) > 0.01) {
          settled = false;
          const now = performance.now();
          if (now - lastSeekAt >= MIN_SEEK_INTERVAL_MS) {
            const step =
              Math.sign(diff) *
              Math.min(Math.abs(diff) * EASE, MAX_STEP_SECONDS);
            appliedTime = Math.max(0, Math.min(appliedTime + step, duration));
            lastSeekAt = now;
            try {
              if (typeof video.fastSeek === "function") {
                video.fastSeek(appliedTime);
              } else {
                video.currentTime = appliedTime;
              }
            } catch {
              // Seek refusé (vidéo pas encore seekable) — on retentera au
              // prochain tick, rien d'autre à faire ici.
            }
          }
        }
      }

      // On continue de "tiquer" tant que la vidéo n'a pas rattrapé sa
      // cible, même après la fin du scroll — l'effet de rattrapage doux
      // est voulu, pas un bug.
      if (!settled) {
        rafRef.current = requestAnimationFrame(tick);
      }
    };

    const onScroll = () => {
      if (rafRef.current === null) {
        rafRef.current = requestAnimationFrame(tick);
      }
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    onScroll();

    return () => {
      video.removeEventListener("loadedmetadata", checkReady);
      video.removeEventListener("canplay", checkReady);
      video.removeEventListener("progress", checkReady);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
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
          ref={grassRef}
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 z-[5] h-[32vh] min-h-[180px] overflow-hidden will-change-transform"
          style={{
            transform: "translateY(100%)",
            maskImage:
              "radial-gradient(ellipse 80% 100% at 50% 100%, black 45%, transparent 100%)",
            WebkitMaskImage:
              "radial-gradient(ellipse 80% 100% at 50% 100%, black 45%, transparent 100%)",
          }}
        >
          <Image
            src={HERO_MEDIA.grassUrl}
            alt=""
            fill
            priority
            sizes="100vw"
            className="object-cover object-bottom"
          />
        </div>

        <div
          aria-hidden
          className="absolute bottom-10 left-1/2 z-10 h-12 w-px -translate-x-1/2 bg-gradient-to-b from-brume/70 to-transparent"
        />
      </div>
    </section>
  );
}
