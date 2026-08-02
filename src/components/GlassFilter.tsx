/**
 * Filtre SVG partagé pour l'effet Liquid Glass (réfraction feTurbulence + feDisplacementMap).
 * Rendu une seule fois dans le layout racine ; les panneaux glass y référencent
 * `url(#glass-distortion)` dans leur backdrop-filter.
 */
export default function GlassFilter() {
  return (
    <svg
      aria-hidden
      style={{ position: "absolute", width: 0, height: 0, overflow: "hidden" }}
    >
      <filter
        id="glass-distortion"
        x="-20%"
        y="-20%"
        width="140%"
        height="140%"
      >
        <feTurbulence
          type="fractalNoise"
          baseFrequency="0.010 0.014"
          numOctaves={2}
          seed={9}
          result="noise"
        />
        <feGaussianBlur in="noise" stdDeviation={3} result="blurredNoise" />
        <feDisplacementMap
          in="SourceGraphic"
          in2="blurredNoise"
          scale={24}
          xChannelSelector="R"
          yChannelSelector="G"
        />
      </filter>
    </svg>
  );
}
