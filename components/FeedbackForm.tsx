"use client";

import { FormEvent, useEffect, useRef, useState } from "react";

/**
 * Il pulsante "Give feedback" che apre un modal centrale: il form non sta più
 * in pagina, la pagina resta un archivio dei contributi e l'invito a
 * contribuire è un gesto, non un blocco. Input sempre a bordi arrotondati
 * (rounded-full / rounded-2xl), mai quadrati.
 *
 * Manda a /api/feedback, che salva il messaggio in KV per la review.
 */

const COPY = {
  success:
    "Received. I read every submission: if it holds up, it gets published here, with your name or just an initial, your choice.",
  genericError: "Something broke on my side. Try again in a minute.",
  rateLimited: "Too many submissions. Try again in a few minutes.",
  tooShort: "Give me a little more: what would you change, and why?",
  invalidEmail: "That email doesn't look right.",
};

export function FeedbackModalButton({
  label = "Give feedback",
  variant = "solid",
  className = "",
}: {
  label?: string;
  variant?: "solid" | "outline";
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [companyWebsite, setCompanyWebsite] = useState("");
  const [state, setState] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [error, setError] = useState("");
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function close() {
    setOpen(false);
    if (state === "success") {
      // Ripulita alla chiusura dopo un invio: il prossimo modal è vuoto.
      setName(""); setEmail(""); setMessage("");
      setState("idle"); setError("");
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = message.trim();
    if (trimmed.length < 20) {
      setState("error");
      setError(COPY.tooShort);
      return;
    }
    if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim())) {
      setState("error");
      setError(COPY.invalidEmail);
      return;
    }

    setState("loading");
    setError("");
    try {
      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          message: trimmed,
          company_website: companyWebsite,
          page_url: window.location.pathname,
        }),
      });
      if (response.ok) {
        setState("success");
      } else if (response.status === 429) {
        setState("error");
        setError(COPY.rateLimited);
      } else {
        setState("error");
        setError(COPY.genericError);
      }
    } catch {
      setState("error");
      setError(COPY.genericError);
    }
  }

  const baseTrigger =
    variant === "solid"
      ? "rounded-full bg-gray-1200 px-6 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-80"
      : "rounded-full border border-gray-300 bg-white px-6 py-2.5 text-sm font-semibold text-gray-1200 transition-colors hover:border-gray-1200";
  const field =
    "w-full rounded-full border border-gray-300 bg-transparent px-5 py-2.5 text-[15px] text-gray-1200 outline-none transition-colors placeholder:text-gray-1000/60 focus:border-gray-1200 disabled:opacity-60";

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={`${baseTrigger} ${className}`}>
        {label}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-gray-1200/40 p-4 sm:p-6"
          onClick={close}
          role="presentation"
        >
          <div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-label="Send your feedback"
            className="w-full max-w-[460px] rounded-3xl bg-white p-6 shadow-[0_24px_80px_rgba(0,0,0,0.24)] sm:p-8"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-serif text-2xl leading-tight text-gray-1200">Give feedback</p>
                <p className="mt-1 text-sm leading-relaxed text-gray-1000">
                  Attack it, or tell me what&apos;s missing.
                </p>
              </div>
              <button
                type="button"
                ref={closeRef}
                onClick={close}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xl leading-none text-gray-1000 transition-colors hover:bg-gray-200"
                aria-label="Close"
              >
                ×
              </button>
            </div>

            {state === "success" ? (
              <div role="status" aria-live="polite" className="mt-6">
                <p className="font-serif text-lg leading-relaxed text-gray-1200">{COPY.success}</p>
                <button
                  type="button"
                  onClick={close}
                  className="mt-5 rounded-full bg-gray-1200 px-5 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-80"
                >
                  Done
                </button>
              </div>
            ) : (
              <form onSubmit={submit} noValidate className="mt-6 flex flex-col gap-3">
                {/* Honeypot: invisibile a chi legge, pieno per i bot. */}
                <input
                  type="text"
                  tabIndex={-1}
                  autoComplete="off"
                  aria-hidden="true"
                  className="sr-only"
                  name="company_website"
                  value={companyWebsite}
                  onChange={(e) => setCompanyWebsite(e.target.value)}
                />
                <input
                  type="text"
                  placeholder="Name (optional)"
                  aria-label="Name, optional"
                  autoComplete="name"
                  maxLength={80}
                  className={field}
                  name="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={state === "loading"}
                />
                <input
                  type="email"
                  placeholder="Email (optional)"
                  aria-label="Email, optional"
                  autoComplete="email"
                  inputMode="email"
                  maxLength={254}
                  className={field}
                  name="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={state === "loading"}
                />
                <textarea
                  placeholder="What would you attack, what's missing, what's wrong?"
                  aria-label="Your feedback"
                  rows={5}
                  maxLength={4000}
                  required
                  className="w-full resize-y rounded-2xl border border-gray-300 bg-transparent px-5 py-3 text-[15px] leading-relaxed text-gray-1200 outline-none transition-colors placeholder:text-gray-1000/60 focus:border-gray-1200 disabled:opacity-60"
                  name="message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  disabled={state === "loading"}
                />
                <div className="mt-1 flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
                  <p role="status" aria-live="polite" className="min-h-5 max-w-[240px] text-xs leading-relaxed text-gray-1000">
                    {state === "error" ? error : "Reviewed by Mattia, published if it holds."}
                  </p>
                  <button
                    type="submit"
                    disabled={state === "loading"}
                    className="min-h-11 shrink-0 rounded-full bg-gray-1200 px-6 text-sm font-semibold text-white transition-opacity hover:opacity-80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-gray-1200 disabled:cursor-wait disabled:opacity-50"
                  >
                    {state === "loading" ? "Sending" : "Send feedback"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
