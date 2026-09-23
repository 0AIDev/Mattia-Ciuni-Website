import type { Metadata } from "next";
import Link from "next/link";
import { HistoryBackButton } from "@/components/HistoryBackButton";

export const metadata: Metadata = { title: "Application confirmed", robots: { index: false, follow: false } };

export default function ConfirmedPage() {
  return <main id="content" className="min-h-[70vh] bg-[#05060A] text-[#F4F7FC]"><div className="mx-auto w-full max-w-[640px] px-5 py-24 sm:px-6"><h1 className="font-serif text-4xl">Application confirmed.</h1><p className="mt-6 max-w-[560px] text-[17px] leading-relaxed text-white/70">Application confirmed for Founding Engineer, Agent Runtime. I read everything personally — usually within a few days.</p><p className="mt-8 text-white/80">Mattia</p><div className="mt-10 flex items-center gap-3"><HistoryBackButton fallbackHref="/careers/" fallbackLabel="Back to careers" className="bg-white/10 text-white hover:bg-white/20" /><Link href="/careers/" className="text-sm text-white/55 underline decoration-white/20 underline-offset-4">Careers</Link></div></div></main>;
}
