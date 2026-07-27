"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

/**
 * Refonte complète sur direction précise du client, référence visuelle à
 * l'appui : à gauche un objet qui se transforme en boucle continue (bois →
 * horloge → maison → bois), à droite un texte qui change en même temps que
 * l'objet ; en bas, une frise à 3 étapes (Matière / Temps / Espace) qui
 * suit l'étape active. Remplace l'ancienne version (3 cartes glass côte à
 * côte, sans objet) — l'ancien contenu texte (subtitle/title/body de
 * chaque pilier) est conservé tel quel, seule la mise en forme change.
 *
 * Le client a fourni 3 vidéos, chacune une transformation complète dans un
 * seul sens (jamais besoin de les lire à l'envers) : bois→horloge,
 * horloge→maison, maison→bois — la troisième referme la boucle. Même
 * architecture que les matériaux de "Notre histoire" (`NotreHistoire.tsx`) :
 * chaque vidéo se relit nativement vers l'avant, jamais de scrub. Contexte
 * différent en revanche : ici pas de scroll-threshold, juste une boucle
 * automatique continue ("il y a pas d'animation au scroll, juste en
 * boucle") — la vidéo suivante se lance après un temps de pause fixe
 * (`HOLD_MS`), pas au franchissement d'une position de scroll.
 *
 * Détourage au pixel : historique mouvementé sur 3 tournages successifs
 * (distance de couleur globale, flood fill, fond vert) — le fond vert,
 * même une fois fluidifié et son ombre corrigée, restait "tout pixélisé"
 * à l'usage réel : le canvas de travail réduit (`KEY_SCALE`, nécessaire
 * pour rester fluide) revenait à afficher l'objet à ~60% de la résolution
 * d'affichage réagrandie, visible à l'œil une fois la vidéo agrandie sur
 * PC. Le client a tranché : plus de détourage du tout. Les 3 vidéos ont
 * été retournées une troisième fois, cette fois directement sur un fond
 * qui matche la teinte de la page — la vidéo s'affiche donc telle quelle
 * (`drawImage` direct, sans lecture de pixels), sans perte de netteté
 * possible puisqu'il n'y a plus de traitement entre la vidéo et l'écran.
 * Sur desktop, la colonne vidéo est volontairement plus large que la
 * colonne texte (`lg:grid-cols-[1.35fr_1fr]`) — demande client ("grandis
 * bien la vidéo sur PC").
 *
 * Le fond n'est en fait PAS identique au pixel près : mesure précise
 * (échantillonnage de plusieurs points par frame extraite, sur les 3
 * vidéos) donne ~rgb(253, 252, 245), contre `--brume` #f7f5f0 =
 * rgb(247, 245, 240) pour le reste de la page — un écart de ~2% par
 * canal, jugé "invisible" au round précédent mais qui en réalité
 * dessinait un liseré rectangulaire visible autour de la vidéo une fois
 * en usage réel (retour client : "la couleur du fond n'est pas pareille
 * que celui de l'image"). Plutôt que retoucher `--brume` globalement
 * (utilisé partout sur le site) ou retenter un détourage pixel par pixel
 * (déjà abandonné pour la pixelisation), un halo radial très doux est
 * superposé au bord du cadre vidéo (`radial-gradient` transparent au
 * centre → `--brume` sur l'anneau extérieur) : il absorbe le léger écart
 * de teinte pile là où il se voit, sans jamais mordre sur le sujet au
 * centre puisque le dégradé ne démarre qu'à ~72% du rayon.
 *
 * Bug de taille du halo, trouvé après un retour client ("on revoit la
 * différence, même sur le bois") : sans mot-clé de taille explicite, un
 * `radial-gradient` utilise `farthest-corner` par défaut — le rayon à
 * 100% est calé sur la distance au COIN le plus éloigné. Sur un cadre
 * carré, le milieu d'un bord n'est qu'à ~70,7% de cette distance (ratio
 * du rayon inscrit au rayon circonscrit), pile EN DESSOUS du seuil
 * transparent à 72% choisi ici — le halo ne couvrait donc quasiment pas
 * le milieu des bords, seulement les coins, laissant le liseré exposé
 * pile là où l'œil le remarque le plus (les bords, pas les coins).
 * Corrigé en forçant `farthest-side` : le rayon à 100% est alors calé sur
 * la distance au bord le plus proche, donc le milieu de chaque bord est
 * intégralement couvert, et les coins (au-delà de ce rayon) le sont aussi
 * puisqu'un dégradé continue avec la couleur du dernier point après elle.
 *
 * Ombres de feuilles : retirées. 3 repositionnements successifs (collées
 * au cadre, coins du cadre avec marge, coins de la section avec/sans
 * débordement) n'ont jamais donné un résultat jugé correct par le client
 * ("enlève les feuilles, ça marche pas") — abandonnées plutôt que
 * retentées une 4e fois à l'aveugle sans pouvoir les prévisualiser
 * localement (CDN bloqué par la politique réseau de ce bac à sable, déjà
 * confirmé refusé à plusieurs reprises).
 *
 * La boucle ne démarre qu'une fois la section réellement visible
 * (`IntersectionObserver`, une seule fois) — pas la peine de faire tourner
 * une vidéo que personne ne regarde encore au chargement de la page.
 *
 * Filet de sécurité (`TRANSITION_TIMEOUT_MS`) : comme pour les matériaux,
 * si une vidéo ne joue jamais (codec non supporté, fichier introuvable),
 * l'étape active avance quand même après un délai — jamais bloqué. Ce bac
 * à sable (Chromium sans décodeur H.264 propriétaire, déjà documenté dans
 * `NotreHistoire.tsx`) ne peut de toute façon jamais lire ces vidéos à
 * l'écran ici ; c'est ce filet de sécurité qui permet de vérifier la
 * mécanique (changement d'étape, texte, frise) malgré tout.
 *
 * Espace avant "Notre histoire" (`pb-28` flat à l'origine, 112px sur
 * tous les écrans) : jugé trop vide sur mobile, où le vide s'ajoute à
 * l'ordre inversé (texte puis vidéo) qui laisse déjà le grand carré de
 * la vidéo en dernier avant la section suivante. Réduit et rendu
 * responsive (`pb-16 sm:pb-20 lg:pb-24`) — plus resserré sur mobile où
 * le vide se voyait le plus, un peu resserré aussi sur desktop.
 *
 * Grand vide en HAUT de la section, signalé sur capture d'écran desktop :
 * mesuré précisément via Playwright (bounding rects) plutôt que deviné —
 * `pt-12 sm:pt-16` n'était qu'une petite partie du problème, réduit à
 * `pt-6 sm:pt-8`. La vraie cause, plus significative : la grille
 * (`items-center`) centrait verticalement la colonne de texte (plus
 * courte, ~430px) dans la hauteur de la ligne définie par la carte vidéo
 * carrée (plus haute, ~600px) — un écart mesuré de ~83px entre le haut
 * de la ligne et le haut du texte, entièrement dû à ce centrage, pas à
 * une marge. Passé à `items-start` : les deux colonnes démarrent
 * maintenant au même niveau, en haut de la ligne. Reste hors de portée
 * CSS : le vide propre à la composition de CHAQUE vidéo (l'objet est
 * souvent cadré bas dans son image carrée, avec de la marge au-dessus,
 * un choix de rendu du client) — non modifiable sans recadrer/zoomer la
 * vidéo elle-même (risqué, changerait le cadrage à chaque étape de la
 * transition), donc volontairement pas touché ici.
 */

