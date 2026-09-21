"use client";

import dynamic from "next/dynamic";

const SiteRagChat = dynamic(
  () => import("./SiteRagChat").then((module) => module.SiteRagChat),
  { ssr: false, loading: () => null },
);

export function DeferredSiteRagChat() {
  return <SiteRagChat />;
}
