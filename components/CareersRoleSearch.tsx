"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { CareerJob } from "@/lib/careers/jobs";
import { uiCopy } from "@/lib/i18n-ui";
import { track } from "@/lib/analytics";
import type { Locale } from "@/lib/i18n";

function SearchIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20" fill="none" className="h-4 w-4 shrink-0">
      <circle cx="8.5" cy="8.5" r="5.5" stroke="currentColor" />
      <path d="m13 13 4 4" stroke="currentColor" strokeLinecap="round" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20" fill="none" className="h-4 w-4">
      <path d="m5 5 10 10M15 5 5 15" stroke="currentColor" strokeLinecap="round" />
    </svg>
  );
}

type Status = "all" | "open" | "coming-soon";

export function CareersRoleSearch({
  jobs,
  basePath,
  locale = "en",
  showControls = true,
}: {
  jobs: CareerJob[];
  basePath: string;
  locale?: Locale;
  showControls?: boolean;
}) {
  const text = uiCopy[locale];
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<Status>("all");
  const [activeIndex, setActiveIndex] = useState(0);
  const normalized = query.trim().toLowerCase();

  const filtered = useMemo(
    () =>
      jobs.filter((job) => {
        const matchesStatus = status === "all" || job.status === status;
        const haystack = [job.title, job.department, job.location, job.type, job.shortPitch]
          .join(" ")
          .toLowerCase();
        return matchesStatus && (!normalized || haystack.includes(normalized));
      }),
    [jobs, normalized, status],
  );

  const close = () => {
    setOpen(false);
    setQuery("");
    setStatus("all");
    setActiveIndex(0);
  };

  const openPalette = useCallback(() => {
    track("role_search_open", { roles_count: jobs.length });
    setOpen(true);
    setActiveIndex(0);
  }, [jobs.length]);

  useEffect(() => {
    if (!showControls) return;

    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && (event.key.toLowerCase() === "k" || event.code === "KeyK")) {
        event.preventDefault();
        openPalette();
        return;
      }
      if (event.key === "Escape" && open) {
        event.preventDefault();
        close();
      }
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, openPalette, showControls]);

  useEffect(() => {
    if (!open) return;
    inputRef.current?.focus();
    const previousOverflow = document.body.style.overflow;
    const previousScrollbar = document.documentElement.style.scrollbarWidth;
    document.body.style.overflow = "hidden";
    document.documentElement.style.scrollbarWidth = "none";
    return () => {
      document.body.style.overflow = previousOverflow;
      document.documentElement.style.scrollbarWidth = previousScrollbar;
    };
  }, [open]);

  const safeActiveIndex = Math.min(activeIndex, Math.max(filtered.length - 1, 0));

  const handleInputKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((index) => (filtered.length ? (index + 1) % filtered.length : 0));
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((index) => (filtered.length ? (index - 1 + filtered.length) % filtered.length : 0));
    }
    if (event.key === "Enter" && filtered[safeActiveIndex]) {
      event.preventDefault();
      router.push(`${basePath}/${filtered[safeActiveIndex].slug}/`);
      close();
    }
  };

  return (
    <div>
      {showControls ? (
        <button
          type="button"
          onClick={openPalette}
          aria-haspopup="dialog"
          aria-expanded={open}
          aria-keyshortcuts="Meta+K Control+K"
          className="flex min-h-11 w-full items-center justify-between rounded-full border border-gray-300 bg-white px-4 text-sm text-gray-1000 transition-colors hover:border-gray-1200"
        >
          <span className="flex items-center gap-3">
            <SearchIcon />
            {text.searchRoles}
          </span>
          <kbd className="rounded-md border border-gray-300 px-2 py-0.5 text-[11px] text-gray-1000">⌘K</kbd>
        </button>
      ) : null}

      <div className={`${showControls ? "mt-8" : "mt-2"} border-t border-gray-300`}>
        {filtered.length ? (
          filtered.map((job) => (
            <Link
              key={job.slug}
              href={`${basePath}/${job.slug}/`}
              className="group block border-b border-gray-300 py-5"
            >
              <div className="flex flex-wrap items-baseline justify-between gap-3">
                <h2 className="font-serif text-2xl font-medium text-gray-1200 group-hover:underline">{job.title}</h2>
                <span className="text-sm text-gray-1000">{job.status === "open" ? text.open : text.comingSoon}</span>
              </div>
              <p className="mt-2 text-sm text-gray-1000">{job.department} · {job.location} · {job.type}</p>
              <p className="mt-3 max-w-[580px] text-text-paragraph">{job.shortPitch}</p>
            </Link>
          ))
        ) : (
          <p className="py-12 text-center text-sm text-gray-1000">{text.noRoles}</p>
        )}
      </div>

      {open ? (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center bg-gray-1200/30 p-4 pt-[10vh] backdrop-blur-sm sm:pt-[14vh]"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) close();
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label={text.searchRoles}
            className="w-full max-w-[620px] overflow-hidden rounded-3xl border border-gray-300 bg-white shadow-[0_24px_80px_rgba(0,0,0,0.18)]"
          >
            <div className="flex items-center gap-3 border-b border-gray-300 px-5">
              <SearchIcon />
              <input
                ref={inputRef}
                value={query}
                onChange={(event) => { setQuery(event.target.value); track("role_search_query", { query_length: event.target.value.length }); }}
                onKeyDown={handleInputKeyDown}
                placeholder={text.searchRoles}
                aria-label={text.searchRoles}
                aria-controls="careers-role-results"
                className="min-h-14 min-w-0 flex-1 bg-transparent text-base outline-none"
              />
              <button
                type="button"
                onClick={close}
                aria-label={text.closeSearch}
                className="flex h-8 w-8 items-center justify-center rounded-full text-gray-1000 transition-colors hover:bg-gray-100 hover:text-gray-1200"
              >
                <CloseIcon />
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-2 border-b border-gray-300 px-5 py-3" aria-label={text.filterRoles}>
              {(["all", "open", "coming-soon"] as Status[]).map((filter) => {
                const label = filter === "all" ? text.allRoles : filter === "open" ? text.open : text.comingSoon;
                return (
                  <button
                    key={filter}
                    type="button"
                    onClick={() => {
                      track("role_filter_change", { filter });
                      setStatus(filter);
                      setActiveIndex(0);
                    }}
                    aria-pressed={status === filter}
                    className={`rounded-full border px-3 py-1 text-xs transition-colors ${status === filter ? "border-gray-1200 bg-gray-1200 text-white" : "border-gray-300 text-gray-1000 hover:border-gray-1200"}`}
                  >
                    {label}
                  </button>
                );
              })}
              <span className="ml-auto hidden text-xs text-gray-1000 sm:inline">↑↓ {text.navigate} · Enter {text.select}</span>
            </div>

            <div id="careers-role-results" role="listbox" aria-label={text.searchRoles} className="max-h-[52vh] overflow-y-auto p-2">
              {filtered.length ? (
                filtered.map((job, index) => (
                  <Link
                    key={job.slug}
                    href={`${basePath}/${job.slug}/`}
                    role="option"
                    aria-selected={index === safeActiveIndex}
                    onMouseEnter={() => setActiveIndex(index)}
                    onClick={() => { track("role_select", { job_slug: job.slug, source: "search" }); close(); }}
                    className={`block rounded-2xl px-4 py-3 transition-colors ${index === safeActiveIndex ? "bg-gray-100" : "hover:bg-gray-100"}`}
                  >
                    <span className="block font-serif text-lg">{job.title}</span>
                    <span className="mt-1 block text-xs text-gray-1000">{job.department} · {job.type}</span>
                  </Link>
                ))
              ) : (
                <p className="px-4 py-10 text-center text-sm text-gray-1000">{text.noRoles}</p>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
