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
 *
 * Retour client : bug de désynchronisation — un scroll haut/bas erratique
 * pouvait laisser l'affichage bloqué "compact" (matériaux groupés) alors
 * que la position de scroll réelle aurait dû montrer les matériaux
 * séparés. Cause : le déclenchement précédent réagissait au *sens* du
 * dernier scroll (`scrollingDown`/`scrollingUp`) plutôt qu'à la position
 * actuelle, et ignorait toute inversion de sens pendant qu'une animation
 * était en cours — une fois lancée, une passe se terminait toujours dans
 * son sens d'origine, même si l'utilisateur avait entre-temps rebroussé
 * chemin. Remplacé par un modèle auto-correcteur : à chaque vérification,
 * l'état désiré ("groupé" ou "déplié") est recalculé uniquement à partir
 * de la position actuelle par rapport à `THRESHOLD_VH`, jamais du sens du
 * dernier scroll. Si l'état désiré ne correspond pas à la phase en cours
 * — y compris en pleine animation dans le mauvais sens — l'animation en
 * cours est interrompue et repart immédiatement dans le bon sens. Le
 * résultat visé correspond donc toujours à la position réelle, quel que
 * soit l'historique de scroll qui y a mené.
 *
 * Retour client : un frame "qui bug" visible à chaque lancement
 * d'animation. Cause : on démarrait la boucle de dessin/lecture juste
 * après avoir demandé `currentTime = 0`, sans attendre que ce seek soit
 * réellement terminé — le premier frame dessiné pouvait donc encore
 * montrer la position précédente (fin de vidéo, milieu d'une passe
 * interrompue...) avant que le vrai début ne s'affiche. Corrigé en
 * attendant l'événement `seeked` avant de lancer `play()` et la boucle.
 *
 * Retour client : la vidéo compressée (round précédent) paraissait trop
 * floue — la baisse de résolution (1280×720) et de bitrate était trop
 * agressive pour ce contenu (mouvement rapide des matériaux). Recompressée
 * depuis le fichier original à 1920×1080, CRF 18 (contre 720p/CRF 23) :
 * toujours ~3× plus légère que l'original (1,4 Mo contre 4,46 Mo) mais
 * nettement plus nette, vérifiée sur une frame extraite.
 *
 * Retour client : lignes divisoires "dans le texte" plutôt qu'entre les
 * colonnes. Cause : `-translate-x-1/2` décale l'élément de 50% de *sa
 * propre* largeur (1px, donc 0,5px) et non de la moitié du `gap-x-4`
 * (16px) qui sépare les colonnes — la ligne restait donc quasiment collée
 * au bord gauche de sa colonne, juste à l'endroit où le texte commence.
 * Corrigée avec un décalage fixe (`-left-2`, 8px) qui la place exactement
 * au milieu du gap.
 *
 * Retour client : la ligne "tombe encore dans le texte" après le correctif
 * ci-dessus, sur certaines colonnes. Deuxième cause, distincte de la
 * première : la grille CSS étire par défaut (`align-items: stretch`)
 * chaque cellule à la hauteur de la plus haute de sa ligne — le texte
 * reste naturellement aligné en haut, mais la boîte elle-même s'étire.
 * La ligne, centrée via `top-1/2` sur *cette boîte étirée* et non sur le
 * texte réellement visible, se retrouvait bien plus bas que prévu dès
 * qu'une colonne voisine avait une description plus longue (donc plus de
 * lignes de texte) — flagrant sur les largeurs où le texte s'enroule
 * beaucoup. Corrigé en ajoutant `items-start` à la grille : chaque
 * cellule garde sa propre hauteur naturelle, `top-1/2` centre alors la
 * ligne sur le contenu réellement affiché, plus sur une hauteur de ligne
 * partagée.
 *
 * Retour client : les lignes ne sont "pas au même niveau" entre elles —
 * le correctif précédent était juste dans son objectif (centrer chaque
 * ligne sur SA colonne) mais visait le mauvais objectif : les colonnes
 * n'ont pas toutes la même hauteur ("Liteaux & lame d'air" s'enroule sur
 * 2 lignes de titre), donc un centrage par item donne des positions
 * absolues différentes d'une colonne à l'autre. Remplacé par un décalage
 * fixe depuis le haut (`top-2`, plus de `top-1/2`/`-translate-y-1/2`) :
 * comme la grille aligne déjà le sommet de chaque cellule sur la même
 * ligne, un décalage fixe retombe mécaniquement au même niveau partout,
 * quel que soit le nombre de lignes du texte voisin. Épaisseur également
 * augmentée (`w-px` → `w-[1.5px]`, opacité `/50` → `/60`) — "un peu plus
 * grasses, sans trop".
 *
 * Retour client : "pas toutes [les lignes] sont grasses" — certaines
 * paraissaient plus fines que d'autres malgré une classe identique.
 * Cause : `w-[1.5px]` est une largeur fractionnaire ; selon la position
 * horizontale exacte de chaque ligne (elle-même dépendante du texte de sa
 * colonne), le navigateur arrondit ce demi-pixel différemment d'une
 * colonne à l'autre — certaines bordent un pixel entier net, d'autres
 * tombent entre deux pixels et sont anti-aliasées, donc visuellement plus
 * fines/floues. Remplacé par `w-[2px]`, une largeur entière : rendu net
 * et identique sur les 5 lignes quelle que soit leur position.
 *
 * Retour client : au rechargement de page (cache froid), la zone vidéo
 * reste vide un court instant avant que la vidéo n'apparaisse — le canvas
 * n'est dessiné qu'à l'événement `loadeddata`, qui attend que le fichier
 * (1,4 Mo) télécharge suffisamment. Une image statique (frame 0
 * pré-détourée) avait été ajoutée pour combler ce court instant, puis
 * retirée du DOM une fois la vraie vidéo prête — mais le retour client
 * suivant a signalé des images dupliquées et des zones effacées sur
 * certains matériaux (l'image figée et le canvas ne représentaient jamais
 * exactement le même instant, donc le passage de l'un à l'autre créait un
 * chevauchement visible). Revert complet à l'époque : cette brève absence
 * de vidéo au chargement à froid était un moindre mal comparé à ce
 * chevauchement — "à la limite rajoute juste un peu de vitesse aux
 * animations c'est tout". `PLAYBACK_RATE` augmenté en conséquence (voir
 * plus bas).
 *
 * Round suivant, le client redemande explicitement de régler ce "pop" —
 * repris avec une architecture différente qui évite le défaut de la
 * tentative précédente : plus aucun SWAP (ajout puis retrait du DOM d'un
 * élément séparé, avec une fenêtre de temps où les deux pouvaient
 * coexister ou se chevaucher). Cette fois, l'image pré-détourée
 * (`public/images/materials-frame0.webp`, générée hors-ligne — extraction
 * ffmpeg de la frame 0 réelle de `materials-explode.mp4`, puis un script
 * Python qui reproduit EXACTEMENT l'algorithme de détourage ci-dessous :
 * moyenne des 4 coins comme couleur clé, `threshold=34`, `feather=30`,
 * comparaison de distance au carré) reste un enfant PERMANENT du DOM,
 * jamais retiré, positionné derrière le canvas (avant lui, donc peint
 * en-dessous par ordre naturel). Le canvas démarre entièrement
 * transparent (rien dessiné) et laisse voir cette image identique en
 * dessous ; dès que `drawFrame` s'exécute pour la première fois, il
 * peint la totalité du rectangle du canvas (`ctx.drawImage` couvre tout,
 * jamais un dessin partiel), donc l'image sous-jacente est
 * mécaniquement recouverte au pixel près — sans jamais avoir besoin de
 * la cacher ni de la retirer, donc sans fenêtre de temps où un
 * changement d'état pourrait produire un chevauchement ou un flash.
 * Comme les deux couches montrent littéralement la même frame (mêmes
 * pixels, même détourage), le risque qui avait fait échouer la première
 * tentative n'existe plus par construction, pas seulement par réglage.
 */

