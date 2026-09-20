// Helper condivisi dai bottoni "copia link" (articolo, sezione, TOC).

/** URL assoluto e copiabile della sezione: rimuove un eventuale hash già presente. */
export function sectionUrl(anchor: string) {
  return `${window.location.href.split("#")[0]}#${anchor}`;
}

/** Copia testo, con fallback per browser/contesti senza Clipboard API. */
export async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    return;
  } catch {
    // Clipboard API assente o permesso negato: si prosegue col fallback.
  }
  const ta = document.createElement("textarea");
  ta.value = text;
  ta.setAttribute("readonly", "");
  ta.style.position = "fixed";
  ta.style.top = "-1000px";
  document.body.appendChild(ta);
  ta.select();
  document.execCommand("copy");
  document.body.removeChild(ta);
}
