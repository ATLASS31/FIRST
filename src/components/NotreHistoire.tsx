"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";

/**
 * Refonte complète sur direction précise du client, référence visuelle à
 * l'appui (deux images) : à gauche le texte + une ligne de 4 preuves avec
 * icône (remplace l'ancien objet 3D en rotation — l'histoire n'est plus
 * racontée par un objet qui tourne mais par la matière elle-même) ; à
 * droite, les six matériaux de construction qui se séparent au scroll,
 * chacun légendé en dessous une fois l'ouverture terminée.
 *
 * Après plusieurs passes à faire reculer manuellement une vidéo Higgsfield
 * qui n'existait qu'assemblant les matériaux (aucun navigateur ne lit une
 * vidéo à l'envers nativement — seulement des approximations plus ou moins
 * fluides : scrub chaîné sur `seeked`, cache de frames `createImageBitmap`
 * façon `Hero.tsx`...), le client a finalement fourni une seconde vidéo,
 * montée cette fois dans le bon sens (matériaux qui se séparent). Les deux
 * directions se lisent donc désormais nativement vers l'avant, chacune sa
 * propre vidéo — plus aucun scrub, plus aucun cache, plus aucune
 * approximation : le dépliage est aussi fluide que l'était déjà le
 * repliement, par construction plutôt que par bricolage.
 *
 * Fond détouré au `<canvas>` (aucune des deux vidéos n'a de canal alpha) :
 * couleur de fond échantillonnée (moyenne des 4 coins, tolère le léger
 * dégradé du rendu studio) puis rendue transparente pixel par pixel.
 * Vidéo "dépliage" auto-hébergée (`public/videos`, fournie par le client) ;
 * vidéo "repliement" toujours relayée par `/api/materials-video` (reste
 * hébergée par le CDN du client) pour rester same-origin et permettre la
 * lecture des pixels par le canvas.
 *
 * Cadre dimensionné dynamiquement sur le vrai ratio de la vidéo
 * (`videoAspect`, mesuré à ses métadonnées) plutôt que deviné : deviner
 * faux laisse `object-contain` ajouter du vide transparent invisible
 * au-dessus/en dessous du contenu réel.
 *
 * Animation déclenchée par le franchissement d'une ligne de seuil
 * (`THRESHOLD_VH`), pas liée en continu au scroll : descendre dans la
 * section déclenche le dépliage, remonter au-dessus déclenche le
 * repliement — jamais de scroll-jacking, juste une ligne de passage.
 *
 * Filet de sécurité (`PLAYBACK_TIMEOUT_MS`) : si une vidéo ne joue jamais
 * (fichier introuvable, codec non supporté...), l'état visuel ne reste
 * jamais bloqué en "exploding"/"regrouping" indéfiniment. Découvert en
 * testant ce round dans ce sandbox : son Chromium (build open-source de
 * Playwright) n'embarque aucun décodeur H.264 propriétaire
 * (`canPlayType('video/mp4; codecs="avc1..."')` renvoie vide, alors que
 * VP9 fonctionne) — indépendant du blocage réseau du CDN déjà documenté
 * ailleurs, donc ni l'une ni l'autre vidéo ne peut être vérifiée à l'écran
 * ici, même la nouvelle auto-hébergée. Les navigateurs réels (Chrome,
 * Safari, Firefox grand public) embarquent tous un décodeur H.264 et ne
 * sont pas concernés.
 */

const EXPLODE_VIDEO_URL = "/videos/materials-explode.mp4";
const REGROUP_VIDEO_URL = "/api/materials-video";
// Ligne de déclenchement unique : le haut du bloc matériaux doit remonter
// au-dessus de cette fraction de la hauteur d'écran. En descendant, la
// franchir déclenche le dépliage ; en remontant, la refranchir déclenche
// le repliement.
const THRESHOLD_VH = 0.6;

