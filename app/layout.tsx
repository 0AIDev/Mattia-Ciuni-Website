import type { Metadata, Viewport } from "next";
import { Instrument_Serif, Inter } from "next/font/google";
import "./globals.css";
import { site } from "@/lib/site";
import { socialImages } from "@/lib/social";
import Script from "next/script";
import { DeferredNewsletter } from "@/components/DeferredNewsletter";
import { DeferredAnalytics } from "@/components/DeferredAnalytics";
import { UmamiAnalytics } from "@/components/UmamiAnalytics";
import { SiteFooter } from "@/components/SiteFooter";
import { LanguageSuggestion } from "@/components/LanguageSuggestion";
import { isLocale } from "@/lib/i18n";
// Ask Mattia Ciuni AI is intentionally disabled for now. Keep the component
// import commented so it can be re-enabled without rebuilding the feature.
// import { DeferredSiteRagChat } from "@/components/DeferredSiteRagChat";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

// Il serif del sito, self-hosted come Inter.
//
// Prima arrivavano da `fonts.googleapis.com` con un `<link rel="stylesheet">`
// nella `<head>`: una richiesta **che blocca il rendering** verso un dominio
// terzo (~200 ms di attesa prima ancora di disegnare il testo) più due
// `preconnect` e ~249 KiB di woff2 da `fonts.gstatic.com`. Self-hostati sono
// serviti dallo stesso host della pagina: nessun DNS, nessuna connessione nuova,
// niente da precollegare. Instrument Serif è il serif editoriale unico del sito,
// compreso il corsivo sintetico usato dalle emphasis inline.
const instrumentSerif = Instrument_Serif({
  weight: "400",
  subsets: ["latin"],
  display: "swap",
  // The above-the-fold copy uses Inter. Let the serif load on demand so mobile
  // does not block the first paint on a second large font request.
  preload: false,
});

// La card della home, dichiarata una volta e usata da Open Graph e Twitter.
const homeCard = socialImages("/og.png", "Mattia Ciuni | Founder & CEO at Payle");

// WebMCP è una capability opzionale del browser. Lo script è deferred e
// statico, così gli agenti trovano strumenti reali senza bloccare l'LCP.

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: "Mattia Ciuni | Founder & CEO at Payle",
    // Un solo divisore, sempre il trattino: mai puntini o punti di sospensione.
    template: "%s | Mattia Ciuni",
  },
  description: site.description,
  applicationName: site.name,
  keywords: [
    "Mattia Ciuni",
    "who is Mattia Ciuni",
    "what does Mattia Ciuni do",
    "Mattia Ciuni Payle",
    "CEO of Payle",
    "Payle founder",
    "Payle CEO",
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
  verification: {
    google: "2Yp93wGXnpI1i5vhC09zwHdmGr1vY6rFCZIXptWOITI",
    other: {
      "p:domain_verify": "3d076b32843d0a076953fbb547fc68fc",
    },
  },
  alternates: { canonical: "/" },
  robots: { index: true, follow: true },
  openGraph: {
    type: "website",
    url: "/",
    siteName: "Mattia Ciuni",
    title: "Mattia Ciuni | Founder & CEO at Payle",
    description: site.description,
    locale: site.locale,
    images: homeCard.og,
  },
  twitter: {
    card: "summary_large_image",
    creator: "@mattiaciuni",
    title: "Mattia Ciuni | Founder & CEO at Payle",
    description: site.description,
    images: homeCard.twitter,
  },
};

export const viewport: Viewport = {
  themeColor: "#FFFFFF",
  viewportFit: "cover",
  // On mobile, opening the keyboard must resize the content viewport instead
  // of leaving fixed dialogs behind the keyboard.
  interactiveWidget: "resizes-content",
};

export default async function RootLayout({ children, params }: { children: React.ReactNode; params: Promise<{ locale?: string }> }) {
  const routeParams = await params;
  const language = routeParams.locale && isLocale(routeParams.locale) ? routeParams.locale : site.language;
  return (
    <html lang={language} className={`${inter.variable} ${instrumentSerif.className}`}>
      <head>
        <link rel="ai-catalog" href="/.well-known/ai-catalog.json" />
      </head>
      <body className="bg-gray-background font-sans text-base leading-relaxed text-gray-1200">
        <Script id="webmcp-tools" src="/webmcp.js" strategy="afterInteractive" />
        <DeferredAnalytics />
        {/* Umami non è dietro il consenso: non conserva niente sul dispositivo. */}
        <UmamiAnalytics />
        <a
          href="#content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:bg-gray-1200 focus:text-white focus:px-3 focus:py-1"
        >
          Skip to content
        </a>
        {children}
        <div id="newsletter-slot">
          <DeferredNewsletter />
        </div>
        <SiteFooter />
        <LanguageSuggestion />
        {/* Ask Mattia Ciuni AI is temporarily disabled site-wide. */}
        {/* <DeferredSiteRagChat /> */}
      </body>
    </html>
  );
}