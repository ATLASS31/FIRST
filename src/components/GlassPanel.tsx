import { createElement } from "react";
import type { ElementType, ComponentPropsWithoutRef, ReactNode } from "react";

type GlassPanelProps<T extends ElementType> = {
  as?: T;
  tone?: "light" | "dark" | "graphite";
  sheen?: boolean;
  rounded?: string;
  children: ReactNode;
  className?: string;
} & Omit<ComponentPropsWithoutRef<T>, "as" | "children" | "className">;

/**
 * Panneau Liquid Glass réutilisable : nav, boutons, petites cartes.
 * Jamais utilisé comme élément principal du hero (cf. brief §4).
 */
export default function GlassPanel<T extends ElementType = "div">({
  as,
  tone = "light",
  sheen = false,
  rounded = "rounded-2xl",
  children,
  className = "",
  ...rest
}: GlassPanelProps<T>) {
  const Component = as || "div";
  const toneClass =
    tone === "dark" ? "glass-dark" : tone === "graphite" ? "glass-graphite" : "glass";

  // `createElement` plutôt que la syntaxe JSX : avec un composant
  // polymorphe générique (`as`), JSX exige que `rest` corresponde
  // exactement aux props de `T` — impossible à prouver statiquement
  // puisque `T` n'est résolu qu'à l'appel. `createElement` accepte cette
  // incertitude sans forcer un `as any` sur les props elles-mêmes.
  return createElement(
    Component as ElementType,
    {
      className: `relative overflow-hidden ${rounded} ${toneClass} ${
        sheen ? "glass-sheen" : ""
      } ${className}`,
      ...rest,
    },
    children
  );
}
