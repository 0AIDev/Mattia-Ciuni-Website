import type { ReactNode } from "react";

export function inlineCareerText(text: string): ReactNode[] {
  return text.split(/(\*\*[^*]+\*\*|__[^_]+__|`[^`]+`|"[^"]+")/g).map((part, index) => {
    if ((part.startsWith("**") && part.endsWith("**")) || (part.startsWith("__") && part.endsWith("__"))) {
      return <strong key={`${part}-${index}`}>{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith("`") && part.endsWith("`")) {
      return <code key={`${part}-${index}`} className="rounded bg-gray-100 px-1.5 py-0.5 font-mono text-[0.9em]">{part.slice(1, -1)}</code>;
    }
    if (part.startsWith('"') && part.endsWith('"')) {
      return <q key={`${part}-${index}`}>{part.slice(1, -1)}</q>;
    }
    return part;
  });
}

export function careerMeta(job: { department: string; location: string; type: string; compensation?: string }, locale: string) {
  const availability = {
    en: "Open until filled",
    it: "Aperto fino a copertura",
    fr: "Ouvert jusqu'au recrutement",
    es: "Abierto hasta cubrir la plaza",
    de: "Offen, bis die Stelle besetzt ist",
  }[locale] || "Open until filled";
  return { availability };
}
