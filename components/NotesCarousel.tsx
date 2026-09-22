"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronRight } from "@/components/icons";
import type { Note } from "@/lib/notes";
// `track` è già il nome del riferimento allo scroller in questo componente.
import { track as trackEvent } from "@/lib/analytics";

function DirectionArrow({ previous = false }: { previous?: boolean }) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
      className={`h-4 w-4 ${previous ? "rotate-180" : ""}`}
    >
      <path
        d="m6 12 4-4-4-4"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function NotesCarousel({ notes }: { notes: Note[] }) {
  const track = useRef<HTMLUListElement>(null);
  const [canGoBack, setCanGoBack] = useState(false);
  const [canGoForward, setCanGoForward] = useState(notes.length > 1);

  const updateControls = useCallback(() => {
    const element = track.current;
    if (!element) return;
    setCanGoBack(element.scrollLeft > 1);
    setCanGoForward(element.scrollLeft + element.clientWidth < element.scrollWidth - 1);
  }, []);

  useEffect(() => {
    const element = track.current;
    if (!element) return;
    updateControls();
    element.addEventListener("scroll", updateControls, { passive: true });
    window.addEventListener("resize", updateControls);
    return () => {
      element.removeEventListener("scroll", updateControls);
      window.removeEventListener("resize", updateControls);
    };
  }, [updateControls]);

  function move(direction: -1 | 1) {
    track.current?.scrollBy({ left: direction * 292, behavior: "smooth" });
    // Quale dei due pulsanti viene usato dice se le note in evidenza vengono
    // sfogliate o se la gente legge solo la prima card.
    trackEvent("carousel_step", { direction: direction === 1 ? "next" : "previous", list: "featured_notes" });
  }

  return (
    <div>
      <div className="mb-3 flex justify-end gap-1">
        <button
          type="button"
          aria-label="Previous notes"
          onClick={() => move(-1)}
          disabled={!canGoBack}
          className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-300 text-gray-1000 transition-colors hover:border-gray-1200 hover:text-gray-1200 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:border-gray-300 disabled:hover:text-gray-1000"
        >
          <DirectionArrow previous />
        </button>
        <button
          type="button"
          aria-label="Next notes"
          onClick={() => move(1)}
          disabled={!canGoForward}
          className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-300 text-gray-1000 transition-colors hover:border-gray-1200 hover:text-gray-1200 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:border-gray-300 disabled:hover:text-gray-1000"
        >
          <DirectionArrow />
        </button>
      </div>
      <ul
        ref={track}
        className="-mx-1 flex max-w-full snap-x gap-4 overflow-x-auto px-1 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        aria-label="Featured notes"
      >
        {notes.map((note) => (
          <li key={note.slug} className="w-[228px] shrink-0 snap-start sm:w-[252px]">
            <Link href={`/notes/${note.slug}/`} className="group block">
              <div className="overflow-hidden rounded-lg border border-gray-300 bg-preview-bg">
                <Image
                  src={`/notes/${note.slug}/cover.png`}
                  alt=""
                  width={1200}
                  height={630}
                  loading="lazy"
                  className="aspect-[1.9] h-auto w-full object-cover transition-transform duration-500 group-hover:scale-[1.02] motion-reduce:transition-none"
                />
              </div>
              <div className="mt-2 flex items-start justify-between gap-2">
                <span className="font-serif text-base font-medium leading-snug transition-colors group-hover:text-gray-1000">
                  {note.title}
                </span>
                <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-gray-1000 transition-transform group-hover:translate-x-1" />
              </div>
              <time dateTime={note.date} className="mt-1 block text-xs text-gray-1000">
                {note.date}
              </time>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
