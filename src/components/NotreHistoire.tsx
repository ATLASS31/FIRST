"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";
import GlassPanel from "./GlassPanel";
import { GAMMES } from "@/lib/gammes";

/**
 * Neuvième reprise — recadrage du client après le round précédent : "le
 * concept est déjà validé [...] ne cherche plus à inventer, cherche à
 * perfectionner." Le déroulé reste exactement celui déjà construit (forêt
 * → la caméra avance → les arbres s'écartent → le lac → les trois cartes
 * gammes au-dessus du lac → le scroll continue) ; seule la fin de séquence
 * change de nature.
 *
 * Les trois volumes architecturaux simplifiés du round précédent
 * disparaissent ("les espèces de cubes blancs [...] ça casse tout [...]
 * soit on montre les vraies maisons, soit on ne montre rien, mais
 * certainement pas des cubes"). À la place : les trois vraies cartes
 * gammes (`GAMMES` de `lib/gammes.ts` — mêmes photos, mêmes intitulés,
 * mêmes liens que `GammesPreview`, "les cartes existent déjà", aucune
 * nouvelle carte inventée ici) apparaissent en cascade au-dessus du lac,
 * dans un panneau Liquid Glass chacune, puis la section se détache et le
 * scroll normal continue directement dans `GammesPreview` juste en
 * dessous — qui reste la version "grille" complète (survol, highlights),
 * cette apparition-ci n'est qu'un teaser qui pointe vers les mêmes pages.
 *
 * Un troisième canal de style DOM s'ajoute donc à `progressRef` : trois
 * refs de carte (`cardRefs`), chacune mutée directement par le même
 * gestionnaire de scroll throttlé, avec un seuil décalé par carte pour
 * une cascade plutôt qu'une apparition synchrone des trois à la fois —
 * toujours sans passer par le state React.
 *
 * **Section épinglée et repli** inchangés dans leur principe (cf. rounds
 * précédents) : conteneur `400vh` + panneau `sticky`, repli statique en
 * glass si `prefers-reduced-motion` ou pas de WebGL.
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

/* Seuil de révélation décalé par carte (cascade plutôt que synchrone) :
   la fenêtre se termine pile quand la progression atteint 1 pour la
   dernière carte — la révélation se termine avec la séquence, pas avant. */
const CARD_REVEAL_SPAN = 0.18;
const CARD_REVEAL_STAGGER = 0.06;
const CARD_REVEAL_START = 1 - CARD_REVEAL_SPAN - CARD_REVEAL_STAGGER * (GAMMES.length - 1);

export default function NotreHistoire() {
  const prefersReducedMotion = useReducedMotion();
  const [canRender3D, setCanRender3D] = useState(false);

  useEffect(() => {
    setCanRender3D(!prefersReducedMotion && supportsWebGL());
  }, [prefersReducedMotion]);

  const pinRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef(0);
  const cardRefs = useRef<Array<HTMLAnchorElement | null>>([]);

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

      cardRefs.current.forEach((card, i) => {
        if (!card) return;
        const start = CARD_REVEAL_START + i * CARD_REVEAL_STAGGER;
        const t = Math.max(0, Math.min(1, (clamped - start) / CARD_REVEAL_SPAN));
        const eased = t * t * (3 - 2 * t);
        card.style.opacity = String(eased);
        card.style.transform = `translateY(${(1 - eased) * 26}px) scale(${0.96 + eased * 0.04})`;
      });
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

        <div className="pointer-events-none absolute inset-x-0 bottom-[9%] flex justify-center gap-4 px-4 sm:gap-6">
          {GAMMES.map((gamme, i) => (
            <Link
              key={gamme.slug}
              ref={(node) => {
                cardRefs.current[i] = node;
              }}
              href={gamme.href}
              className="pointer-events-auto relative block w-[clamp(112px,15vw,192px)]"
              style={{ opacity: 0, transform: "translateY(26px) scale(0.96)" }}
            >
              {/* Le bob CSS (`forest-card-float`) vit sur ce conteneur
                  interne, séparé du `<Link>` qui porte le transform de
                  révélation piloté par le scroll (JS, ci-dessus) — sinon
                  l'animation CSS et la mutation JS s'écrasent l'une
                  l'autre en se disputant la même propriété `transform`
                  sur le même élément. */}
              <div className="forest-card-float" style={{ animationDelay: `${i * 0.6}s` }}>
                <GlassPanel tone="light" sheen rounded="rounded-2xl" className="p-2 shadow-xl transition-transform duration-300 hover:-translate-y-1">
                  <div className="relative aspect-[4/5] overflow-hidden rounded-xl">
                    <Image
                      src={gamme.imageUrl}
                      alt={`Maison Bellora, gamme ${gamme.name}`}
                      fill
                      sizes="(min-width: 640px) 15vw, 30vw"
                      className="object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-encre/80 via-encre/10 to-transparent" />
                    <span className={`glass absolute left-2 top-2 rounded-full px-2 py-0.5 text-[9px] font-semibold text-${gamme.accent} sm:text-[10px]`}>
                      {gamme.name}
                    </span>
                  </div>
                  <div className="px-1 py-1.5">
                    <p className="truncate text-[10px] leading-tight text-encre-douce sm:text-xs">
                      {gamme.cardTagline}
                    </p>
                  </div>
                </GlassPanel>
                <div
                  aria-hidden
                  className="glass absolute inset-x-0 top-[calc(100%+2px)] h-1/2 origin-top scale-y-[-1] rounded-2xl opacity-15 blur-md"
                  style={{
                    maskImage: "linear-gradient(to bottom, rgba(0,0,0,0.6), transparent)",
                    WebkitMaskImage: "linear-gradient(to bottom, rgba(0,0,0,0.6), transparent)",
                  }}
                />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
