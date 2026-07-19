"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";
import GlassPanel from "./GlassPanel";

/**
 * Septième reprise sur cette section — abandon total et explicite de la
 * direction précédente ("le monolithe sombre, la couture lumineuse et
 * l'ambiance presque noire [...] je ne veux plus essayer de réparer cette
 * idée"). Nouveau concept, radicalement différent : "traverser la forêt
 * Bellora" — une traversée continue pilotée par le scroll, pas un objet
 * isolé. Ambiance lumineuse, naturelle, apaisante ; low poly traité de
 * façon architecturale (jamais jeu vidéo, jamais cartoon). Toute l'ancienne
 * scène (`MonolithScene.tsx`, le corps scindé en deux moitiés, la couture,
 * le vide sombre) est supprimée dans son intégralité — aucune ligne
 * réutilisée, direction explicitement rejetée par le client.
 *
 * **Où en est ce fichier aujourd'hui — prototype minimal, demande
 * explicite.** "Je veux d'abord un prototype très simple [...] pas besoin
 * de construire toute la scène immédiatement." Seuls les trois premiers
 * temps du récit en quatre temps sont construits (forêt → passage qui
 * s'ouvre → clairière et lac), plus un seul panneau Liquid Glass (sur les
 * trois prévus à terme) pour valider la sensation de déplacement, la
 * lumière, la profondeur et le comportement du scroll avant d'ajouter le
 * reste. Les deux autres informations ("4–12 semaines", "100 % fabriqué en
 * France") restent pour une prochaine itération, une fois cette base
 * validée.
 *
 * **Section épinglée** (demande explicite : "la section doit être épinglée
 * pendant toute la séquence"). Technique standard, sans dépendance
 * supplémentaire : un conteneur "grand" (`400vh`) enveloppe un panneau
 * `sticky top-0 h-screen` — tant que le conteneur défile, le panneau reste
 * collé en haut du viewport, donnant tout le temps de scroll nécessaire à
 * la séquence ; une fois le bas du conteneur atteint, le panneau se
 * détache naturellement et le défilement normal reprend (le point 6 de la
 * demande, "libération de la section", découle directement de cette
 * mécanique — aucun code dédié n'est nécessaire).
 *
 * Progression de scroll calculée une fois ici (même schéma que les
 * itérations précédentes : `getBoundingClientRect` throttlé par
 * `requestAnimationFrame`) puis partagée par deux canaux distincts, chacun
 * lu sans passer par le state React : `progressRef` pour la scène R3F (lu
 * dans `useFrame`), et une mutation directe du style du panneau Liquid
 * Glass (`panelRef`, un élément DOM ordinaire) — aucun des deux ne
 * déclenche de re-render à chaque pixel scrollé.
 *
 * **Repli en cascade inchangé dans son principe, mais adapté à une section
 * épinglée.** Si `prefers-reduced-motion` est actif ou si le navigateur ne
 * peut pas fournir de contexte WebGL, la section entière bascule vers une
 * hauteur normale (pas de `400vh`, pas d'épinglage — un utilisateur en
 * repli n'a aucune raison de défiler quatre écrans pour rien) et présente
 * directement les preuves fortes en glass, sans scène 3D. `canRender3D`
 * reste `false` côté serveur et au tout premier rendu client (avant
 * hydratation) pour que les deux rendus soient strictement identiques.
 */
const ForestScene = dynamic(() => import("./notre-histoire/ForestScene"), {
  ssr: false,
  loading: () => null,
});

function supportsWebGL(): boolean {
  try {
    const canvas = document.createElement("canvas");
    return !!(
      canvas.getContext("webgl") || canvas.getContext("experimental-webgl")
    );
  } catch {
    return false;
  }
}

