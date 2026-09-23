import { HistoryBackButton } from "@/components/HistoryBackButton";

export default function NotFound() {
  return (
    <main
      className="mx-auto flex min-h-screen max-w-[692px] flex-col px-6 py-12 leading-relaxed sm:py-24"
    >
      <header className="mb-24 flex items-center gap-4">
        <HistoryBackButton fallbackLabel="Go back" />
      </header>
      <h1 className="m-0 font-serif text-3xl font-medium">404 nothing here.</h1>
      <p className="m-0 mt-4 text-text-paragraph">
        <span className="inline-flex items-center gap-3"><HistoryBackButton fallbackLabel="Go back" /> <span>Go back.</span></span>
      </p>
    </main>
  );
}