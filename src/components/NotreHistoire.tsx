"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";

/**
 * Refonte complète sur direction précise du client, référence visuelle à
 * l'appui (deux images) : à gauche le texte + une ligne de 4 preuves avec
 * icône (remplace l'ancien objet 3D en rotation — l'histoire n'est plus
 * racontée par un objet qui tourne mais par la matière elle-même) ; à
 * droite, une vidéo Higgsfield (six matériaux de construction qui glissent
 * les uns vers les autres jusqu'à former un seul bloc assemblé) — mais
 * *retournée* : elle démarre assemblée et se "déplie" au scroll pour
 * révéler les six couches, chacune légendée en dessous une fois
 * l'ouverture terminée. Demande explicite : *"au slide vers le bas les
 * matériaux s'écartent d'un coup, petit snap apple genre."*
 *
 * Retour client après une première passe : l'animation "freeze puis hop
 * tout dégroupé" au lieu d'être fluide. Cause réelle : on écrivait
 * `video.currentTime` à chaque frame `requestAnimationFrame` (~60x/s) sans
 * attendre que le navigateur ait fini de "seeker" la précédente valeur —
 * la plupart des écritures étaient donc ignorées/écrasées, et seule la
 * toute dernière finissait par s'appliquer d'un coup. Corrigé en chaînant
 * les seeks sur l'événement `seeked` : chaque nouvelle valeur n'est
 * demandée qu'une fois la précédente réellement rendue, ce qui cale le
 * rythme sur ce que le décodeur peut vraiment fournir — fluide plutôt que
 * saccadé, quelle que soit la vitesse de seek du navigateur.
 *
 * Deuxième demande : que les matériaux aient l'air de flotter sur le fond
 * du site plutôt que sur un fond vidéo visible. Comme la vidéo source n'a
 * pas de canal alpha, le rendu passe par un `<canvas>` : chaque frame est
 * dessinée puis le fond (couleur échantillonnée dans le coin de l'image,
 * supposé uniforme) est rendu transparent pixel par pixel.
 *
 * Troisième retour : le détourage ne marchait toujours pas en pratique
 * ("ça fait tache, les éléments volent pas") — confirmation du risque déjà
 * identifié : le CDN Higgsfield (CloudFront) ne renvoie pas d'en-têtes CORS
 * lisibles, donc `getImageData` levait une `SecurityError` silencieuse et
 * le détourage ne s'appliquait jamais. Corrigé en sortant la vidéo par une
 * route interne same-origin (`/api/materials-video`, voir ce fichier) :
 * le navigateur ne la traite plus comme cross-origin, donc la lecture des
 * pixels fonctionne.
 *
 * Quatrième retour : abandon du "snap" à durée fixe au profit d'une
 * animation continue liée au scroll — les matériaux se séparent au fur et
 * à mesure que la section défile à l'écran, exactement comme la vague de
 * Hero.tsx (scrubbable, jamais un simple déclenchement ponctuel). Le seek
 * n'est redemandé que lorsque le précédent est terminé (`!video.seeking`)
 * — c'est ce qui évitait déjà les sauts brutaux dans la version "snap", ici
 * généralisé à un scrub continu plutôt qu'à une durée fixe.
 *
 * Cinquième retour, sur cette même version "scrub continu" : "je ne veux
 * pas que le slide gère la vitesse de l'animation" — lier `currentTime` à
 * la position de scroll fait dépendre la vitesse perçue de la vitesse à
 * laquelle le client scrolle (un flick rapide saute des frames), ce qui
 * ne peut jamais paraître fluide. Retour à une animation déclenchée (pas
 * liée en continu), mais cette fois à son propre rythme fixe, indépendant
 * du scroll : descendre dans la section déclenche le dépliage une fois,
 * remonter au-dessus déclenche le repliement dans l'autre sens — exactement
 * "je descends, ça se lance ; je remonte, ça se lance dans l'autre sens".
 * Le dépliage (à rebours, décroissant) reste un scrub manuel chaîné sur
 * `seeked` (aucun navigateur ne lit une vidéo à l'envers nativement) sur
 * une durée fixe et généreuse (pas un "snap" de 650ms). Le repliement, lui,
 * va dans le sens naturel d'enregistrement de la vidéo (croissant) : on
 * peut donc utiliser `video.play()` natif (accéléré via `playbackRate`),
 * intrinsèquement fluide puisque géré par le décodeur — même technique que
 * le sens "avant" du scroll dans Hero.tsx.
 *
 * Sixième retour : un petit fragment du fond (coin haut-gauche) n'était pas
 * détouré — la couleur de fond a un léger dégradé/vignette (rendu studio),
 * un seul pixel de coin échantillonné ne suffisait pas. La couleur de
 * référence est maintenant la moyenne des 4 coins, avec un seuil et un
 * fondu plus généreux pour couvrir la variation du dégradé.
 */

const MATERIALS_VIDEO_URL = "/api/materials-video";
// Généré à l'endroit (les 6 matériaux glissent les uns vers les autres
// jusqu'à former un seul bloc) ; on la joue à l'envers, du dernier frame
// (bloc assemblé, l'état de repos) vers le premier (matériaux écartés,
// l'état "déplié").
const VIDEO_DURATION = 4;
// Ligne de déclenchement unique : le haut du bloc matériaux doit remonter
// au-dessus de cette fraction de la hauteur d'écran. En descendant, la
// franchir déclenche le dépliage ; en remontant, la refranchir déclenche
// le repliement — jamais de scroll-jacking, juste une ligne de passage.
const THRESHOLD_VH = 0.6;
const EXPLODE_MS = 1150;
const REGROUP_MS = 950;

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
 * Le lecteur vidéo (invisible, `opacity-0`) sert uniquement de source de
 * frames décodées ; c'est le `<canvas>` superposé qui est réellement
 * affiché, une fois le fond détouré. L'animation est déclenchée par le
 * franchissement de `THRESHOLD_VH`, pas par la position de scroll en
 * continu : dépliage (scrub arrière chaîné sur `seeked`) en descendant,
 * repliement (lecture native accélérée) en remontant — chacun à sa propre
 * durée fixe, indépendante de la vitesse de scroll.
 */
