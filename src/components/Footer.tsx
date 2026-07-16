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
            Une qualité aussi noble que notre engagement.
          </p>
        </div>

        <div>
          <p className="eyebrow mb-4 text-xs text-encre-douce">Bellora</p>
          <ul className="space-y-2 text-sm text-encre-doux">
            <li><Link href="/#concept" className="hover:text-foret">Concept</Link></li>
            <li><Link href="/#gammes" className="hover:text-foret">Gammes</Link></li>
            <li><Link href="/modeles" className="hover:text-foret">Modèles</Link></li>
            <li><Link href="/#procede" className="hover:text-foret">Procédé</Link></li>
            <li><Link href="/atelier" className="hover:text-foret">Notre atelier</Link></li>
          </ul>
        </div>

        <div>
          <p className="eyebrow mb-4 text-xs text-encre-douce">Légal</p>
          <ul className="space-y-2 text-sm text-encre-doux">
            <li><Link href="/mentions-legales" className="hover:text-foret">Mentions légales</Link></li>
            <li><Link href="/cgv" className="hover:text-foret">CGV</Link></li>
            <li><Link href="/confidentialite" className="hover:text-foret">Confidentialité</Link></li>
          </ul>
        </div>

        <div>
          <p className="eyebrow mb-4 text-xs text-encre-douce">Contact</p>
          <ul className="space-y-2 text-sm text-encre-doux">
            <li>[Téléphone à renseigner]</li>
            <li>[Adresse de l&apos;atelier à renseigner]</li>
            <li>
              <a href="mailto:contact@bellora-homes.com" className="hover:text-foret">
                contact@bellora-homes.com
              </a>
            </li>
            <li><Link href="/contact" className="hover:text-foret">Demander un devis →</Link></li>
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
