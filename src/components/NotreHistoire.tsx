"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { useReducedMotion } from "framer-motion";

/**
 * Cinquième repartie sur cette section — la plus profonde. Après
 * validation explicite du client sur une direction radicalement
 * différente ("La maison qui vous ressemble" : une séquence temps réel
 * pilotée par le scroll, pas une carte ni un objet décoratif), le
 * chantier est volontairement découpé en étapes contrôlées ("il faut les
 * bonnes fondations pour ce chantier").
 *
 * **Où en est ce fichier aujourd'hui — phase 1 seulement.** Toute
 * l'ancienne mise en page (texte à gauche, carte/objet 3D CSS à droite)
 * a été retirée : elle appartenait à une direction que le client a
 * explicitement abandonnée, pas de code mort gardé "au cas où". Ce qui
 * est en place ici n'est que le socle technique du nouveau chantier — une
 * scène Three.js/React Three Fiber minimale (`HouseScene`, voir
 * `notre-histoire/HouseScene.tsx`) qui ne construit que le premier temps
 * du storyboard validé (coquille architecturale vide, lumière d'aube).
 * Le texte ci-dessous et la mise en page en deux colonnes sont un
 * placeholder temporaire, pas la version finale : la maquette réelle
 * ("une seule phrase à la fin", plein cadre) viendra dans une phase
 * ultérieure, une fois le socle 3D solidifié.
 *
 * Trois décisions techniques structurent ce socle :
 * 1. **Import dynamique sans SSR.** `next/dynamic(..., { ssr: false })` :
 *    Three.js a besoin d'un vrai contexte WebGL, qui n'existe pas côté
 *    serveur. Charger la scène en SSR échouerait ou forcerait un
 *    contournement fragile ; l'import dynamique la reporte entièrement au
 *    client, avec un état de chargement pendant ce temps.
 * 2. **Isolation du poids.** `HouseScene.tsx` est le seul fichier du
 *    projet à importer `three`/`@react-three/fiber` ; grâce au découpage
 *    de code automatique de Next.js sur les imports dynamiques, ce poids
 *    (~600 Ko avant compression pour Three seul) ne charge que sur cette
 *    page, jamais sur le reste du site.
 * 3. **Repli en cascade.** Avant même de tenter de charger la scène : si
 *    `prefers-reduced-motion` est actif OU si le navigateur ne peut pas
 *    fournir de contexte WebGL (`getContext("webgl")` renvoie `null` —
 *    testé une fois au montage, pas à chaque rendu), un panneau statique
 *    neutre s'affiche à la place. Aucun risque de page cassée sur un
 *    navigateur sans WebGL, aucune animation imposée à qui a demandé de
 *    la limiter.
 */
const HouseScene = dynamic(() => import("./notre-histoire/HouseScene"), {
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

export default function NotreHistoire() {
  const prefersReducedMotion = useReducedMotion();
  // `null` = "pas encore déterminé" (toujours le cas côté serveur et au
  // tout premier rendu client, avant hydratation) — le repli statique est
  // donc ce qui s'affiche par défaut des deux côtés, sans écart possible
  // entre le HTML serveur et le premier rendu client. La bascule vers la
  // scène 3D n'arrive qu'après montage, une fois le support WebGL
  // effectivement vérifié : même prudence que celle déjà appliquée sur
  // `prefers-reduced-motion` ailleurs sur le site, où faire dépendre la
  // présence d'un nœud DOM d'une valeur résolue différemment entre
  // serveur et client a déjà causé un vrai bug d'hydratation.
  const [canRender3D, setCanRender3D] = useState(false);

  useEffect(() => {
    setCanRender3D(!prefersReducedMotion && supportsWebGL());
  }, [prefersReducedMotion]);

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
        </div>

        <div className="relative aspect-[4/3] w-full overflow-hidden rounded-[32px] lg:aspect-[5/4]">
          {canRender3D ? (
            <HouseScene />
          ) : (
            <div
              aria-hidden
              className="absolute inset-0"
              style={{
                background:
                  "linear-gradient(155deg, #f7f3ea 0%, #efe9db 55%, #e9e1d0 100%)",
              }}
            />
          )}
        </div>
      </div>
    </section>
  );
}
