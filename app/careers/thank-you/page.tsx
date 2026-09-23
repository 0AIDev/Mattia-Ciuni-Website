import type { Metadata } from "next";
import Link from "next/link";
import { HistoryBackButton } from "@/components/HistoryBackButton";

export const metadata: Metadata = { title: "Almost done", robots: { index: false, follow: false } };

export default function ThankYouPage() {
  return <main id="content" className="min-h-[70vh] bg-[#05060A] text-[#F4F7FC]"><div className="mx-auto w-full max-w-[640px] px-5 py-24 sm:px-6"><h1 className="font-serif text-4xl">Almost done.</h1><p className="mt-6 max-w-[560px] text-[17px] leading-relaxed text-white/70">Check your inbox, one click to verify your email, and your application is confirmed. I read everything personally.</p><p className="mt-6 text-sm text-white/55">Didn&apos;t receive it? Check spam, or write me: <a href="mailto:ceo@usepayle.com" className="underline decoration-white/20 underline-offset-4">ceo@usepayle.com</a></p><div className="mt-10 flex items-center gap-3"><HistoryBackButton fallbackHref="/careers/" fallbackLabel="Back to careers" className="bg-white/10 text-white hover:bg-white/20" /><Link href="/careers/" className="text-sm text-white/55 underline decoration-white/20 underline-offset-4">Careers</Link></div></div></main>;
}