function MaterialsShowcase() {
  const prefersReducedMotion = useReducedMotion();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [unfolded, setUnfolded] = useState(false);
  const keyColorRef = useRef<[number, number, number] | null>(null);
  const keyingDisabledRef = useRef(false);

  const drawFrame = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.videoWidth === 0) return;

    // Le canvas est dessiné à la taille d'affichage réelle (× ratio
    // d'écran, plafonné à 2), jamais à la résolution native de la vidéo :
    // recalculer des centaines de milliers de pixels pour le détourage à
    // chaque frame faisait ramer l'animation sur mobile ("saccadé"), alors
    // que l'image affichée est bien plus petite que la source. Le rapport
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
    const video = videoRef.current;
    const container = containerRef.current;
    if (!video || !container) return;

    const onLoaded = () => {
      video.currentTime = prefersReducedMotion ? 0 : VIDEO_DURATION;
    };
    video.addEventListener("loadedmetadata", onLoaded);

    const onSeeked = () => drawFrame();
    video.addEventListener("seeked", onSeeked);

    if (prefersReducedMotion) {
      const onFirstSeeked = () => setUnfolded(true);
      video.addEventListener("seeked", onFirstSeeked, { once: true });
      return () => {
        video.removeEventListener("loadedmetadata", onLoaded);
        video.removeEventListener("seeked", onSeeked);
        video.removeEventListener("seeked", onFirstSeeked);
      };
    }

    let cancelled = false;
    let phase: "grouped" | "exploding" | "exploded" | "regrouping" = "grouped";
    let lastScrollY = window.scrollY;
    let playRafId: number | null = null;
    let hardStop: ReturnType<typeof setTimeout> | null = null;

    const stopPlayLoop = () => {
      if (playRafId !== null) {
        cancelAnimationFrame(playRafId);
        playRafId = null;
      }
    };

    // Dépliage : la vidéo doit reculer (assemblée -> écartée), ce
    // qu'aucun navigateur ne sait faire nativement — scrub manuel chaîné
    // sur `seeked` (jamais deux seeks en vol), sur une durée fixe.
    const runExplode = () => {
      phase = "exploding";
      const startTime = video.currentTime;
      const start = performance.now();
      if (hardStop) clearTimeout(hardStop);
      hardStop = setTimeout(() => {
        video.removeEventListener("seeked", onExplodeSeeked);
        phase = "exploded";
        setUnfolded(true);
      }, EXPLODE_MS + 1200);

      const step = () => {
        if (cancelled) return;
        const elapsed = performance.now() - start;
        const t = Math.min(1, elapsed / EXPLODE_MS);
        const eased = 1 - Math.pow(1 - t, 3);
        const target = t >= 1 ? 0 : startTime * (1 - eased);
        try {
          video.currentTime = target;
        } catch {
          // ignore, on retentera au prochain "seeked"
        }
      };

      const onExplodeSeeked = () => {
        if (cancelled) return;
        drawFrame();
        const elapsed = performance.now() - start;
        if (elapsed < EXPLODE_MS) {
          step();
        } else {
          video.removeEventListener("seeked", onExplodeSeeked);
          if (hardStop) clearTimeout(hardStop);
          phase = "exploded";
          setUnfolded(true);
        }
      };
      video.addEventListener("seeked", onExplodeSeeked);
      step();
    };

    // Repliement : la vidéo avance dans son sens naturel d'enregistrement
    // (écartée -> assemblée) — lecture native accélérée, intrinsèquement
    // fluide puisque gérée par le décodeur (même principe que le sens
    // "avant" du scroll dans Hero.tsx).
    const runRegroup = () => {
      phase = "regrouping";
      setUnfolded(false);
      const remaining = Math.max(VIDEO_DURATION - video.currentTime, 0.1);
      video.playbackRate = Math.min(Math.max(remaining / (REGROUP_MS / 1000), 1), 8);
      video.play().catch(() => {});

      const finish = () => {
        stopPlayLoop();
        video.pause();
        video.playbackRate = 1;
        try {
          video.currentTime = VIDEO_DURATION;
        } catch {
          // ignore
        }
        drawFrame();
        phase = "grouped";
      };

      const loop = () => {
        if (cancelled) return;
        drawFrame();
        if (video.paused || video.currentTime >= VIDEO_DURATION - 0.03) {
          finish();
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
      video.removeEventListener("loadedmetadata", onLoaded);
      video.removeEventListener("seeked", onSeeked);
      window.removeEventListener("scroll", checkThreshold);
      if (hardStop) clearTimeout(hardStop);
      stopPlayLoop();
    };
  }, [prefersReducedMotion, drawFrame]);

  return (
    <div ref={containerRef} className="w-full">
      {/* Plein cadre jusqu'aux bords de l'écran sur mobile/tablette (annule
          le px-6 de la section) — les matériaux paraissaient trop petits,
          resserrés dans la marge de texte. Redevient contenu dans la
          colonne normale à partir de lg (à côté du texte). */}
      <div className="relative -mx-6 aspect-video lg:mx-0">
        <video
          ref={videoRef}
          src={MATERIALS_VIDEO_URL}
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
      <div className="relative z-10 mx-auto grid max-w-7xl gap-16 lg:grid-cols-[1fr_2fr] lg:items-center">
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
              <div key={feature.label} className="flex flex-col items-start gap-3">
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
