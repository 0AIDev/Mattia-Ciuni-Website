import { ForAICard } from "@/components/ForAICard";
import { ArrowUpRightIcon } from "@/components/ui/arrow-up-right";

export function SiteFooter() {
  return (
    <footer className="mx-auto max-w-[692px] px-6 pb-10">
      <div className="flex flex-wrap items-center gap-x-6 gap-y-3 border-t border-gray-300 pt-8 text-gray-1000">
        <a href="/feed.xml" className="flex items-center gap-1.5">
          Feed <ArrowUpRightIcon size={15} className="inline-flex shrink-0" />
        </a>
        <span>© 2026 Mattia Ciuni</span>
        <ForAICard />
      </div>

      {/* Signature: il logo riempito con la sfumatura (vedi `.site-signature`). */}
      <div aria-hidden="true" className="site-signature mx-auto mt-16" />
    </footer>
  );
}
