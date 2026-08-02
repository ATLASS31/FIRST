"use client";

import { useCallback, useRef, useState } from "react";
import { motion } from "framer-motion";

export default function PremiumSlider({
  min,
  max,
  step,
  value,
  onChange,
  label,
  showTicks = false,
}: {
  min: number;
  max: number;
  step: number;
  value: number;
  onChange: (value: number) => void;
  label: string;
  /** Repères visuels sur le rail : un trait à chaque `step`, plus haut et
   *  chiffré tous les 2 crans. Sans ça, le seul indice qu'un pas de 5 (par
   *  exemple) est possible est de le trouver au clavier ou par hasard à la
   *  souris — retour client sur le calculateur : perçu comme un pas de 10
   *  ("il y a pas de 5") alors que le code permettait déjà 25/35/45... */
  showTicks?: boolean;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState(false);
  const percent = ((value - min) / (max - min)) * 100;

  const ticks: number[] = [];
  if (showTicks) {
    for (let t = min; t <= max; t += step) ticks.push(t);
  }

  const valueFromClientX = useCallback(
    (clientX: number) => {
      const rect = trackRef.current?.getBoundingClientRect();
      if (!rect) return value;
      const ratio = Math.min(Math.max((clientX - rect.left) / rect.width, 0), 1);
      const raw = min + ratio * (max - min);
      return Math.round(raw / step) * step;
    },
    [min, max, step, value]
  );

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    setDragging(true);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    onChange(valueFromClientX(e.clientX));
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragging) return;
    onChange(valueFromClientX(e.clientX));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowRight" || e.key === "ArrowUp") {
      onChange(Math.min(max, value + step));
    } else if (e.key === "ArrowLeft" || e.key === "ArrowDown") {
      onChange(Math.max(min, value - step));
    }
  };

  return (
    <div
      ref={trackRef}
      role="slider"
      tabIndex={0}
      aria-label={label}
      aria-valuemin={min}
      aria-valuemax={max}
      aria-valuenow={value}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={() => setDragging(false)}
      onKeyDown={handleKeyDown}
      className="relative flex h-8 cursor-pointer items-center outline-none"
    >
      <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-brume/15">
        {showTicks &&
          ticks.slice(1, -1).map((t) => (
            <span
              key={t}
              aria-hidden
              className="absolute top-0 h-full w-px bg-encre/25"
              style={{ left: `${((t - min) / (max - min)) * 100}%` }}
            />
          ))}
        <div
          className="h-full rounded-full bg-gradient-to-r from-laiton/70 to-laiton"
          style={{ width: `${percent}%` }}
        />
      </div>

      <motion.div
        className="absolute top-1/2 h-5 w-5 -translate-y-1/2 rounded-full border border-brume/60 bg-gradient-to-br from-[#f4e9d8] to-laiton shadow-[0_2px_10px_rgba(0,0,0,0.4)]"
        style={{ left: `calc(${percent}% - 10px)` }}
        animate={{ scale: dragging ? 1.25 : 1 }}
        transition={{ type: "spring", stiffness: 400, damping: 22 }}
      />
    </div>
  );
}
