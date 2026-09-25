"use client";

import { useState } from "react";
import { Check } from "./icons";
import { LinkIcon } from "@/components/ui/link";
import { copyText } from "@/lib/copy";
import { track } from "@/lib/analytics";

/**
 * Copia l'indirizzo della pagina corrente.
 *
 * Esiste perche' `SectionCopyLink` costruisce l'URL da un anchor, e su una pagina
 * appena creata dal pannello non c'e' un anchor da copiare: il link che serve e'
 * quello della pagina. Senza questo, una pagina CMS non avrebbe il modo di
 * condividere il proprio indirizzo, che e' la prima cosa che chiede chiunque
 * legga un articolo nuovo.
 */
export function CopyPageLink({ label = "Copy link" }: { label?: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    await copyText(window.location.href.split("#")[0]);
    setCopied(true);
    track("copy_link", { copy_kind: "page", section: "page", content_kind: "other" });
    window.setTimeout(() => setCopied(false), 1600);
  }

  return (
    <button
      type="button"
      onClick={copy}
      title={copied ? "Copied" : label}
      aria-label={copied ? "Page link copied" : label}
      aria-live="polite"
      className="inline-flex items-center gap-1.5 text-gray-1000 transition-colors hover:text-gray-1200"
    >
      {copied ? <Check size={14} /> : <LinkIcon size={14} />}
      <span>{copied ? "Copied" : label}</span>
    </button>
  );
}
