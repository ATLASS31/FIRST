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
 */

const MATERIALS_VIDEO_URL = "/api/materials-video";
// Généré à l'endroit (les 6 matériaux glissent les uns vers les autres
// jusqu'à former un seul bloc) ; on la joue à l'envers, du dernier frame
// (bloc assemblé, l'état de repos) vers le premier (matériaux écartés,
// l'état "déplié"), en continu au fil du scroll.
const VIDEO_DURATION = 4;
// Fenêtre de scroll sur laquelle la séparation se joue : 0 quand le haut
// du bloc matériaux est encore bas dans le viewport (à peine visible), 1
// une fois remonté vers le tiers supérieur — un défilement normal, sans
// pin ni scroll-jacking, juste le passage naturel de la section à l'écran.
const REVEAL_START_VH = 0.85;
const REVEAL_END_VH = 0.35;

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
 * affiché, une fois le fond détouré. `currentTime` suit en continu la
 * position de scroll (voir `REVEAL_START_VH`/`REVEAL_END_VH`) : jamais de
 * durée fixe, jamais deux seeks en vol en même temps (`!video.seeking`),
 * donc jamais de saut brutal, dans un sens comme dans l'autre. Les
 * légendes suivent la même logique continue et réversible.
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

    if (canvas.width !== video.videoWidth) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
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
        keyColorRef.current = [data[0], data[1], data[2]];
      }
      const [kr, kg, kb] = keyColorRef.current;
      const threshold = 26;
      const feather = 20;

      for (let i = 0; i < data.length; i += 4) {
        const dr = data[i] - kr;
        const dg = data[i + 1] - kg;
        const db = data[i + 2] - kb;
        const dist = Math.sqrt(dr * dr + dg * dg + db * db);
        if (dist < threshold) {
          data[i + 3] = 0;
        } else if (dist < threshold + feather) {
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

    const getProgress = () => {
      const rect = container.getBoundingClientRect();
      const vh = window.innerHeight;
      const start = vh * REVEAL_START_VH;
      const end = vh * REVEAL_END_VH;
      return Math.min(Math.max((start - rect.top) / (start - end), 0), 1);
    };

    let rafId: number | null = null;

    const tick = () => {
      const progress = getProgress();
      const targetTime = VIDEO_DURATION * (1 - progress);

      // On ne redemande un seek que si le précédent est bien terminé —
      // c'est ce qui garantit un mouvement lisse plutôt que des sauts
      // (voir commentaire de fichier).
      if (!video.seeking && Math.abs(targetTime - video.currentTime) > 0.015) {
        try {
          video.currentTime = targetTime;
        } catch {
          // Vidéo pas encore prête (métadonnées non chargées) : on
          // réessaiera à la frame suivante.
        }
      }

      setUnfolded((prev) => {
        const next = progress > 0.9;
        return prev === next ? prev : next;
      });

      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);

    return () => {
      video.removeEventListener("loadedmetadata", onLoaded);
      video.removeEventListener("seeked", onSeeked);
      if (rafId !== null) cancelAnimationFrame(rafId);
    };
  }, [prefersReducedMotion, drawFrame]);

  return (
    <div ref={containerRef} className="w-full">
      <div className="relative aspect-video w-full">
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
