"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";
import GlassPanel from "./GlassPanel";

/**
 * Huitième reprise — la traversée de la forêt Bellora est validée comme
 * narration ("pour la première fois, je comprends pourquoi la 3D est
 * présente"), mais deux changements structurants sur demande explicite du
 * client :
 *
 * 1. **Plus de panneau Liquid Glass "20 ans de garantie".** Cette section
 *    précède directement `GammesPreview` sur la page d'accueil
 *    (`page.tsx`) — la traversée devient la transition naturelle vers les
 *    trois vraies fiches gamme plutôt qu'un doublon d'information (le
 *    chiffre "20 ans" existe déjà ailleurs : `SavoirFaire.tsx`,
 *    `Procede.tsx`). La scène 3D (`ForestScene.tsx`) se termine sur trois
 *    volumes architecturaux qui émergent dans la clairière, sans texte —
 *    "je ne veux pas d'un décor, je veux une ambiance" — puis la section
 *    se détache et le scroll normal continue directement dans
 *    `GammesPreview`, qui porte le texte et les liens.
 * 2. **Un seul canal de scroll désormais**, pas deux : sans panneau DOM à
 *    piloter, `progressRef` (lu dans `useFrame`) suffit — la mutation de
 *    style d'un `panelRef` séparé, utile le round précédent, a disparu
 *    avec le panneau lui-même.
 *
 * **Section épinglée** (inchangé) : un conteneur `400vh` enveloppe un
 * panneau `sticky top-0 h-screen` — tant que le conteneur défile, le
 * panneau reste collé en haut du viewport ; une fois son bas atteint, il
 * se détache et le défilement normal reprend directement dans
 * `GammesPreview`, juste en dessous dans le DOM.
 *
 * **Repli inchangé dans son principe** : si `prefers-reduced-motion` est
 * actif ou si le navigateur ne peut pas fournir de contexte WebGL, la
 * section bascule vers une hauteur normale (pas de `400vh`, pas
 * d'épinglage) et présente directement les preuves fortes en glass — ce
 * contenu de repli n'a pas de raison de changer juste parce que la version
 * animée ne montre plus de chiffres : c'est un repli d'accessibilité, pas
 * une version raccourcie de la même expérience. `canRender3D` reste
 * `false` côté serveur et au tout premier rendu client pour que les deux
 * rendus soient strictement identiques avant hydratation.
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
      progressRef.current = Math.min(1, Math.max(0, raw));
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
      </div>
    </section>
  );
}
