import type { Metadata } from "next";
import Link from "next/link";
import { HistoryBackButton } from "@/components/HistoryBackButton";
import { ConfirmedMessage } from "@/components/ConfirmedMessage";

export const metadata: Metadata = { title: "Application confirmed", robots: { index: false, follow: false } };

// Pagina di conferma candidatura: solo il messaggio, dentro una card grigia
// minimal, sfondo bianco e testo nero. Il messaggio è per ruolo (legge ?job=
// lato client, vedi ConfirmedMessage): senza slug resta il testo generico.
export default function ConfirmedPage() {
  return (
    <main id="content" className="min-h-[70vh] bg-white text-gray-1200">
      <div className="mx-auto w-full max-w-[640px] px-5 py-24 sm:px-6">
        <div className="rounded-3xl bg-gray-100 p-8 sm:p-12">
          <ConfirmedMessage />
        </div>
        <div className="mt-10 flex items-center gap-3">
          <HistoryBackButton fallbackHref="/careers/" fallbackLabel="Back to careers" />
          <Link href="/careers/" className="text-sm text-gray-1000 underline decoration-gray-400 underline-offset-4">
            Careers
          </Link>
        </div>
      </div>
    </main>
  );
}
