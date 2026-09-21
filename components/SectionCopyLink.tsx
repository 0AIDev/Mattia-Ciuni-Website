"use client";

import { useState } from "react";
import { Check } from "./icons";
import { LinkIcon } from "@/components/ui/link";
import { copyText, sectionUrl } from "@/lib/copy";
import { cn } from "@/lib/utils";

// Comportamento di default sugli heading: compare in hover sull'H2 (o al focus).
const DEFAULT_CLASS =
  "text-gray-1000 opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100";

export default function SectionCopyLink({
  anchor,
  label,
  size = 16,
  className = DEFAULT_CLASS,
}: {
  anchor: string;
  label: string;
  size?: number;
  /** Sostituisce le classi di default (colore + visibilità). */
  className?: string;
}) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    await copyText(sectionUrl(anchor));
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  return (
    <button
      type="button"
      onClick={copy}
      title={copied ? "Copied" : "Copy link to section"}
      aria-label={copied ? "Section link copied" : `Copy link to section: ${label}`}
      aria-live="polite"
      className={cn("shrink-0", className)}
    >
      {copied ? (
        <Check size={size} />
      ) : (
        <LinkIcon size={size} />
      )}
    </button>
  );
}
