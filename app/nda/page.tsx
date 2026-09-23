import type { Metadata } from "next";
import { NdaGate } from "@/components/NdaGate";

export const metadata: Metadata = {
  title: "NDA",
  description: "Private NDA access.",
  alternates: { canonical: "/nda/" },
  robots: { index: false, follow: false, noarchive: true },
  openGraph: { type: "website", siteName: "Mattia Ciuni", title: "NDA | Mattia Ciuni", url: "/nda/", images: [] },
  twitter: { card: "summary", title: "NDA | Mattia Ciuni" },
};

export default function NdaPage() {
  return <NdaGate />;
}
