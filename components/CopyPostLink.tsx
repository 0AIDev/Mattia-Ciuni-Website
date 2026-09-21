"use client";

import { useState } from "react";
import { Check } from "./icons";
import { CopyIcon } from "@/components/ui/static-icons";

export default function CopyPostLink() {
  const [copied, setCopied] = useState(false);

  async function copy() {
    const url = window.location.href;
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = url;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  return (
    <button
      type="button"
      onClick={copy}
      title={copied ? "Copied" : "Copy link"}
      aria-label={copied ? "Link copied" : "Copy link to article"}
      aria-live="polite"
      className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-300 text-gray-1200 transition-colors hover:bg-gray-400"
    >
      {copied ? <Check className="h-4 w-4" /> : <CopyIcon size={16} />}
    </button>
  );
}