const TRANSITIONS = [
  "/videos/piliers-bois-horloge.mp4",
  "/videos/piliers-horloge-maison.mp4",
  "/videos/piliers-maison-bois.mp4",
] as const;

const STEPS = [
  {
    id: "matiere",
    tabLabel: "Matière",
    icon: "tree",
    subtitle: "Une matière vivante",
    title: "Le bois, noblement",
    body: "Épicéa et Douglas certifiés, châssis acier soudé, finition à la main.",
  },
  {
    id: "temps",
    tabLabel: "Temps",
    icon: "clock",
    subtitle: "De la signature à la pose",
    title: "Le temps, maîtrisé",
    body: "Quatre à douze semaines. Pas d'imprévus, pas de surprises.",
  },
  {
    id: "espace",
    tabLabel: "Espace",
    icon: "home",
    subtitle: "Neuf combinaisons",
    title: "L'espace, à vous",
    body: "Trois gammes, neuf configurations à votre image.",
  },
] as const;

// Temps de pause sur chaque état statique avant de lancer la transition
// suivante — le temps de lire le texte associé.
const HOLD_MS = 3200;
// Filet de sécurité par transition (vidéos de ~3s chacune à vitesse 1x,
// large marge même accéléré).
const TRANSITION_TIMEOUT_MS = 6000;
// Vitesse de lecture des transitions — demande client ("l'animation aille
// plus vite"), vidéos de ~3s à vitesse native jugées trop lentes.
const PLAYBACK_RATE = 1.7;

