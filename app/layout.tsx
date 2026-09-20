import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { site } from "@/lib/site";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

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
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "Mattia Ciuni | Founder & CEO @ Payle" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Mattia Ciuni | Founder & CEO @ Payle",
    description: site.description,
    images: ["/og.png"],
  },
};

export const viewport: Viewport = {
  themeColor: "#FCFCFC",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang={site.language} className={inter.variable}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font -- App Router: link Google Fonts globale */}
        <link
          href="https://fonts.googleapis.com/css2?family=Source+Serif+4:ital,opsz,wght@0,8..60,200..900;1,8..60,200..900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-gray-background font-sans text-base leading-relaxed text-gray-1200">
        <a
          href="#content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:bg-gray-1200 focus:text-white focus:px-3 focus:py-1"
        >
          Skip to content
        </a>
        {children}
      </body>
    </html>
  );
}