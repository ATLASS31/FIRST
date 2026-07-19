"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { useReducedMotion } from "framer-motion";

/**
 * Sixième reprise sur cette section. Après le squelette technique minimal
 * (coquille architecturale vide, jugée par le client comme une "boîte
 * vide" qui ne racontait rien), un comparatif de quatre directions
 * artistiques a été présenté avant d'écrire la moindre ligne de code
 * supplémentaire. Direction retenue : la fusion de deux concepts
 * ("L'écrin" + "L'assemblage suspendu") en un récit en cinq temps —
 * Objet → Mystère → Ouverture → Révélation → Maison — avec une exigence
 * explicite de retenue façon Apple : très peu d'éléments, beaucoup
 * d'espace vide, des matériaux irréprochables, une lumière exceptionnelle,
 * des mouvements extrêmement lents. Consigne du client : consacrer
 * plusieurs itérations à la seule composition/matière/lumière avant
 * d'ajouter la moindre complexité de mouvement ou de narration.
 *
 * **Où en est ce fichier aujourd'hui — itération 1 seulement.** Cette
 * itération construit uniquement le tout premier temps, "Objet" : un
 * volume unique au repos (`MonolithScene`, voir
 * `notre-histoire/MonolithScene.tsx`), sans couture visible, sans
 * ouverture, sans lien au scroll. L'ancienne coquille architecturale
 * (`HouseScene.tsx`) est supprimée dans son intégralité, aucune ligne
 * réutilisée — elle appartenait à une direction que le client a rejetée.
 * Le texte à gauche et la mise en page en deux colonnes restent un
 * placeholder temporaire hérité des versions précédentes, pas encore
 * retouché : la priorité de cette itération est uniquement l'objet
 * lui-même.
 *
 * **Contenu verrouillé pour les temps à venir — ne pas oublier au moment
 * d'écrire la narration.** Les trois preuves fortes de l'ancien
 * `KeyFigures` (20 ans de garantie, 4–12 semaines de livraison, 100 %
 * fabriqué en France) ne doivent pas réapparaître comme un bloc de
 * statistiques alignées : le client veut qu'elles soient *découvertes*,
 * révélées chacune au moment où elle prend du sens dans le récit —
 * **20 ans** pendant "Mystère"/l'ouverture, quand la matière et la
 * durabilité se ressentent (le grain du bois, le vernis) ; **4–12
 * semaines** pendant "Ouverture", au moment où le module s'assemble ou où
 * la transformation s'accélère ; **100 % fabriqué en France** en toute
 * fin, pendant "Maison", comme une signature discrète gravée dans le bois
 * ou intégrée à l'objet plutôt qu'affichée. Racontées, pas énumérées.
 *

 * Trois décisions techniques, inchangées depuis le socle initial :
 * 1. **Import dynamique sans SSR.** `next/dynamic(..., { ssr: false })` :
 *    Three.js a besoin d'un vrai contexte WebGL, qui n'existe pas côté
 *    serveur. L'import dynamique reporte le chargement entièrement au
 *    client, avec un état de chargement pendant ce temps.
 * 2. **Isolation du poids.** `MonolithScene.tsx` est le seul fichier du
 *    projet à importer `three`/`@react-three/fiber` ; grâce au découpage
 *    de code automatique de Next.js sur les imports dynamiques, ce poids
 *    ne charge que sur cette page, jamais sur le reste du site.
 * 3. **Repli en cascade.** Avant même de tenter de charger la scène : si
 *    `prefers-reduced-motion` est actif OU si le navigateur ne peut pas
 *    fournir de contexte WebGL (`getContext("webgl")` renvoie `null` —
 *    testé une fois au montage, pas à chaque rendu), un panneau statique
 *    neutre s'affiche à la place, désormais accordé au nouveau parti pris
 *    sombre plutôt qu'à l'ancien fond clair de la coquille architecturale.
 */
const MonolithScene = dynamic(() => import("./notre-histoire/MonolithScene"), {
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
  // `false` par défaut côté serveur et au tout premier rendu client, avant
  // hydratation — le repli statique est donc ce qui s'affiche par défaut
  // des deux côtés, sans écart possible entre le HTML serveur et le
  // premier rendu client. La bascule vers la scène 3D n'arrive qu'après
  // montage, une fois le support WebGL effectivement vérifié : même
  // prudence que celle déjà appliquée sur `prefers-reduced-motion`
  // ailleurs sur le site, où faire dépendre la présence d'un nœud DOM
  // d'une valeur résolue différemment entre serveur et client a déjà
  // causé un vrai bug d'hydratation.
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
            <MonolithScene />
          ) : (
            <div
              aria-hidden
              className="absolute inset-0"
              style={{
                background:
                  "radial-gradient(ellipse 70% 60% at 50% 42%, #241d15 0%, #0d0a08 72%)",
              }}
            />
          )}
        </div>
      </div>
    </section>
  );
}
