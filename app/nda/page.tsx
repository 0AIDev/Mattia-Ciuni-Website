import type { Metadata } from "next";
import { NdaGate } from "@/components/NdaGate";

export const metadata: Metadata = {
  title: "NDA",
  description: "Private NDA access.",
  alternates: { canonical: "/nda/" },
  robots: { index: false, follow: false, noarchive: true },
  openGraph: { title: "NDA", url: "/nda/", images: [] },
  twitter: { card: "summary" },
};

export default function NdaPage() {
  return <NdaGate />;
}
