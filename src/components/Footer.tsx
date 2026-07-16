import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-encre/10 bg-brume-2 px-6 py-16">
      <div className="mx-auto grid max-w-6xl gap-12 md:grid-cols-4">
        <div>
          <span className="text-lg tracking-[0.04em] text-encre">
            <span className="font-semibold">BELL</span>
            <span className="font-normal">ORA</span>
          </span>
          <span className="mt-1 block h-px w-16 bg-laiton" />
          <p className="mt-4 max-w-xs text-sm text-encre-douce">
            Maisons en bois sur mesure. 100% fabriquées en France.
          </p>
        </div>

        <div>
          <p className="eyebrow mb-4 text-xs text-encre-douce">Gammes</p>
          <ul className="space-y-2 text-sm text-encre-doux">
            <li><Link href="/gamme-primaire" className="hover:text-foret">Primaire</Link></li>
            <li><Link href="/gamme-premium" className="hover:text-foret">Premium</Link></li>
            <li><Link href="/gamme-prestige" className="hover:text-foret">Prestige</Link></li>
          </ul>
        </div>

        <div>
          <p className="eyebrow mb-4 text-xs text-encre-douce">Bellora</p>
          <ul className="space-y-2 text-sm text-encre-doux">
            <li><Link href="/modeles" className="hover:text-foret">Modèles</Link></li>
            <li><Link href="/atelier" className="hover:text-foret">Notre atelier</Link></li>
            <li><Link href="/contact" className="hover:text-foret">Contact</Link></li>
            <li><Link href="/mentions-legales" className="hover:text-foret">Mentions légales</Link></li>
          </ul>
        </div>

        <div>
          <p className="eyebrow mb-4 text-xs text-encre-douce">Contact</p>
          <ul className="space-y-2 text-sm text-encre-doux">
            <li>[Téléphone à renseigner]</li>
            <li>[Adresse de l&apos;atelier à renseigner]</li>
            <li>contact@bellora-homes.com</li>
          </ul>
        </div>
      </div>

      <p className="mx-auto mt-12 max-w-6xl text-xs text-encre-douce">
        © {new Date().getFullYear()} Bellora Homes — [Raison sociale et SIRET à
        renseigner]. Tous droits réservés.
      </p>
    </footer>
  );
}
