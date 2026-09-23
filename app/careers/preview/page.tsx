import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getJob } from "@/lib/careers/jobs";

export const metadata: Metadata = {
  title: "Careers offer preview",
  robots: { index: false, follow: false, nocache: true },
};

export default function CareersOfferPreviewPage() {
  const job = getJob("agent-runtime-founding-engineer");
  if (!job) notFound();
  return (
    <main id="content">
      <article className="mx-auto w-full max-w-[692px] px-5 py-12 leading-relaxed sm:px-6 sm:py-24">
        <div className="mb-10 border-b border-gray-300 pb-3 text-xs uppercase tracking-[.14em] text-gray-1000">Design preview · careers offer</div>
        <Link href="/careers/" className="text-sm text-gray-1000 underline-offset-4 hover:underline">← Careers</Link>
        <header className="mb-16 mt-10 sm:mb-24">
          <p className="text-sm text-gray-1000">{job.department} · {job.location} · {job.type}</p>
          <h1 className="mt-4 max-w-[620px] font-serif text-5xl font-medium leading-[.98] tracking-[-.03em] text-gray-1200 sm:text-6xl">{job.title}</h1>
          <p className="mt-7 max-w-[600px] text-xl leading-relaxed text-text-paragraph">{job.shortPitch}</p>
        </header>
        <div className="max-w-[620px] space-y-6 text-[17px] leading-relaxed text-text-paragraph">
          {job.description.split(/\n\s*\n/).map((paragraph) => <p key={paragraph} className="whitespace-pre-line">{paragraph}</p>)}
        </div>
        {job.challenge ? <section className="mt-16 border-t border-gray-300 pt-8 sm:mt-24"><h2 className="font-serif text-3xl font-medium">{job.challenge.title}</h2><p className="mt-4 max-w-[600px] text-text-paragraph">{job.challenge.description}</p><p className="mt-4 max-w-[600px] text-sm text-gray-1000">Deliverable: {job.challenge.deliverable}</p></section> : null}
        <p className="mt-16 border-t border-gray-300 pt-8 text-sm text-gray-1000">This is a design preview. Applications are not submitted from this page.</p>
      </article>
    </main>
  );
}
