"use client";

import { usePathname } from "next/navigation";

export function ForAICard() {
  const pathname = usePathname() ?? "/";
  const p = pathname.replace(/\/+$/, "") || "/";
  if (p.startsWith("/_")) return null;
  // La dashboard privata non ha una card, quindi non se ne annuncia una: il link
  // in fondo a `/admin/feedback/` puntava a `/admin/feedback.md`, cioè raccontava
  // a chiunque leggesse l'HTML che esiste una versione macchina di quella pagina.
  // Le pagine private non si annunciano, qui come in ogni indice.
  if (p === "/admin" || p.startsWith("/admin/")) return null;
  const card = p === "/" ? "index.md" : p.slice(1) + ".md";
  return (
    <p className="ml-auto text-xs">
      For AI: <a href={"/" + card}>{card}</a>
    </p>
  );
}