function StepIcon({ name }: { name: (typeof STEPS)[number]["icon"] }) {
  const common = {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.5,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    className: "h-6 w-6",
  };
  if (name === "tree") {
    return (
      <svg {...common}>
        <circle cx="12" cy="9" r="5.5" />
        <path d="M12 14.5V21M8.5 21h7" />
      </svg>
    );
  }
  if (name === "clock") {
    return (
      <svg {...common}>
        <circle cx="12" cy="12" r="8.5" />
        <path d="M12 7.5V12l3.2 2" />
      </svg>
    );
  }
  return (
    <svg {...common}>
      <path d="M3 11.5 12 4l9 7.5" />
      <path d="M5.5 10v10.5h13V10" />
    </svg>
  );
}

export default function ThreePiliers() {
  const prefersReducedMotion = useReducedMotion();
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const video0Ref = useRef<HTMLVideoElement>(null);
  const video1Ref = useRef<HTMLVideoElement>(null);
  const video2Ref = useRef<HTMLVideoElement>(null);
  const [activeStep, setActiveStep] = useState<0 | 1 | 2>(0);
  // Miroir synchrone de `activeStep` : la boucle vit dans un `useEffect`
  // dont les closures ne voient jamais l'état React à jour. Le bouton
  // "avancer" (déclenché par un clic, donc en dehors du cycle de rendu)
  // a besoin de connaître l'étape courante au moment du clic, pas celle
  // capturée à la création de l'effet.
  const currentStepRef = useRef<0 | 1 | 2>(0);
  // Rempli par l'effet ci-dessous : permet au bouton "avancer" (JSX) de
  // déclencher la même mécanique de transition que la boucle automatique,
  // sans dupliquer cette mécanique ni la sortir de l'effet.
  const skipForwardRef = useRef<(() => void) | null>(null);

  const drawFrame = useCallback((video: HTMLVideoElement) => {
    const canvas = canvasRef.current;
    if (!canvas || video.videoWidth === 0) return;

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
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    // Aucun détourage : la vidéo est déjà rendue sur un fond assorti au
    // site et avec sa propre ombre portée (voir note en tête de fichier)
    // — dessin direct à pleine résolution, rien à perdre en netteté.
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    const v0 = video0Ref.current;
    const v1 = video1Ref.current;
    const v2 = video2Ref.current;
    if (!container || !v0 || !v1 || !v2) return;

    const videos = [v0, v1, v2] as const;
    let cancelled = false;
    let started = false;
    let holdTimeout: ReturnType<typeof setTimeout> | null = null;
    let hardStop: ReturnType<typeof setTimeout> | null = null;
    let rafId: number | null = null;

    const stopRaf = () => {
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
    };

    // `setActiveStep` seul ne suffit pas au bouton "avancer" : il ne verra
    // jamais la valeur mise à jour (fermeture figée au montage de
    // l'effet). Chaque bascule d'étape passe donc par ce helper, qui met
    // aussi à jour `currentStepRef` en plus de l'état React.
    const goToStep = (step: 0 | 1 | 2) => {
      currentStepRef.current = step;
      setActiveStep(step);
    };

    if (prefersReducedMotion) {
      const onReady = () => {
        if (cancelled) return;
        drawFrame(v0);
      };
      v0.addEventListener("loadeddata", onReady, { once: true });
      return () => {
        cancelled = true;
        v0.removeEventListener("loadeddata", onReady);
      };
    }

    // Vrai pendant toute la durée d'une transition (vidéo en cours de
    // lecture, du premier appel de `playTransition` jusqu'au changement
    // d'étape) — empêche le bouton "avancer" de déclencher une 2e
    // transition par-dessus celle déjà en cours (double-clic, ou clic
    // pendant la lecture).
    let transitioning = false;

    const scheduleHold = (step: 0 | 1 | 2) => {
      holdTimeout = setTimeout(() => {
        if (cancelled) return;
        playTransition(step);
      }, HOLD_MS);
    };

    const playTransition = (fromStep: 0 | 1 | 2) => {
      transitioning = true;
      const video = videos[fromStep];
      const toStep = (((fromStep + 1) % 3) as 0 | 1 | 2);

      const start = () => {
        if (cancelled) return;
        video.playbackRate = PLAYBACK_RATE;
        video.play().catch(() => {});
        hardStop = setTimeout(() => {
          stopRaf();
          video.pause();
          transitioning = false;
          goToStep(toStep);
          scheduleHold(toStep);
        }, TRANSITION_TIMEOUT_MS);

        const loop = () => {
          if (cancelled) return;
          drawFrame(video);
          const atEnd =
            video.ended ||
            (Number.isFinite(video.duration) &&
              video.currentTime >= video.duration - 0.03);
          if (video.paused && !atEnd) {
            rafId = requestAnimationFrame(loop);
            return;
          }
          if (atEnd) {
            if (hardStop) {
              clearTimeout(hardStop);
              hardStop = null;
            }
            video.pause();
            transitioning = false;
            goToStep(toStep);
            scheduleHold(toStep);
            return;
          }
          rafId = requestAnimationFrame(loop);
        };
        rafId = requestAnimationFrame(loop);
      };

      if (video.currentTime > 0.03) {
        const onSeeked = () => start();
        video.addEventListener("seeked", onSeeked, { once: true });
        try {
          video.currentTime = 0;
        } catch {
          video.removeEventListener("seeked", onSeeked);
          start();
        }
      } else {
        start();
      }
    };

    // Bouton "avancer" (frise, clic manuel) : coupe l'attente en cours et
    // lance tout de suite la transition suivante — pour les clients qui
    // ne veulent pas attendre la boucle automatique. Ignoré si une
    // transition est déjà en train de jouer (évite les doubles-déclenchements).
    skipForwardRef.current = () => {
      if (cancelled || transitioning || !started) return;
      if (holdTimeout) {
        clearTimeout(holdTimeout);
        holdTimeout = null;
      }
      playTransition(currentStepRef.current);
    };

    // Ne dépend PAS d'un événement vidéo (`loadeddata`) pour démarrer : ça a
    // été essayé, puis corrigé — cet événement demande que le décodeur ait
    // vraiment une frame prête, et rien ne garantit qu'il se déclenche vite
    // (réseau lent, ou jamais du tout dans ce bac à sable qui n'a pas de
    // décodeur H.264). `drawFrame`/`.play()` sont déjà sans risque si la
    // vidéo n'est pas encore prête (`drawFrame` sort tôt si `videoWidth`
    // vaut 0, `.play()` sur une vidéo pas assez chargée ne fait rien de
    // grave) et le filet de sécurité (`TRANSITION_TIMEOUT_MS`) fait de
    // toute façon avancer l'étape même si la vidéo ne joue jamais — donc la
    // bascule ne doit dépendre que de la visibilité de la section.
    const maybeStart = () => {
      if (started || cancelled) return;
      started = true;
      drawFrame(v0);
      goToStep(0);
      scheduleHold(0);
    };

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          maybeStart();
          observer.disconnect();
        }
      },
      { threshold: 0.2 }
    );
    observer.observe(container);

    return () => {
      cancelled = true;
      stopRaf();
      if (holdTimeout) clearTimeout(holdTimeout);
      if (hardStop) clearTimeout(hardStop);
      observer.disconnect();
      videos.forEach((v) => v.pause());
      skipForwardRef.current = null;
    };
  }, [prefersReducedMotion, drawFrame]);

  const step = STEPS[activeStep];

  return (
    <section id="concept" className="relative overflow-hidden pb-16 pt-6 sm:pb-20 sm:pt-8 lg:pb-24">
      {/* Ombres de feuilles retirées : 3 repositionnements successifs
          (collées au cadre, coins du cadre avec marge, coins de la
          section) n'ont jamais donné un résultat jugé correct par le
          client ("enlève les feuilles, ça marche pas"). Voir le
          commentaire git en tête de fichier pour l'historique complet —
          pas réintroduites depuis. */}
      <div className="relative mx-auto max-w-6xl px-6">
        <div className="grid items-start gap-12 lg:grid-cols-[1.35fr_1fr] lg:gap-16">
          <div className="relative order-2 mx-auto aspect-square w-full max-w-md lg:order-1 lg:max-w-none">
            {/* Plus de cadre ni de fond propre : la vidéo, déjà rendue sur
                un fond assorti au site (voir note en tête de fichier), se
                pose directement sur le fond de la page, comme une vraie
                photo produit. `overflow-hidden` n'est plus nécessaire non
                plus : il n'y a plus de cadre à masquer, juste la vidéo
                telle quelle. */}
            <div ref={containerRef} className="absolute inset-0">
              <video
                ref={video0Ref}
                src={TRANSITIONS[0]}
                muted
                playsInline
                preload="auto"
                aria-hidden
                className="absolute inset-0 h-full w-full object-contain opacity-0"
              />
              <video
                ref={video1Ref}
                src={TRANSITIONS[1]}
                muted
                playsInline
                preload="auto"
                aria-hidden
                className="absolute inset-0 h-full w-full object-contain opacity-0"
              />
              <video
                ref={video2Ref}
                src={TRANSITIONS[2]}
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
              {/* Halo qui absorbe le très léger écart de teinte entre le
                  fond de la vidéo (~rgb(253, 252, 245)) et celui de la
                  page (`--brume`, rgb(247, 245, 240)) — voir note en tête
                  de fichier. Transparent jusqu'à 72% du rayon pour ne
                  jamais mordre sur le sujet au centre, opaque seulement
                  sur l'anneau extérieur, là où le liseré se voyait. */}
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0"
                style={{
                  background:
                    "radial-gradient(ellipse farthest-side at center, transparent 72%, var(--brume) 100%)",
                }}
              />
            </div>
          </div>

          <div className="order-1 lg:order-2">
            <AnimatePresence mode="wait">
              <motion.div
                key={`icon-${activeStep}`}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                className="flex h-14 w-14 items-center justify-center rounded-full border border-laiton/40 text-laiton"
              >
                <StepIcon name={step.icon} />
              </motion.div>
            </AnimatePresence>

            <p className="eyebrow mt-6 text-xs text-laiton">Concept</p>

            <AnimatePresence mode="wait">
              <motion.div
                key={`text-${activeStep}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              >
                <h2 className="mt-4 text-4xl font-semibold text-encre sm:text-5xl">
                  {step.subtitle}
                </h2>
                <span aria-hidden className="mt-6 block h-px w-8 bg-laiton" />
                <p className="mt-6 max-w-md text-base leading-relaxed text-encre-doux">
                  <strong className="font-semibold text-encre">
                    {step.title}.
                  </strong>{" "}
                  {step.body}
                </p>
              </motion.div>
            </AnimatePresence>

            <div className="mt-14 flex items-center gap-6 sm:mt-16">
              <div className="flex-1">
                <div className="relative h-px w-full bg-encre-douce/15">
                  <motion.div
                    className="absolute inset-y-0 w-1/3 bg-laiton"
                    animate={{ left: `${(activeStep * 100) / 3}%` }}
                    transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                  />
                  {/* Un point au centre de chaque tiers : marque la position
                      exacte de chaque étape sur la frise plutôt qu'une simple
                      barre pleine, cohérent avec une vraie séquence 01→02→03. */}
                  {STEPS.map((s, i) => (
                    <span
                      key={s.id}
                      aria-hidden
                      className={`absolute top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full transition-all duration-300 ${
                        i < activeStep
                          ? "h-1.5 w-1.5 bg-laiton"
                          : i === activeStep
                            ? "h-2.5 w-2.5 bg-laiton shadow-[0_0_0_4px_rgba(173,138,85,0.18)]"
                            : "h-1.5 w-1.5 border border-encre-douce/30 bg-brume"
                      }`}
                      style={{ left: `${((i + 0.5) * 100) / 3}%` }}
                    />
                  ))}
                </div>
                <div className="mt-4 grid grid-cols-3">
                  {STEPS.map((s, i) => (
                    <div
                      key={s.id}
                      className="flex flex-col items-center gap-1 text-center"
                    >
                      <span
                        className={`eyebrow text-[11px] transition-colors duration-300 ${
                          i === activeStep ? "text-laiton" : "text-encre-douce/50"
                        }`}
                      >
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <span
                        className={`text-sm font-medium transition-colors duration-300 ${
                          i === activeStep ? "text-encre" : "text-encre-douce"
                        }`}
                      >
                        {s.tabLabel}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {!prefersReducedMotion && (
                <motion.button
                  type="button"
                  onClick={() => skipForwardRef.current?.()}
                  whileTap={{ scale: 0.9 }}
                  whileHover={{ scale: 1.05 }}
                  aria-label="Passer à l'étape suivante"
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-laiton/40 text-laiton transition-colors duration-300 hover:border-laiton hover:bg-laiton/10"
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={1.5}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-4 w-4"
                  >
                    <path d="M4 12h15M13 6l6 6-6 6" />
                  </svg>
                </motion.button>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
