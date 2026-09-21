import type { ReactNode } from "react";
import Link from "next/link";
import TableOfContents, { MobileTableOfContents, type TocItem } from "@/components/TableOfContents";

export type LegalSection = {
  id: string;
  title: string;
  content: ReactNode;
};

type LegalPageProps = {
  title: string;
  intro: string;
  sections: LegalSection[];
};

export function LegalPage({ title, intro, sections }: LegalPageProps) {
  const toc: TocItem[] = sections.map(({ id, title: label }) => ({ anchor: id, label }));

  return (
    <main id="content" className="mx-auto max-w-[692px] px-6 py-12 leading-relaxed sm:py-24">
      <nav aria-label="Breadcrumb" className="mb-16 text-sm text-gray-1000">
        <Link href="/">Home</Link> <span aria-hidden="true">·</span> <span aria-current="page">{title}</span>
      </nav>

      <header className="mb-12">
        <h1 className="font-serif text-4xl font-medium leading-tight text-gray-1200 sm:text-5xl">{title}</h1>
        <p className="mt-5 max-w-[580px] text-text-paragraph">{intro}</p>
        <p className="mt-4 text-sm text-gray-1000">Last updated September 21, 2026.</p>
      </header>

      <TableOfContents items={toc} />
      <MobileTableOfContents items={toc} />

      <article className="space-y-12">
        {sections.map((section) => (
          <section key={section.id} id={section.id} className="scroll-mt-20">
            <h2 className="mb-4 flex items-center gap-3 font-serif text-2xl font-medium leading-tight text-gray-1200">
              <span>{section.title}</span>
              <span className="h-px min-w-8 flex-1 bg-gray-300" aria-hidden="true" />
            </h2>
            <div className="space-y-4 text-text-paragraph">{section.content}</div>
          </section>
        ))}
      </article>

      <p className="mt-16 border-t border-gray-300 pt-5 text-sm text-gray-1000">
        <Link href="/legal/" className="article-underline">Legal Center</Link>
      </p>
    </main>
  );
}
