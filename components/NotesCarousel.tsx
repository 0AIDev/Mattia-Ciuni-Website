import Image from "next/image";
import Link from "next/link";
import { ChevronRight } from "@/components/icons";
import type { Note } from "@/lib/notes";

export function NotesCarousel({ notes }: { notes: Note[] }) {
  return (
    <ul
      className="-mx-1 flex snap-x gap-4 overflow-x-auto px-1 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
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
  );
}
