"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function ForAICard() {
  const pathname = usePathname() ?? "/";
  const p = pathname.replace(/\/+$/, "") || "/";
  if (p.startsWith("/_")) return null;
  const card = p === "/" ? "index.md" : p.slice(1) + ".md";
  return (
    <p className="ml-auto text-xs">
      For AI: <Link href={"/" + card}>{card}</Link>
    </p>
  );
}
