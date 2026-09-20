import Link from "next/link";
import { Fragment } from "react";

// Sintassi nel testo degli articoli: *corsivo* e [etichetta](/percorso/ | #sezione | https://…)
const TOKEN = /(\*[^*]+\*|\[[^\]]+\]\([^)]+\))/g;
const LINK = /^\[([^\]]+)\]\(([^)]+)\)$/;

export function InlineText({ text }: { text: string }) {
  return (
    <>
      {text.split(TOKEN).map((part, i) => {
        if (part.length > 2 && part.startsWith("*") && part.endsWith("*")) {
          return (
            <em key={i} className="font-serif italic">
              {part.slice(1, -1)}
            </em>
          );
        }
        const link = part.match(LINK);
        if (link) {
          const [, label, href] = link;
          // Link interni con <Link> (regola ESLint del progetto), esterni e
          // ancore con <a>: gli anchor restano gestiti da Lenis.
          return href.startsWith("/") ? (
            <Link key={i} href={href} className="article-underline">
              {label}
            </Link>
          ) : (
            <a
              key={i}
              href={href}
              rel={href.startsWith("#") ? undefined : "noopener noreferrer"}
              className="article-underline"
            >
              {label}
            </a>
          );
        }
        return <Fragment key={i}>{part}</Fragment>;
      })}
    </>
  );
}
