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
  return <NewsletterSection />;
}