const FEATURES = [
  { icon: "pin", value: "100%", label: "fabriqué en France" },
  { icon: "tree", value: "Douglas", label: "certifié" },
  { icon: "home", value: "Conforme", label: "RE2020" },
  { icon: "shield", value: "Garantie", label: "20 ans" },
] as const;

const MATERIALS = [
  {
    title: "Ossature Douglas",
    description: "Bois massif certifié PEFC, naturellement résistant et stabilisé.",
  },
  {
    title: "Panneau OSB 4",
    description: "Rigidité et stabilité structurelle pour une maison solide et durable.",
  },
  {
    title: "Isolation",
    description:
      "Fibre de bois haute densité pour un confort thermique optimal été comme hiver.",
  },
  {
    title: "Pare-vapeur",
    description:
      "Membrane d'étanchéité à l'air performante pour préserver la qualité de l'isolation.",
  },
  {
    title: "Liteaux & lame d'air",
    description:
      "Ventilation naturelle assurant la durabilité de la façade et la régulation de l'humidité.",
  },
  {
    title: "Bardage Cryptomeria",
    description: "Bois naturellement durable, esthétique et résistant aux intempéries.",
  },
];

function FeatureIcon({ name }: { name: (typeof FEATURES)[number]["icon"] }) {
  const common = {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.5,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    className: "h-6 w-6",
  };
  if (name === "pin") {
    return (
      <svg {...common}>
        <path d="M21 10c0 6.5-9 12-9 12s-9-5.5-9-12a9 9 0 0 1 18 0z" />
        <circle cx="12" cy="10" r="3" />
      </svg>
    );
  }
  if (name === "tree") {
    return (
      <svg {...common}>
        <circle cx="12" cy="9" r="5.5" />
        <path d="M12 14.5V21M8.5 21h7" />
      </svg>
    );
  }
  if (name === "home") {
    return (
      <svg {...common}>
        <path d="M3 11.5 12 4l9 7.5" />
        <path d="M5.5 10v10.5h13V10" />
      </svg>
    );
  }
  return (
    <svg {...common}>
      <path d="M12 3.5 19 6.3v5.6c0 5.2-3.4 8.4-7 9.6-3.6-1.2-7-4.4-7-9.6V6.3l7-2.8z" />
      <path d="m9 12 2 2 4-4.2" />
    </svg>
  );
}

/**
 * Deux lecteurs vidéo invisibles (`opacity-0`), un par sens, tous deux
 * toujours lus vers l'avant natif — c'est le `<canvas>` superposé qui est
 * réellement affiché, une fois le fond détouré.
 */
