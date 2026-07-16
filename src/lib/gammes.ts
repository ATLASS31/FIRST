export type GammeSlug = "primaire" | "premium" | "prestige";

export type Configuration = {
  surface: 40 | 60 | 80 | 100;
  title: string;
  body: string;
  price?: string;
};

export type Gamme = {
  slug: GammeSlug;
  href: string;
  name: string;
  cardTagline: string;
  heroTagline: string;
  heroBody: string;
  fromPrice: string;
  accent: string;
  imageUrl: string;
  pourquoi: { lead: string; paragraphs: string[] };
  inclus: string[];
  configurations: Configuration[];
  temoignage: { quote: string; author: string };
};

export const GAMMES: Gamme[] = [
  {
    slug: "primaire",
    href: "/gamme-primaire",
    name: "Primaire",
    cardTagline: "L'essentiel, à la main.",
    heroTagline: "L'essentiel, à la main.",
    heroBody:
      "Module habitable, isolation RE2020, équipement de base. Ossature bois Douglas, finitions soignées, prêt à vivre.",
    fromPrice: "À partir de 76 134 € TTC",
    accent: "foret",
    imageUrl:
      "https://d8j0ntlcm91z4.cloudfront.net/user_3AOufDgdu5BZqUoyRdkQOitlUqQ/hf_20260716_165425_628ec5b8-4a0f-4477-b6b1-48a539871a8a.png",
    pourquoi: {
      lead: "L'essentiel, en confiance.",
      paragraphs: [
        "La gamme Primaire répond à un principe simple : un bâti irréprochable, des finitions sobres, un prix juste. Pas de surcouches décoratives, pas d'artifices. Ce que vous payez sert la solidité, l'isolation et la durabilité de votre maison.",
        "Le châssis acier soudé, l'ossature bois Douglas certifiée, l'isolation conforme RE2020 sont identiques à nos gammes supérieures. La différence se joue sur les finitions, les équipements et les matériaux nobles — pas sur la structure. Vous bénéficiez de la même solidité.",
        "Pensée pour être posée vite et bien, elle se livre clé en main en 4 à 8 semaines selon la surface. Tous les corps de métier — plomberie, électricité, menuiseries, climatisation — sont intégrés à la fabrication. Vous tournez la clé, tout fonctionne.",
      ],
    },
    inclus: [
      "Ossature bois Douglas certifiée",
      "Isolation conforme RE2020",
      "Cuisine équipée de base",
      "Salle de bain complète",
      "Menuiseries aluminium double vitrage",
      "Plomberie et électricité aux normes",
      "Climatisation réversible",
      "Garantie 20 ans",
    ],
    configurations: [
      {
        surface: 40,
        title: "Volume traversant",
        body: "Espace de vie, coin nuit séparé, salle d'eau complète.",
        price: "Sur devis",
      },
      {
        surface: 60,
        title: "Séjour, cuisine, chambres",
        body: "1 à 2 chambres, salle d'eau. Volumes ouverts, lumière franche.",
        price: "Sur devis",
      },
    ],
    temoignage: {
      quote:
        "Je voulais un studio pour le fond du jardin, sans prétention, mais bien fait. Bellora a livré exactement ça.",
      author: "Sylvain, Pyrénées-Atlantiques",
    },
  },
  {
    slug: "premium",
    href: "/gamme-premium",
    name: "Premium",
    cardTagline: "Le confort durable.",
    heroTagline: "Le confort durable.",
    heroBody:
      "Finitions soignées, équipement complet, sur-mesure léger. Matériaux durables, agencement réfléchi, confort maîtrisé.",
    fromPrice: "À partir de 80 888 € TTC",
    accent: "encre-doux",
    imageUrl:
      "https://d8j0ntlcm91z4.cloudfront.net/user_3AOufDgdu5BZqUoyRdkQOitlUqQ/hf_20260716_165434_7dd44834-9e43-4660-b77e-e90e61d5275a.png",
    pourquoi: {
      lead: "Le confort, sans concession.",
      paragraphs: [
        "La gamme Premium ouvre le confort durable à ceux qui en font une exigence quotidienne. Mêmes fondamentaux structurels que Primaire, mais une autre attention portée aux matériaux, aux équipements et au sur-mesure léger qui transforme un bel objet en vraie maison.",
        "Cuisine équipée premium, salle de bain design, mobilier intégré, menuiseries triple vitrage, plancher chauffant : la gamme Premium est livrée prête à vivre. Vous emménagez, et chaque élément a été pensé pour fonctionner ensemble.",
        "Choix des essences de bois, palette de teintes, ajustement des volumes intérieurs, options d'équipement. Sans entrer dans le sur-mesure complet du Prestige, Premium laisse votre projet exister sans le standardiser.",
      ],
    },
    inclus: [
      "Ossature bois Douglas FSC",
      "Isolation RE2020 renforcée",
      "Cuisine équipée premium",
      "Salle de bain design",
      "Menuiseries aluminium triple vitrage",
      "Mobilier sur-mesure inclus",
      "Climatisation et plancher chauffant",
      "Garantie 20 ans",
    ],
    configurations: [
      {
        surface: 40,
        title: "Volume confortable",
        body: "Coin nuit séparé, cuisine premium, salle d'eau design.",
        price: "Sur devis",
      },
      {
        surface: 60,
        title: "Séjour ouvert",
        body: "1 à 2 chambres, salle d'eau design, équipement complet.",
        price: "Sur devis",
      },
      {
        surface: 80,
        title: "Double séjour",
        body: "2 à 3 chambres, cuisine premium, finitions soignées.",
        price: "Sur devis",
      },
    ],
    temoignage: {
      quote:
        "Le Premium nous a permis d'avoir une vraie maison de vacances. Les enfants adorent.",
      author: "Camille et Thomas, Vendée",
    },
  },
  {
    slug: "prestige",
    href: "/gamme-prestige",
    name: "Prestige",
    cardTagline: "L'art de la maison.",
    heroTagline: "L'art de la maison.",
    heroBody:
      "Matériaux nobles, finitions haut de gamme, sur-mesure complet. Bois massif, pierre naturelle, géométrie patiente.",
    fromPrice: "À partir de 88 763 € TTC",
    accent: "laiton",
    imageUrl:
      "https://d8j0ntlcm91z4.cloudfront.net/user_3AOufDgdu5BZqUoyRdkQOitlUqQ/hf_20260716_165443_0c82f2ed-5645-49fd-86ea-af77e9645b87.png",
    pourquoi: {
      lead: "L'exception, à votre mesure.",
      paragraphs: [
        "La gamme Prestige est l'engagement Bellora poussé à son terme. Matériaux nobles, finitions exigeantes, sur-mesure complet. Une maison de vie, pas un module de plus.",
        "Chêne massif, parquet bois plein, salles de bain en pierre naturelle, ferronnerie sur-mesure, domotique intégrée. Chaque choix est étudié, chaque détail négocié avec votre architecte intérieur. Vous concevez votre maison Prestige comme on dessine un meuble unique.",
        "Disponible à partir du 40 m² — la gamme prend son temps pour un résultat au-dessus de la moyenne. À l'arrivée, vous tournez la clé d'une maison que personne d'autre ne possédera.",
      ],
    },
    inclus: [
      "Ossature Douglas et chêne massif",
      "Isolation très haute performance",
      "Cuisine sur-mesure haut de gamme",
      "Salles de bain en pierre naturelle",
      "Parquet bois massif",
      "Menuiseries bois-alu triple vitrage",
      "Domotique intégrée",
      "Garantie 20 ans, suivi décennal",
    ],
    configurations: [
      {
        surface: 40,
        title: "Volume d'entrée Prestige",
        body: "Suite parentale, séjour ouvert, finitions nobles.",
        price: "À partir de 88 763 € TTC",
      },
      {
        surface: 60,
        title: "Volume d'exception compact",
        body: "Suite parentale, séjour ouvert, terrasse intégrée.",
        price: "Sur devis",
      },
      {
        surface: 80,
        title: "Double séjour",
        body: "2 chambres, finitions nobles. Bois massif, pierre naturelle.",
        price: "Sur devis",
      },
      {
        surface: 100,
        title: "Suite parentale, salon ample",
        body: "Cuisine sur-mesure, domotique intégrée.",
        price: "Sur devis",
      },
    ],
    temoignage: {
      quote: "C'est notre maison. Pas un produit, pas une copie. Une vraie maison Bellora.",
      author: "Famille Bellora",
    },
  },
];

export function getGamme(slug: GammeSlug): Gamme {
  const gamme = GAMMES.find((g) => g.slug === slug);
  if (!gamme) throw new Error(`Gamme inconnue: ${slug}`);
  return gamme;
}
