"use client";

import { useState } from "react";
import Link from "next/link";
import GlassPanel from "./GlassPanel";

const LINKS = [
  { href: "/#concept", label: "Concept" },
  { href: "/#gammes", label: "Gammes" },
  { href: "/modeles", label: "Modèles" },
  { href: "/#procede", label: "Procédé" },
];

export default function Nav() {
  const [open, setOpen] = useState(false);

  return (
    <header className="fixed inset-x-0 top-4 z-50 px-4">
      <GlassPanel
        as="nav"
        sheen
        rounded="rounded-full"
        className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3 sm:px-7"
      >
        <Link href="/" className="flex flex-col leading-none">
          <span className="text-lg tracking-[0.04em] text-encre">
            <span className="font-semibold">BELL</span>
            <span className="font-normal">ORA</span>
          </span>
          <span className="mt-1 h-px w-full bg-laiton" />
        </Link>

        <ul className="hidden items-center gap-8 md:flex">
          {LINKS.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className="text-base font-medium text-encre-doux transition-colors hover:text-foret"
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>

        <Link
          href="/contact"
          className="hidden rounded-full bg-foret px-5 py-2.5 text-base font-medium text-brume transition-opacity hover:opacity-90 md:inline-block"
        >
          Demander un devis
        </Link>

        <button
          type="button"
          aria-label={open ? "Fermer le menu" : "Ouvrir le menu"}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          className="flex h-9 w-9 flex-col items-center justify-center gap-1.5 md:hidden"
        >
          <span
            className={`h-px w-5 bg-encre transition-transform ${
              open ? "translate-y-[3px] rotate-45" : ""
            }`}
          />
          <span
            className={`h-px w-5 bg-encre transition-transform ${
              open ? "-translate-y-[3px] -rotate-45" : ""
            }`}
          />
        </button>
      </GlassPanel>

      {open && (
        <GlassPanel
          rounded="rounded-3xl"
          className="mx-auto mt-2 flex max-w-6xl flex-col gap-1 px-5 py-4 md:hidden"
        >
          {LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className="py-2 text-base font-medium text-encre-doux hover:text-foret"
            >
              {link.label}
            </Link>
          ))}
          <Link
            href="/contact"
            onClick={() => setOpen(false)}
            className="mt-2 rounded-full bg-foret px-5 py-2.5 text-center text-base font-medium text-brume"
          >
            Demander un devis
          </Link>
        </GlassPanel>
      )}
    </header>
  );
}
