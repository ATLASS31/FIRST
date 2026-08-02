import type { Metadata } from "next";
import { Inter } from "next/font/google";
import GlassFilter from "@/components/GlassFilter";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "Bellora Homes — Maisons en bois sur mesure",
  description:
    "Constructeur de maisons modulaires en bois premium. Trois gammes, Primaire, Premium, Prestige. 100% fabriquées en France, 20 ans de garantie.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className={`${inter.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col bg-brume text-encre">
        <GlassFilter />
        <Nav />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
