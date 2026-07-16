"use client";

import { useEffect, useRef } from "react";
import { HERO_MEDIA } from "@/lib/media";

/**
 * Hero avec vidéo scrubée par le scroll (technique Apple), jamais lue en
 * autoplay. La progression du scroll (0→1) sur la hauteur de la section
 * pilote directement video.currentTime.
 */
export default function Hero() {
  const sectionRef = useRef<HTMLElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
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
    const onLoadedMetadata = () => {
      duration = video.duration || 0;
    };
    video.addEventListener("loadedmetadata", onLoadedMetadata);
    if (video.readyState >= 1) duration = video.duration || 0;

    const updateFrame = () => {
      rafRef.current = null;
      if (!duration) return;

      const rect = section.getBoundingClientRect();
      const scrollable = rect.height - window.innerHeight;
      const progress =
        scrollable > 0
          ? Math.min(Math.max(-rect.top / scrollable, 0), 1)
          : 0;

      video.currentTime = progress * duration;
    };

    const onScroll = () => {
      if (rafRef.current === null) {
        rafRef.current = requestAnimationFrame(updateFrame);
      }
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    return () => {
      video.removeEventListener("loadedmetadata", onLoadedMetadata);
      window.removeEventListener("scroll", onScroll);
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
        </div>

        <div
          aria-hidden
          className="absolute bottom-10 left-1/2 h-12 w-px -translate-x-1/2 bg-gradient-to-b from-brume/70 to-transparent"
        />
      </div>
    </section>
  );
}
