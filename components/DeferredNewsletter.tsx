"use client";

import dynamic from "next/dynamic";

const NewsletterSection = dynamic(
  () => import("./NewsletterSection").then((module) => module.NewsletterSection),
  { ssr: false, loading: () => null },
);

export function DeferredNewsletter() {
  return <NewsletterSection />;
}
