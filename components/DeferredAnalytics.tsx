"use client";

import dynamic from "next/dynamic";

const GoogleAnalytics = dynamic(
  () => import("./GoogleAnalytics").then((module) => module.GoogleAnalytics),
  { ssr: false, loading: () => null },
);

export function DeferredAnalytics() {
  return <GoogleAnalytics />;
}
