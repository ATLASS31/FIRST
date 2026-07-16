import type { ElementType, ComponentPropsWithoutRef, ReactNode } from "react";

type GlassPanelProps<T extends ElementType> = {
  as?: T;
  tone?: "light" | "dark";
  sheen?: boolean;
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
  children,
  className = "",
  ...rest
}: GlassPanelProps<T>) {
  const Component = as || "div";
  const toneClass = tone === "dark" ? "glass-dark" : "glass";

  return (
    <Component
      className={`relative overflow-hidden rounded-2xl ${toneClass} ${
        sheen ? "glass-sheen" : ""
      } ${className}`}
      {...rest}
    >
      {children}
    </Component>
  );
}
