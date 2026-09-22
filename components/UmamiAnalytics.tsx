"use client";

import Script from "next/script";
import { usePathname } from "next/navigation";

/**
 * Umami: il contatore che non chiede permesso.
 *
 * Google Analytics ha bisogno del consenso perché conserva un identificatore nel
 * browser di chi visita il sito. Umami no: non scrive cookie, non salva niente sul
 * dispositivo, non profila e non incrocia la visita con altri siti. Non c'è niente
 * da accettare e niente da rifiutare, quindi lo script è sempre in pagina, mentre
 * Analytics resta dietro il banner (`components/GoogleAnalytics.tsx`).
 *
 * L'ID è pubblico per progetto, come il Measurement ID di GA4: si vede nell'HTML
 * di chiunque apra il sito, e non è una credenziale.
 *
 * `strategy="afterInteractive"` e non `<script>` in testa: il conteggio non deve
 * costare niente al primo disegno della pagina. Il tracker registra le pageview da
 * sé, comprese le navigazioni client-side di Next, quindi qui non c'è nessuna
 * chiamata a `track()`: gli eventi del sito si diramano da `lib/analytics.ts`.
 *
 * La dashboard privata è esclusa come per Analytics: dentro `/admin` non si
 * misura niente, né per sé né per terzi.
 */
export function UmamiAnalytics() {
  const pathname = usePathname();
  if (pathname?.startsWith("/admin")) return null;

  return (
    <>
      <Script
        id="umami-analytics"
        src="https://cloud.umami.is/script.js"
        data-website-id="3a1dbd1d-11af-4437-a649-e82f55944f53"
        strategy="afterInteractive"
      />
      {/* Umami pixel: fallback leggero per i client che non eseguono JavaScript. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="https://cloud.umami.is/p/0nHh9TNrR"
        alt=""
        width="1"
        height="1"
        aria-hidden="true"
        className="pointer-events-none absolute h-px w-px opacity-0"
      />
    </>
  );
}