function ProofPoints() {
  return (
    <div className="mt-10 flex flex-wrap justify-center gap-3">
      {[
        ["Garantie", "20 ans"],
        ["Livraison", "4–12 semaines"],
        ["Fabrication", "100 % France"],
      ].map(([label, value]) => (
        <GlassPanel key={label} tone="light" rounded="rounded-2xl" className="px-5 py-3">
          <p className="text-[10px] uppercase tracking-wide text-encre-douce">{label}</p>
          <p className="text-lg font-semibold text-encre">{value}</p>
        </GlassPanel>
      ))}
    </div>
  );
}

export default function NotreHistoire() {
  const prefersReducedMotion = useReducedMotion();
  const [canRender3D, setCanRender3D] = useState(false);

  useEffect(() => {
    setCanRender3D(!prefersReducedMotion && supportsWebGL());
  }, [prefersReducedMotion]);

  const pinRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef(0);

  useEffect(() => {
    if (!canRender3D) return;
    let rafId: number | null = null;

    const updateProgress = () => {
      rafId = null;
      const el = pinRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const total = rect.height - window.innerHeight;
      const raw = total > 0 ? -rect.top / total : 0;
      const clamped = Math.min(1, Math.max(0, raw));
      progressRef.current = clamped;

      if (panelRef.current) {
        const panelT = Math.max(0, Math.min(1, (clamped - 0.82) / 0.18));
        panelRef.current.style.opacity = String(panelT);
        panelRef.current.style.transform = `translateY(${(1 - panelT) * 18}px)`;
      }
    };

    const onScroll = () => {
      if (rafId !== null) return;
      rafId = requestAnimationFrame(updateProgress);
    };

    updateProgress();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (rafId !== null) cancelAnimationFrame(rafId);
    };
  }, [canRender3D]);

  if (!canRender3D) {
    return (
      <section className="relative overflow-hidden bg-ciel px-6 py-20 sm:py-24">
        <div className="relative z-10 mx-auto max-w-3xl text-center">
          <p className="eyebrow text-xs text-encre-douce">Notre histoire</p>
          <h2 className="mt-4 text-4xl font-semibold text-encre sm:text-5xl">
            Le modulaire bois, sans compromis.
          </h2>
          <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-encre-doux">
            Ossature Douglas certifiée, isolation conforme RE2020, bardage
            Cryptomeria — chaque maison est conçue et assemblée en atelier
            français par des charpentiers et menuisiers expérimentés.
          </p>
          <ProofPoints />
        </div>
      </section>
    );
  }

  return (
    <section ref={pinRef} className="relative" style={{ height: "400vh" }}>
      <div className="sticky top-0 h-screen w-full overflow-hidden">
        <ForestScene progressRef={progressRef} />
        <div
          ref={panelRef}
          className="pointer-events-none absolute inset-x-0 bottom-[14%] flex justify-center"
          style={{ opacity: 0, transform: "translateY(18px)" }}
        >
          {/* Bob vertical très lent (CSS, `forest-panel-float`) sur un
              conteneur séparé du transform piloté par le scroll (JS,
              posé sur le parent ci-dessus) — les deux animations restent
              indépendantes plutôt que de s'écraser l'une l'autre. Le
              second bloc, flouté/estompé/inversé, évoque un reflet dans
              le lac sans dupliquer de texte lisible à l'envers. */}
          <div className="relative forest-panel-float">
            <GlassPanel
              tone="light"
              sheen
              rounded="rounded-3xl"
              className="px-9 py-6 text-center shadow-xl"
            >
              <p className="text-xs uppercase tracking-wide text-encre-douce">
                Garantie
              </p>
              <p className="mt-1 text-3xl font-semibold text-encre">20 ans</p>
            </GlassPanel>
            <div
              aria-hidden
              className="glass absolute inset-x-0 top-[calc(100%+2px)] h-1/2 origin-top scale-y-[-1] rounded-3xl opacity-20 blur-md"
              style={{
                maskImage: "linear-gradient(to bottom, rgba(0,0,0,0.6), transparent)",
                WebkitMaskImage: "linear-gradient(to bottom, rgba(0,0,0,0.6), transparent)",
              }}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
