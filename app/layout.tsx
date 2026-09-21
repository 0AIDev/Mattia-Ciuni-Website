import type { Metadata, Viewport } from "next";
import { Inter, Source_Serif_4 } from "next/font/google";
import "./globals.css";
import { site } from "@/lib/site";
import { socialImages } from "@/lib/social";
import { NewsletterSection } from "@/components/NewsletterSection";
import { SiteFooter } from "@/components/SiteFooter";
import { LenisProvider } from "@/components/lenis-provider";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

// I due serif del sito, self-hosted come Inter.
//
// Prima arrivavano da `fonts.googleapis.com` con un `<link rel="stylesheet">`
// nella `<head>`: una richiesta **che blocca il rendering** verso un dominio
// terzo (~200 ms di attesa prima ancora di disegnare il testo) più due
// `preconnect` e ~249 KiB di woff2 da `fonts.gstatic.com`. Self-hostati sono
// serviti dallo stesso host della pagina: nessun DNS, nessuna connessione nuova,
// niente da precollegare. `opsz` è l'asse ottico che il CDN usava, quindi la
// resa non cambia.
const sourceSerif = Source_Serif_4({
  subsets: ["latin"],
  style: ["normal", "italic"],
  axes: ["opsz"],
  variable: "--font-source-serif",
  display: "swap",
});

// La card della home, dichiarata una volta e usata da Open Graph e Twitter.
const homeCard = socialImages("/og.png", "Mattia Ciuni | Founder & CEO @ Payle");

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: "Mattia Ciuni | Founder & CEO @ Payle",
    template: "%s · Mattia Ciuni",
  },
  description: site.description,
  keywords: [
    "Mattia Ciuni",
    "Payle",
    "AI agents payments",
    "fintech founder",
    "agentic commerce",
    "AI spending",
    "Italian founder",
  ],
  authors: [{ name: "Mattia Ciuni", url: site.url }],
  creator: "Mattia Ciuni",
  publisher: "Mattia Ciuni",
  alternates: { canonical: "/" },
  robots: { index: true, follow: true },
  openGraph: {
    type: "website",
    url: "/",
    siteName: "Mattia Ciuni",
    title: "Mattia Ciuni | Founder & CEO @ Payle",
    description: site.description,
    locale: site.locale,
    images: homeCard.og,
  },
  twitter: {
    card: "summary_large_image",
    title: "Mattia Ciuni | Founder & CEO @ Payle",
    description: site.description,
    images: homeCard.twitter,
  },
};

export const viewport: Viewport = {
  themeColor: "#FCFCFC",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang={site.language} className={`${inter.variable} ${sourceSerif.variable}`}>
      <body className="bg-gray-background font-sans text-base leading-relaxed text-gray-1200">
        <a
          href="#content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:bg-gray-1200 focus:text-white focus:px-3 focus:py-1"
        >
          Skip to content
        </a>
        <LenisProvider>
          {children}
          <NewsletterSection />
          <SiteFooter />
        </LenisProvider>
      </body>
    </html>
  );
}