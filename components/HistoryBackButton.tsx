"use client";

import { useRouter } from "next/navigation";

type HistoryBackButtonProps = {
  fallbackHref?: string;
  fallbackLabel?: string;
  className?: string;
};

export function HistoryBackButton({
  fallbackHref = "/",
  fallbackLabel = "Go back",
  className = "",
}: HistoryBackButtonProps) {
  const router = useRouter();

  function goBack() {
    if (window.history.length > 1) {
      router.back();
      return;
    }
    router.push(fallbackHref);
  }

  return (
    <button
      type="button"
      onClick={goBack}
      aria-label={fallbackLabel}
      className={`flex h-9 w-9 items-center justify-center rounded-full bg-gray-300 transition-colors hover:bg-gray-400 ${className}`}
    >
      <svg aria-hidden="true" viewBox="0 0 20 20" fill="none" className="h-4 w-4"><path d="M13 4 7 10l6 6" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" /></svg>
    </button>
  );
}
