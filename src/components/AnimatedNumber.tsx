"use client";

import { AnimatePresence, motion } from "framer-motion";

export default function AnimatedNumber({
  value,
  className = "",
}: {
  value: string;
  className?: string;
}) {
  return (
    <span className={`relative inline-grid overflow-hidden ${className}`}>
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={value}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.28, ease: "easeOut" }}
          className="col-start-1 row-start-1"
        >
          {value}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}
