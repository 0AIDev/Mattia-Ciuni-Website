import type { Metadata } from "next";

/**
 * L'immagine social di una pagina, dichiarata **per intero** in ogni posto che la
 * legge.
 *
 * Non è pignoleria: Discord, X, Slack, LinkedIn e i motori leggono la stessa
 * immagine ma non le stesse righe. Senza `width`/`height` alcuni non disegnano la
 * card grande anche con `summary_large_image`; senza `type` qualcuno prova a
 * indovinare il formato dall'indirizzo; senza `alt` la card resta senza
 * descrizione quando l'immagine non arriva. Prima erano dichiarate in tre modi
 * diversi (con le misure sugli articoli, con la sola stringa sugli indici e sulle
 * note), e un agente di anteprima ha bisogno che siano dichiarate **nello stesso
 * modo dappertutto**.
 *
 * Le misure sono quelle vere del file: le card le scrive `scripts/og.ps1` a
 * 1200×630, e `verify.js` controlla che il file esista.
 */
export function socialImages(
  url: string,
  alt: string,
): {
  og: NonNullable<NonNullable<Metadata["openGraph"]>["images"]>;
  twitter: NonNullable<NonNullable<Metadata["twitter"]>["images"]>;
} {
  return {
    og: [{ url, width: 1200, height: 630, alt, type: "image/png" }],
    twitter: [{ url, alt, width: 1200, height: 630 }],
  };
}
