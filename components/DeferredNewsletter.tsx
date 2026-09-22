"use client";

import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";

const NewsletterSection = dynamic(
  () => import("./NewsletterSection").then((module) => module.NewsletterSection),
  { ssr: false, loading: () => null },
);

export function DeferredNewsletter() {
  const pathname = usePathname();
  if (pathname?.startsWith("/admin")) return null;
  // /newsletter ha la sua, in cima: due form identici nella stessa pagina
  // confondono, e quello in fondo è il primo che si incontra scorrendo.
  if (pathname?.startsWith("/newsletter")) return null;
  // /link ha la sua, in forma di scheda dentro la lista dei link: qui sotto
  // sarebbe un secondo form identico, staccato dal resto della pagina.
  if (pathname?.startsWith("/link")) return null;
  // Localized routes own their translated page content; do not append the
  // English global newsletter form beneath them.
  if (/^\/(it|fr|es|de)(\/|$)/.test(pathname || "")) return null;
  return <NewsletterSection />;
}
