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
  return <NewsletterSection />;
}
