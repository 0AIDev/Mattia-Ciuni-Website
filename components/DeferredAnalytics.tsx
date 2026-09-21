"use client";

import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";

const GoogleAnalytics = dynamic(
  () => import("./GoogleAnalytics").then((module) => module.GoogleAnalytics),
  { ssr: false, loading: () => null },
);

export function DeferredAnalytics() {
  const pathname = usePathname();
  // La dashboard è uno spazio privato: niente banner consenso, tracking o
  // script Analytics dentro il login/admin.
  if (pathname?.startsWith("/admin")) return null;
  return <GoogleAnalytics />;
}
