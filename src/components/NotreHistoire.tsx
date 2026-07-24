"use client";

import { useEffect, useRef, useState } from "react";
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
 */

const MATERIALS_VIDEO_URL =
  "https://d8j0ntlcm91z4.cloudfront.net/user_3AOufDgdu5BZqUoyRdkQOitlUqQ/hf_20260723_190609_0a1973fa-f788-4814-8e66-ab39572d87b8.mp4";
const MATERIALS_VIDEO_POSTER =
  "https://d2ol7oe51mr4n9.cloudfront.net/user_3AOufDgdu5BZqUoyRdkQOitlUqQ/30d74101-1ddb-410e-9a19-a3c075bf284a.png";
// Généré à l'endroit (les 6 matériaux glissent les uns vers les autres
// jusqu'à former un seul bloc) ; on la joue à l'envers, du dernier frame
// (bloc assemblé, l'état de repos) vers le premier (matériaux écartés,
// l'état "déplié" demandé). Durée réelle 4s, mais on la comprime à une
// fraction de seconde pour le "petit snap" plutôt qu'un scrub continu.
const VIDEO_DURATION = 4;
const SNAP_MS = 650;

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
 * Le lecteur vidéo lit `currentTime` à rebours du dernier frame vers le
 * premier (aucun navigateur ne fait de vraie lecture arrière fluide via
 * `playbackRate` négatif) : une boucle `requestAnimationFrame` décrémente
 * `currentTime` sur `SNAP_MS`, déclenchée une seule fois quand la section
 * entre dans le viewport. Une fois le dépliage terminé, les légendes
 * apparaissent en dessous, en cascade.
 */
function MaterialsShowcase() {
  const prefersReducedMotion = useReducedMotion();
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [unfolded, setUnfolded] = useState(false);
  const triggeredRef = useRef(false);

  useEffect(() => {
    const video = videoRef.current;
    const container = containerRef.current;
    if (!video || !container) return;

    if (prefersReducedMotion) {
      // Pas d'animation : on va directement à l'état "déplié" (matériaux
      // écartés, légendes visibles), cohérent avec le reste du site où
      // reduced-motion retombe toujours sur l'état final plutôt qu'une
      // version amoindrie de l'animation.
      setUnfolded(true);
      return;
    }

    const onLoaded = () => {
      video.currentTime = VIDEO_DURATION;
    };
    video.addEventListener("loadedmetadata", onLoaded);

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting || triggeredRef.current) return;
        triggeredRef.current = true;

        const start = performance.now();
        const tick = (now: number) => {
          const t = Math.min(1, (now - start) / SNAP_MS);
          // Ease-out : rapide au départ puis se pose en douceur, comme
          // l'aimantation "snap" déjà présente dans la vidéo source.
          const eased = 1 - Math.pow(1 - t, 3);
          video.currentTime = VIDEO_DURATION * (1 - eased);
          if (t < 1) {
            requestAnimationFrame(tick);
          } else {
            setUnfolded(true);
          }
        };
        requestAnimationFrame(tick);
      },
      { threshold: 0.4 }
    );
    observer.observe(container);

    return () => {
      video.removeEventListener("loadedmetadata", onLoaded);
      observer.disconnect();
    };
  }, [prefersReducedMotion]);

  return (
    <div ref={containerRef} className="w-full">
      <div className="relative aspect-video w-full overflow-hidden rounded-3xl bg-encre/5">
        <video
          ref={videoRef}
          src={MATERIALS_VIDEO_URL}
          poster={MATERIALS_VIDEO_POSTER}
          muted
          playsInline
          preload="auto"
          className="h-full w-full object-contain"
        />
      </div>

      <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 lg:grid-cols-6">
        {MATERIALS.map((material, i) => (
          <motion.div
            key={material.title}
            initial={{ opacity: 0, y: 10 }}
            animate={unfolded ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
            transition={{ duration: 0.45, delay: i * 0.06, ease: "easeOut" }}
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
      <div className="relative z-10 mx-auto grid max-w-6xl gap-16 lg:grid-cols-[1fr_1.2fr] lg:items-center">
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
