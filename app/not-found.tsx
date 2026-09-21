import Link from "next/link";
import { ArrowUpLeftIcon } from "@/components/ui/static-icons";

export default function NotFound() {
  return (
    <main
      className="mx-auto flex min-h-screen max-w-[692px] flex-col px-6 py-12 leading-relaxed sm:py-24"
    >
      <header className="mb-24 flex items-center gap-4">
        <Link
          href="/"
          aria-label="Go back home"
          className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-300 transition-colors hover:bg-gray-400"
        >
          <ArrowUpLeftIcon size={16} />
        </Link>
      </header>
      <h1 className="m-0 font-serif text-3xl font-medium">404 nothing here.</h1>
      <p className="m-0 mt-4 text-text-paragraph">
        <Link href="/" className="article-underline">
          Go back home.
        </Link>
      </p>
    </main>
  );
}