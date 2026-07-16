"use client";

import { useEffect, useRef } from "react";
import { HERO_MEDIA } from "@/lib/media";

/**
 * Hero avec vidéo scrubée par le scroll (technique Apple), jamais lue en
 * autoplay. La progression du scroll (0→1) sur la hauteur de la section
 * pilote directement video.currentTime.
 *
 * La vidéo n'est scrubée qu'une fois suffisamment bufferisée (readyState
 * HAVE_FUTURE_DATA+) : chercher un currentTime sur une vidéo réseau pas
 * encore prête provoque des sauts/gels visibles plutôt qu'un scrub fluide.
 * Avant ce seuil, le poster reste affiché tel quel.
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
    let ready = false;
    let lastTarget = -1;

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

    const updateFrame = () => {
      rafRef.current = null;
      if (!ready) return;

      const rect = section.getBoundingClientRect();
      const scrollable = rect.height - window.innerHeight;
      const progress =
        scrollable > 0
          ? Math.min(Math.max(-rect.top / scrollable, 0), 1)
          : 0;

      // Marge de sécurité sous la durée totale : chercher pile la dernière
      // frame fait planter le seek sur certains navigateurs.
      const target = Math.min(progress * duration, duration - 0.05);
      if (Math.abs(target - lastTarget) < 0.03) return;
      lastTarget = target;

      try {
        if (typeof video.fastSeek === "function") {
          video.fastSeek(target);
        } else {
          video.currentTime = target;
        }
      } catch {
        // Seek refusé (vidéo pas encore seekable) — on retentera à la
        // prochaine frame de scroll, rien d'autre à faire ici.
      }
    };

    const onScroll = () => {
      if (rafRef.current === null) {
        rafRef.current = requestAnimationFrame(updateFrame);
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
        </div>

        <div
          aria-hidden
          className="absolute bottom-10 left-1/2 h-12 w-px -translate-x-1/2 bg-gradient-to-b from-brume/70 to-transparent"
        />
      </div>
    </section>
  );
}