function MaterialsShowcase() {
  const prefersReducedMotion = useReducedMotion();
  const explodeVideoRef = useRef<HTMLVideoElement>(null);
  const regroupVideoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [unfolded, setUnfolded] = useState(false);
  // Ratio du cadre calé sur la vidéo réelle une fois ses métadonnées
  // chargées, plutôt qu'une valeur devinée : deviner mal laisse
  // `object-contain` ajouter un vide transparent (invisible une fois le
  // fond détouré) au-dessus/en dessous du contenu réel.
  const [videoAspect, setVideoAspect] = useState<number | null>(null);
  const keyColorRef = useRef<[number, number, number] | null>(null);
  const keyingDisabledRef = useRef(false);

  const drawFrame = useCallback((video: HTMLVideoElement) => {
    const canvas = canvasRef.current;
    if (!canvas || video.videoWidth === 0) return;

    // Le canvas est dessiné à la taille d'affichage réelle (× ratio
    // d'écran, plafonné à 2), jamais à la résolution native de la vidéo :
    // recalculer des centaines de milliers de pixels pour le détourage à
    // chaque frame faisait ramer l'animation sur mobile. Le rapport
    // largeur/hauteur natif de la vidéo est conservé (`object-contain` en
    // CSS gère déjà le cadrage), seule la résolution baisse.
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
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    if (keyingDisabledRef.current) return;

    try {
      const frame = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = frame.data;

      if (!keyColorRef.current) {
        // Moyenne des 4 coins plutôt qu'un seul pixel : le fond du rendu a
        // un léger dégradé/vignette, un point unique laissait un fragment
        // non détouré dans un coin.
        const w = canvas.width;
        const h = canvas.height;
        const corners = [
          0,
          (w - 1) * 4,
          (h - 1) * w * 4,
          ((h - 1) * w + (w - 1)) * 4,
        ];
        let r = 0;
        let g = 0;
        let b = 0;
        for (const idx of corners) {
          r += data[idx];
          g += data[idx + 1];
          b += data[idx + 2];
        }
        keyColorRef.current = [r / corners.length, g / corners.length, b / corners.length];
      }
      const [kr, kg, kb] = keyColorRef.current;
      const threshold = 34;
      const feather = 30;
      // Comparer les distances au carré évite un `Math.sqrt` par pixel
      // (l'essentiel du coût du détourage) : la racine n'est calculée que
      // pour la fine bande de pixels réellement dans la zone de fondu,
      // pas pour l'image entière — sensible sur mobile.
      const t2 = threshold * threshold;
      const tf2 = (threshold + feather) * (threshold + feather);

      for (let i = 0; i < data.length; i += 4) {
        const dr = data[i] - kr;
        const dg = data[i + 1] - kg;
        const db = data[i + 2] - kb;
        const dist2 = dr * dr + dg * dg + db * db;
        if (dist2 < t2) {
          data[i + 3] = 0;
        } else if (dist2 < tf2) {
          const dist = Math.sqrt(dist2);
          data[i + 3] = Math.round(((dist - threshold) / feather) * 255);
        }
      }
      ctx.putImageData(frame, 0, 0);
    } catch {
      // Canvas "taintée" (le CDN ne renvoie pas d'en-têtes CORS lisibles) :
      // on ne détoure plus, mais le frame déjà dessiné reste affiché.
      keyingDisabledRef.current = true;
    }
  }, []);

  useEffect(() => {
    const explodeVideo = explodeVideoRef.current;
    const regroupVideo = regroupVideoRef.current;
    const container = containerRef.current;
    if (!explodeVideo || !regroupVideo || !container) return;

    let cancelled = false;

    const onExplodeMeta = () => {
      if (explodeVideo.videoWidth > 0 && explodeVideo.videoHeight > 0) {
        setVideoAspect(explodeVideo.videoWidth / explodeVideo.videoHeight);
      }
    };
    explodeVideo.addEventListener("loadedmetadata", onExplodeMeta);

    // État initial "groupé" (assemblé) = première frame de la vidéo de
    // dépliage. Sous reduced-motion, l'état final "déplié" attendu est sa
    // dernière frame.
    const onExplodeReady = () => {
      if (cancelled) return;
      if (prefersReducedMotion) {
        const showFinal = () => {
          drawFrame(explodeVideo);
          setUnfolded(true);
        };
        if (Number.isFinite(explodeVideo.duration) && explodeVideo.duration > 0) {
          const onFinalSeeked = () => showFinal();
          explodeVideo.addEventListener("seeked", onFinalSeeked, { once: true });
          try {
            explodeVideo.currentTime = explodeVideo.duration;
          } catch {
            explodeVideo.removeEventListener("seeked", onFinalSeeked);
            showFinal();
          }
        } else {
          showFinal();
        }
      } else {
        drawFrame(explodeVideo);
      }
    };
    explodeVideo.addEventListener("loadeddata", onExplodeReady, { once: true });

    if (prefersReducedMotion) {
      return () => {
        cancelled = true;
        explodeVideo.removeEventListener("loadedmetadata", onExplodeMeta);
        explodeVideo.removeEventListener("loadeddata", onExplodeReady);
      };
    }

    let phase: "grouped" | "exploding" | "exploded" | "regrouping" = "grouped";
    let lastScrollY = window.scrollY;
    let playRafId: number | null = null;
    let hardStop: ReturnType<typeof setTimeout> | null = null;
    // Budget large : le temps qu'une lecture normale prendrait dans le pire
    // cas plausible, jamais atteint en usage réel. Filet de sécurité pour
    // ne jamais rester bloqué en "exploding"/"regrouping" indéfiniment si
    // la vidéo ne joue jamais pour une raison ou une autre (codec non
    // supporté, fichier introuvable, etc.) — les légendes doivent toujours
    // finir par apparaître plutôt que de dépendre uniquement d'un
    // événement qui pourrait ne jamais se produire.
    const PLAYBACK_TIMEOUT_MS = 6000;

    const stopPlayLoop = () => {
      if (playRafId !== null) {
        cancelAnimationFrame(playRafId);
        playRafId = null;
      }
      if (hardStop) {
        clearTimeout(hardStop);
        hardStop = null;
      }
    };

    // Dépliage : lecture native de la vidéo fournie par le client, déjà
    // montée dans le bon sens (matériaux qui se séparent) — plus de scrub.
    const runExplode = () => {
      phase = "exploding";
      regroupVideo.pause();
      try {
        explodeVideo.currentTime = 0;
      } catch {
        // ignore
      }
      explodeVideo.play().catch(() => {});
      hardStop = setTimeout(() => {
        stopPlayLoop();
        explodeVideo.pause();
        phase = "exploded";
        setUnfolded(true);
      }, PLAYBACK_TIMEOUT_MS);

      const loop = () => {
        if (cancelled) return;
        drawFrame(explodeVideo);
        const atEnd =
          explodeVideo.ended ||
          (Number.isFinite(explodeVideo.duration) &&
            explodeVideo.currentTime >= explodeVideo.duration - 0.03);
        if (explodeVideo.paused && !atEnd) {
          // Lecture pas encore démarrée (chargement) : on continue d'attendre.
          playRafId = requestAnimationFrame(loop);
          return;
        }
        if (atEnd) {
          stopPlayLoop();
          explodeVideo.pause();
          phase = "exploded";
          setUnfolded(true);
          return;
        }
        playRafId = requestAnimationFrame(loop);
      };
      playRafId = requestAnimationFrame(loop);
    };

    // Repliement : lecture native de la vidéo d'origine du client (sens
    // d'enregistrement naturel, matériaux qui s'assemblent).
    const runRegroup = () => {
      phase = "regrouping";
      setUnfolded(false);
      explodeVideo.pause();
      try {
        regroupVideo.currentTime = 0;
      } catch {
        // ignore
      }
      regroupVideo.play().catch(() => {});
      hardStop = setTimeout(() => {
        stopPlayLoop();
        regroupVideo.pause();
        phase = "grouped";
      }, PLAYBACK_TIMEOUT_MS);

      const loop = () => {
        if (cancelled) return;
        drawFrame(regroupVideo);
        const atEnd =
          regroupVideo.ended ||
          (Number.isFinite(regroupVideo.duration) &&
            regroupVideo.currentTime >= regroupVideo.duration - 0.03);
        if (regroupVideo.paused && !atEnd) {
          playRafId = requestAnimationFrame(loop);
          return;
        }
        if (atEnd) {
          stopPlayLoop();
          regroupVideo.pause();
          phase = "grouped";
          return;
        }
        playRafId = requestAnimationFrame(loop);
      };
      playRafId = requestAnimationFrame(loop);
    };

    const checkThreshold = () => {
      if (!container.isConnected) return;
      const rect = container.getBoundingClientRect();
      const scrollingDown = window.scrollY > lastScrollY;
      const scrollingUp = window.scrollY < lastScrollY;
      lastScrollY = window.scrollY;
      const pastThreshold = rect.top < window.innerHeight * THRESHOLD_VH;

      if (pastThreshold && scrollingDown && phase === "grouped") {
        runExplode();
      } else if (!pastThreshold && scrollingUp && phase === "exploded") {
        runRegroup();
      }
    };
    window.addEventListener("scroll", checkThreshold, { passive: true });

    return () => {
      cancelled = true;
      explodeVideo.removeEventListener("loadedmetadata", onExplodeMeta);
      explodeVideo.removeEventListener("loadeddata", onExplodeReady);
      window.removeEventListener("scroll", checkThreshold);
      stopPlayLoop();
      explodeVideo.pause();
      regroupVideo.pause();
    };
  }, [prefersReducedMotion, drawFrame]);

  return (
    <div ref={containerRef} className="w-full">
      {/* Plein cadre jusqu'aux bords de l'écran sur mobile/tablette (annule
          le px-6 de la section). Le ratio du cadre colle exactement à la
          vidéo réelle (`videoAspect`) : deviner (carré, 16:9…) laisse
          `object-contain` ajouter du vide transparent au-dessus/en dessous
          du contenu quand le ratio deviné est faux. 16:9 en repli le temps
          que les métadonnées de la vidéo chargent. */}
      <div
        className="relative -mx-6 lg:mx-0"
        style={{ aspectRatio: videoAspect ? String(videoAspect) : "16 / 9" }}
      >
        <video
          ref={explodeVideoRef}
          src={EXPLODE_VIDEO_URL}
          muted
          playsInline
          preload="auto"
          aria-hidden
          className="absolute inset-0 h-full w-full object-contain opacity-0"
        />
        <video
          ref={regroupVideoRef}
          src={REGROUP_VIDEO_URL}
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

      <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-6">
        {MATERIALS.map((material, i) => (
          <motion.div
            key={material.title}
            initial={{ opacity: 0, y: 14 }}
            animate={unfolded ? { opacity: 1, y: 0 } : { opacity: 0, y: 14 }}
            transition={{ duration: 0.5, delay: 0.1 + i * 0.13, ease: [0.22, 1, 0.36, 1] }}
            className={i > 0 ? "lg:border-l lg:border-laiton/40 lg:pl-4" : ""}
          >
            <p className="eyebrow text-[11px] text-encre-douce">
              {String(i + 1).padStart(2, "0")}
            </p>
            <p className="mt-1.5 text-sm font-semibold text-encre">{material.title}</p>
            <p className="mt-1 text-xs leading-relaxed text-encre-doux">
              {material.description}
            </p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

export default function NotreHistoire() {
  return (
    <section className="relative overflow-hidden bg-ciel px-6 py-20 sm:py-24">
      <div className="relative z-10 mx-auto grid max-w-7xl gap-8 lg:grid-cols-[1fr_2fr] lg:items-center lg:gap-16">
        <div className="min-w-0">
          <p className="eyebrow text-xs text-encre-douce">Notre histoire</p>
          <h2 className="mt-4 text-4xl font-semibold text-encre sm:text-5xl">
            Le modulaire bois, sans compromis.
          </h2>
          <p className="mt-6 text-base leading-relaxed text-encre-doux">
            Le modulaire bois traîne une réputation : préfabriqué bon marché,
            finitions médiocres, durée de vie courte.
          </p>
          <span aria-hidden className="mt-4 block h-px w-8 bg-laiton" />
          <p className="mt-4 text-base leading-relaxed text-encre-doux">
            <strong className="font-semibold text-encre">
              Nous construisons l&apos;inverse.
            </strong>{" "}
            Ossature Douglas certifiée, isolation conforme RE2020, bardage
            Cryptomeria — les matériaux et les gestes sont ceux d&apos;une
            maison construite sur place. Chaque maison est conçue et
            assemblée en atelier français par des charpentiers et menuisiers
            expérimentés.
          </p>

          <div className="mt-10 grid grid-cols-2 gap-x-6 gap-y-8 sm:grid-cols-4">
            {FEATURES.map((feature) => (
              <div
                key={feature.label}
                className="flex flex-col items-center gap-3 text-center"
              >
                <span aria-hidden className="text-laiton">
                  <FeatureIcon name={feature.icon} />
                </span>
                <div>
                  <p className="text-sm font-semibold text-encre">{feature.value}</p>
                  <p className="text-sm text-encre-douce">{feature.label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <MaterialsShowcase />
      </div>
    </section>
  );
}
