"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ForAICard } from "@/components/ForAICard";
import { ArrowUpRightIcon } from "@/components/ui/arrow-up-right";

export function SiteFooter() {
  const pathname = usePathname();
  if (pathname?.startsWith("/admin")) return null;
  // /link è una pagina per i link in bio: vive fuori dal sito, si apre da un
  // profilo social e deve finire sopra la piega. Le navigazioni del footer
  // sarebbero una seconda lista di link sotto la lista di link.
  if (pathname?.startsWith("/link")) return null;

  return (
    <footer className="mx-auto max-w-[692px] px-6 pb-10">
      <div className="flex flex-wrap items-center gap-x-6 gap-y-3 border-t border-gray-300 pt-8 text-gray-1000">
        <a href="/feed.xml" className="flex items-center gap-1.5">
          Feed <ArrowUpRightIcon size={15} className="inline-flex shrink-0" />
        </a>
        <span>© 2026 Mattia Ciuni</span>
        <ForAICard />
      </div>
      <nav aria-label="Site" className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-sm text-gray-1000">
        <Link href="/about/">About</Link>
        <Link href="/work/">Work</Link>
        <Link href="/thoughts/">Thoughts</Link>
        <Link href="/notes/">Notes</Link>
        <Link href="/feedback/">Feedback</Link>
      </nav>
      <nav aria-label="Legal" className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-sm text-gray-1000">
        <Link href="/privacy/">Privacy Policy</Link>
        <Link href="/terms/">Terms of Service</Link>
        <Link href="/cookies/">Cookies</Link>
        <Link href="/legal/">Legal Center</Link>
      </nav>
      <div aria-hidden="true" className="site-signature mx-auto mt-16" />
    </footer>
  );
}
