"use client";

import Link from "next/link";
import { useEffect } from "react";
import { CareersApplicationForm } from "@/components/CareersApplicationForm";
import { track } from "@/lib/analytics";
import type { CareerJob } from "@/lib/careers/jobs";
import { careersUi } from "@/lib/careers/ui";

function CloseIcon() {
  return <svg aria-hidden="true" viewBox="0 0 20 20" fill="none" className="h-4 w-4"><path d="m5 5 10 10M15 5 5 15" stroke="currentColor" strokeLinecap="round" /></svg>;
}

function BackIcon() {
  return <svg aria-hidden="true" viewBox="0 0 20 20" fill="none" className="h-4 w-4"><path d="M15 10H5m4-4-4 4 4 4" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}

export function CareersApplicationModal({ job, basePath }: { job: CareerJob; basePath: string }) {
  const text = careersUi.en;
  useEffect(() => {
    track("application_view", { job_slug: job.slug, application_locale: "en" });
    const previousOverflow = document.body.style.overflow;
    const previousScrollbar = document.documentElement.style.scrollbarWidth;
    document.body.style.overflow = "hidden";
    document.documentElement.style.scrollbarWidth = "none";
    return () => {
      document.body.style.overflow = previousOverflow;
      document.documentElement.style.scrollbarWidth = previousScrollbar;
    };
  }, [job.slug]);
  const detailPath = `${basePath}/${job.slug}/`;
  const closeLabel = "Close application";

  return (
    <div className="fixed inset-0 z-50 h-[100dvh] w-screen max-w-[100vw] overflow-hidden bg-gray-1200/30 p-0 backdrop-blur-md sm:p-5" role="dialog" aria-modal="true" aria-label={`${text.applyingFor}: ${job.title}`}>
      <div className="relative mx-auto flex h-[100dvh] max-h-[100dvh] min-w-0 w-full max-w-[900px] flex-col overflow-x-hidden overflow-y-hidden border border-gray-300 bg-preview-bg px-4 py-4 shadow-[0_24px_100px_rgba(0,0,0,0.22)] sm:h-[calc(100dvh-2.5rem)] sm:max-h-[calc(100dvh-2.5rem)] sm:rounded-[2rem] sm:px-10 sm:py-9">
        <div className="flex min-w-0 items-center justify-between gap-3 border-b border-gray-300 pb-5">
          <Link href={detailPath} className="group flex items-center gap-3 text-sm text-gray-1000 transition-colors hover:text-gray-1200">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 transition-colors group-hover:bg-gray-200" aria-hidden="true"><BackIcon /></span>
            <span className="transition-colors group-hover:underline">{text.careers}</span>
          </Link>
          <div className="flex items-center gap-3">
            <span className="hidden min-w-0 max-w-[280px] truncate text-xs text-gray-1000 sm:block">{job.title}</span>
            <Link href={detailPath} aria-label={closeLabel} onClick={() => track("application_close", { job_slug: job.slug })} className="group flex h-9 w-9 items-center justify-center rounded-full border border-gray-300 text-gray-1000 transition-colors hover:border-gray-1200 hover:bg-gray-100 hover:text-gray-1200"><CloseIcon /></Link>
          </div>
        </div>
        <div className="min-h-0 min-w-0 flex-1 overflow-y-auto overscroll-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div className="mx-auto min-w-0 w-full max-w-[680px]">
          <header className="pb-8 pt-10 sm:pt-14">
            <h1 className="max-w-[620px] font-serif text-4xl font-medium leading-[1.02] tracking-[-.025em] text-gray-1200 sm:text-6xl">{text.applyTitle}</h1>
            <p className="mt-5 max-w-[580px] text-base leading-relaxed text-text-paragraph sm:text-lg">{text.applyIntro}</p>
          </header>
          <div className="border-t border-gray-300 pt-8 sm:pt-10">
            <CareersApplicationForm jobSlug={job.slug} questions={job.questions} />
          </div>
        </div>
        </div>
      </div>
    </div>
  );
}
