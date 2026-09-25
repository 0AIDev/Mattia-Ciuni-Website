"use client";

import Script from "next/script";
import { usePathname } from "next/navigation";

/**
 * Microsoft Clarity: registrazioni di sessione e heatmap, sempre attivo.
 *
 * A differenza di GA, qui niente gate di consenso: la scelta di Mattia e' di
 * misurare come le pagine vengono usate (scroll, click, rage click) con
 * Microsoft Clarity, che maschera ogni contenuto digitato e ogni input e non
 * raccoglie dati per pubblicita'. Paga pero' in cookie (_clck, _clsk): per
 * questo privacy e cookies lo dichiarano per nome, e la pagina /cookies elenca
 * i due cookie con durata e scopo. Se un giorno la scelta cambia, la policy va
 * aggiornata prima che il componente si carichi.
 *
 * L'ID e' pubblico per progetto: si vede nell'HTML di chiunque apra il sito, e
 * non e' una credenziale.
 *
 * `strategy="lazyOnload"` come Umami: la registrazione non deve costare niente
 * al primo disegno della pagina. La dashboard privata e' esclusa come per gli
 * altri strumenti: dentro `/admin` non si misura niente.
 */
export function ClarityAnalytics() {
  const pathname = usePathname();
  if (pathname?.startsWith("/admin")) return null;

  return (
    <Script id="ms-clarity" strategy="lazyOnload">
      {`(function(c,l,a,r,i,t,y){
        c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
        t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i+"?ref=bwt";
        y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
    })(window, document, "clarity", "script", "ynplaa0k8y");`}
    </Script>
  );
}
