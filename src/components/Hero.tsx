"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
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
const GRASS_PATH =
  "M0,220 L0,84 L20,159 L40,41 L60,148 L80,62 L100,149 L120,92 L140,181 L160,154 L180,176 L200,123 L220,130 L240,68 L260,150 L280,113 L300,175 L320,146 L340,136 L360,50 L380,140 L400,101 L420,173 L440,51 L460,187 L480,60 L500,132 L520,55 L540,183 L560,116 L580,151 L600,153 L620,174 L640,94 L660,144 L680,125 L700,159 L720,160 L740,155 L760,88 L780,151 L800,69 L820,139 L840,54 L860,176 L880,51 L900,164 L920,41 L940,182 L960,50 L980,173 L1000,158 L1020,161 L1040,157 L1060,181 L1080,38 L1100,176 L1120,118 L1140,153 L1160,65 L1180,155 L1200,55 L1220,154 L1240,79 L1260,185 L1280,125 L1300,185 L1320,43 L1340,131 L1360,129 L1380,141 L1400,131 L1420,165 L1440,151 L1440,220 Z";

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

      const rect = section.getBoundingClientRect();
      const scrollable = rect.height - window.innerHeight;
      const progress =
        scrollable > 0
          ? Math.min(Math.max(-rect.top / scrollable, 0), 1)
          : 0;

      // L'herbe entre en scène sur le dernier quart du scroll, comme si le
      // drone se posait au ras du sol — le pied de cadre se révèle juste
      // avant que la section se détache. Indépendant de l'état de la vidéo :
      // c'est un transform CSS pur, pas de raison de le bloquer si la
      // vidéo tarde à charger.
      if (grassRef.current) {
        const grassProgress = Math.min(
          Math.max((progress - 0.72) / 0.28, 0),
          1
        );
        grassRef.current.style.transform = `translateY(${(1 - grassProgress) * 100}%)`;
      }

      if (!ready) return;

      // Marge de sécurité sous la durée totale : chercher pile la dernière
      // frame fait planter le seek sur certains navigateurs.
      const target = Math.min(progress * duration, duration - 0.05);
      if (Math.abs(target - lastTarget) > 0.03) {
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
          className="pointer-events-none absolute inset-x-0 bottom-0 z-[5] h-[26vh] min-h-[140px] will-change-transform"
          style={{ transform: "translateY(100%)" }}
        >
          <svg
            viewBox="0 0 1440 220"
            preserveAspectRatio="none"
            className="h-full w-full"
          >
            <path d={GRASS_PATH} className="fill-foret" />
          </svg>
        </div>

        <div
          aria-hidden
          className="absolute bottom-10 left-1/2 z-10 h-12 w-px -translate-x-1/2 bg-gradient-to-b from-brume/70 to-transparent"
        />
      </div>
    </section>
  );
}