const EXPLODE_VIDEO_URL = "/videos/materials-explode.mp4";
const REGROUP_VIDEO_URL = "/api/materials-video";
// Ligne de déclenchement unique : le haut du bloc matériaux doit remonter
// au-dessus de cette fraction de la hauteur d'écran pour être considéré
// "déplié" ; en dessous, c'est "groupé". Recalculé à chaque vérification,
// jamais mémorisé comme un franchissement ponctuel.
const THRESHOLD_VH = 0.6;
// Vitesse de lecture des deux vidéos : plus rapide que le temps réel pour
// un effet "woosh" net (demande client, accélérée plusieurs fois), sans
// devenir brutal comme le "snap" à 650ms abandonné plus tôt dans le projet.
const PLAYBACK_RATE = 2.1;

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

      const start = () => {
        // Une interruption a pu changer la phase pendant l'attente du seek
        // (voir plus bas) : un démarrage devenu obsolète ne doit rien faire.
        if (cancelled || phase !== "exploding") return;
        explodeVideo.playbackRate = PLAYBACK_RATE;
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

      // Si la vidéo n'est pas déjà au tout début, on attend que le seek
      // soit réellement terminé avant de dessiner quoi que ce soit — sinon
      // le premier frame affiché peut encore montrer l'ancienne position
      // (fin de vidéo, milieu d'une passe interrompue...), un flash d'un
      // frame avant que la vraie lecture ne démarre.
      if (explodeVideo.currentTime > 0.03) {
        explodeVideo.addEventListener("seeked", start, { once: true });
        try {
          explodeVideo.currentTime = 0;
        } catch {
          explodeVideo.removeEventListener("seeked", start);
          start();
        }
      } else {
        start();
      }
    };

    // Repliement : lecture native de la vidéo d'origine du client (sens
    // d'enregistrement naturel, matériaux qui s'assemblent).
    const runRegroup = () => {
      phase = "regrouping";
      setUnfolded(false);
      explodeVideo.pause();

      const start = () => {
        if (cancelled || phase !== "regrouping") return;
        regroupVideo.playbackRate = PLAYBACK_RATE;
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

      if (regroupVideo.currentTime > 0.03) {
        regroupVideo.addEventListener("seeked", start, { once: true });
        try {
          regroupVideo.currentTime = 0;
        } catch {
          regroupVideo.removeEventListener("seeked", start);
          start();
        }
      } else {
        start();
      }
    };

    // Auto-correcteur : l'état désiré ne dépend que de la position actuelle,
    // jamais du sens du dernier scroll. Une animation en cours dans le
    // mauvais sens est interrompue et relancée immédiatement dans le bon —
    // le résultat correspond donc toujours à la position réelle, quel que
    // soit l'enchaînement de scrolls qui y a mené (voir commentaire de
    // fichier).
    const syncState = () => {
      if (!container.isConnected) return;
      const rect = container.getBoundingClientRect();
      const desiredExploded = rect.top < window.innerHeight * THRESHOLD_VH;

      if (desiredExploded) {
        if (phase === "grouped") {
          runExplode();
        } else if (phase === "regrouping") {
          stopPlayLoop();
          runExplode();
        }
      } else if (phase === "exploded") {
        runRegroup();
      } else if (phase === "exploding") {
        stopPlayLoop();
        runRegroup();
      }
    };
    window.addEventListener("scroll", syncState, { passive: true });
    // Couvre le cas d'un chargement déjà scrollé au-delà du seuil (lien
    // profond, restauration de position) sans attendre un premier scroll.
    syncState();

    return () => {
      cancelled = true;
      explodeVideo.removeEventListener("loadedmetadata", onExplodeMeta);
      explodeVideo.removeEventListener("loadeddata", onExplodeReady);
      window.removeEventListener("scroll", syncState);
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
        {/* Frame 0 pré-détourée hors-ligne, posée en permanence derrière le
            canvas (voir commentaire git en tête de fichier) — comble le
            "pop" au chargement à froid sans jamais être retirée du DOM. */}
        <img
          src="/images/materials-frame0.webp"
          alt=""
          aria-hidden
          className="absolute inset-0 h-full w-full object-contain"
        />
        <canvas
          ref={canvasRef}
          aria-hidden
          className="absolute inset-0 h-full w-full object-contain"
        />
      </div>

      <div className="mt-8 grid grid-cols-2 items-start gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-6">
        {MATERIALS.map((material, i) => (
          <motion.div
            key={material.title}
            initial={{ opacity: 0, y: 14 }}
            animate={unfolded ? { opacity: 1, y: 0 } : { opacity: 0, y: 14 }}
            transition={{ duration: 0.5, delay: 0.1 + i * 0.13, ease: [0.22, 1, 0.36, 1] }}
            className="relative"
          >
            {i > 0 && (
              // Courte ligne dorée à hauteur FIXE depuis le haut de la
              // ligne de grille, jamais centrée sur la boîte de l'item.
              // Avec `items-start`, chaque item est déjà aligné en haut de
              // la rangée — mais "Liteaux & lame d'air" a un titre qui
              // s'enroule sur 2 lignes, donc sa boîte est plus haute que
              // les autres. Un centrage `top-1/2` sur SA PROPRE boîte
              // plaçait donc sa ligne plus bas que les 5 autres : correct
              // par item, incohérent sur la rangée. Un décalage fixe
              // depuis le haut (identique pour les 6 colonnes) règle ça —
              // toutes les lignes tombent au même niveau, quel que soit le
              // nombre de lignes du texte voisin.
              <span
                aria-hidden
                className="absolute -left-2 top-2 hidden h-10 w-[2px] bg-laiton/60 lg:block"
              />
            )}
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
