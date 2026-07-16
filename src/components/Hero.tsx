"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { HERO_MEDIA } from "@/lib/media";

/**
 * Hero avec vidéo pilotée par le scroll, jamais lue en autoplay.
 *
 * Le scroll vers l'avant pilote video.play() + un playbackRate proportionnel
 * au retard à rattraper : lecture séquentielle, que les décodeurs gèrent
 * nativement bien — confirmé fluide. Le scroll vers l'arrière retombe sur un
 * seek direct, throttlé et limité à un petit pas à chaque fois : moins bon
 * que l'avant (une vidéo ne sait pas jouer à l'envers, un seek loin de la
 * dernière image-clé reste un redécodage coûteux), mais toujours réactif.
 *
 * Une tentative précédente ajoutait un cache de frames (canvas +
 * createImageBitmap, warmup complet de la vidéo caché derrière le poster
 * avant d'activer le scroll) pour un rendu plus fluide en arrière. Abandonnée :
 * le warmup pouvait prendre plusieurs secondes selon la longueur de la
 * vidéo, pendant lesquelles le hero restait entièrement figé au scroll —
 * un compromis pire que le problème qu'il cherchait à résoudre.
 */
const WAVE_REVEAL_START = 0.68;
const WAVE_REVEAL_END = 1;
const SEEK_THROTTLE_MS = 110;
const SEEK_STEP_CAP = 0.22;

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
      video
        .play()
        .catch(() => {})
        .finally(() => {
          playPending = false;
        });
    };

    const tick = () => {
      rafRef.current = null;
      const progress = getProgress();

      // La vague : monte depuis hors-champ (sous le bord de l'écran) vers sa
      // position de repos, liée en continu à la progression du scroll —
      // indépendant de l'état de la vidéo, et scrubbable dans les deux sens.
      // Un simple translateY (pas de clip-path) : le bord ondulé de la forme
      // émerge donc naturellement au fil de la montée, comme de l'eau qui
      // arrive, plutôt qu'un front rectangulaire qui balaie horizontalement.
      if (waveRef.current) {
        const waveProgress = Math.min(
          Math.max(
            (progress - WAVE_REVEAL_START) /
              (WAVE_REVEAL_END - WAVE_REVEAL_START),
            0
          ),
          1
        );
        waveRef.current.style.transform = `translateY(${(1 - waveProgress) * 100}%)`;
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
        video.playbackRate = Math.min(Math.max(diff / 0.4, 1), 6);
        safePlay();
      } else {
        if (!video.paused) video.pause();
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
        {/* L'attribut poster natif affiche l'image de référence jusqu'à ce
            que la vidéo ait une première frame à montrer — géré nativement
            par le navigateur, pas de calque <img> séparé avec son propre
            fondu JS (qui créait un "cut" visible entre les deux). */}
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
            pas toute la forme en verre, seulement son bord. Monte depuis
            hors-champ (cf. tick()) plutôt que balayée par un clip-path :
            un vrai mouvement de vague qui arrive, jamais un fondu. */}
        <div
          ref={waveRef}
          aria-hidden
          className="wave-reveal pointer-events-none absolute inset-x-0 bottom-0 z-[6] h-32 sm:h-48"
          style={{ transform: "translateY(100%)" }}
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
