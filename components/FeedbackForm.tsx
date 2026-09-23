"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { currentPath, track } from "@/lib/analytics";
import type { Locale } from "@/lib/i18n";
import { feedbackUi } from "@/lib/feedback-ui";

/**
 * Il pulsante "Give feedback" che apre un modal centrale: il form non sta più
 * in pagina, la pagina resta un archivio dei contributi e l'invito a
 * contribuire è un gesto, non un blocco. Input sempre a bordi arrotondati
 * (rounded-full / rounded-2xl), mai quadrati.
 *
 * Manda a /api/feedback, che salva il messaggio in KV per la review.
 */


export function FeedbackModalButton({
  label = "Give feedback",
  variant = "solid",
  className = "",
  locale = "en",
}: {
  label?: string;
  variant?: "solid" | "outline";
  className?: string;
  locale?: Locale;
}) {
  const text = feedbackUi[locale];
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [companyWebsite, setCompanyWebsite] = useState("");
  const [state, setState] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [error, setError] = useState("");
  // Da dove parte il feedback: la pagina /feedback o un post pubblicato. Serve
  // a sapere quale pagina convince a scrivere, invece di sommare tutto.
  const formLocation = currentPath().kind;
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const interactedFields = useRef(new Set<string>());

  function fieldFocus(field: string) {
    if (interactedFields.current.has(field)) return;
    interactedFields.current.add(field);
    track("form_field_interaction", { form_id: "feedback", field, form_location: formLocation });
    track("form_start", { form_id: "feedback", form_location: formLocation });
  }

  useEffect(() => {
    if (!open) return;
    const trigger = triggerRef.current;
    const scrollY = window.scrollY;
    const body = document.body;
    body.style.position = "fixed";
    body.style.top = `-${scrollY}px`;
    body.style.left = "0";
    body.style.right = "0";
    body.style.width = "100%";
    body.style.overflow = "hidden";
    closeRef.current?.focus();
    const onViewportResize = () => {
      const active = document.activeElement;
      if (active instanceof HTMLElement && dialogRef.current?.contains(active)) {
        window.requestAnimationFrame(() => active.scrollIntoView({ block: "center", inline: "nearest" }));
      }
    };
    window.visualViewport?.addEventListener("resize", onViewportResize);
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        return;
      }
      if (event.key !== "Tab" || !dialogRef.current) return;
      const focusable = dialogRef.current.querySelectorAll<HTMLElement>("button:not([disabled]), input:not([disabled]), textarea:not([disabled])");
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.visualViewport?.removeEventListener("resize", onViewportResize);
      body.style.position = "";
      body.style.top = "";
      body.style.left = "";
      body.style.right = "";
      body.style.width = "";
      body.style.overflow = "";
      window.scrollTo(0, scrollY);
      window.removeEventListener("keydown", onKey);
      trigger?.focus();
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
      setError(text.tooShort);
      track("form_error", { form_id: "feedback", reason: "too_short", form_location: formLocation });
      track("feedback_error", { reason: "too_short", form_location: formLocation });
      return;
    }
    if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim())) {
      setState("error");
      setError(text.invalidEmail);
      track("form_error", { form_id: "feedback", reason: "invalid_email", form_location: formLocation });
      track("feedback_error", { reason: "invalid_email", form_location: formLocation });
      return;
    }

    setState("loading");
    setError("");
    track("form_submit", { form_id: "feedback", form_location: formLocation });
    try {
      const controller = new AbortController();
      const timeout = window.setTimeout(() => controller.abort(), 15000);
      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          message: trimmed,
          company_website: companyWebsite,
          page_url: window.location.pathname,
        }),
      });
      window.clearTimeout(timeout);
      const result = (await response.json().catch(() => ({}))) as { code?: string };
      if (response.ok) {
        setState("success");
        track("form_success", { form_id: "feedback", form_location: formLocation });
        // Il numero che conta non è quanti aprono la pagina, ma quanti
        // scrivono: senza questo evento le conversioni vere restano invisibili.
        track("feedback_submitted", {
          form_location: formLocation,
          has_email: email.trim() ? "yes" : "no",
          has_name: name.trim() ? "yes" : "no",
          length: trimmed.length,
        });
      } else if (response.status === 429) {
        setState("error");
        setError(text.rateLimited);
        track("form_error", { form_id: "feedback", reason: "rate_limited", form_location: formLocation });
        track("feedback_error", { reason: "rate_limited", form_location: formLocation });
      } else {
        setState("error");
        setError(
          result.code === "unavailable" || result.code === "rate_limit_unavailable"
            ? text.genericError
            : result.code === "provider_error"
              ? text.genericError
              : text.genericError,
        );
        track("form_error", { form_id: "feedback", reason: result.code || "server", form_location: formLocation });
        track("feedback_error", { reason: result.code || "server", form_location: formLocation });
      }
    } catch (caught) {
      setState("error");
      const aborted = caught instanceof DOMException && caught.name === "AbortError";
      setError(aborted ? text.genericError : text.genericError);
      track("form_error", { form_id: "feedback", reason: aborted ? "timeout" : "network", form_location: formLocation });
      track("feedback_error", { reason: aborted ? "timeout" : "network", form_location: formLocation });
    }
  }

  const baseTrigger =
    variant === "solid"
      ? "rounded-full bg-gray-1200 px-6 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-80"
      : "rounded-full border border-gray-300 bg-white px-6 py-2.5 text-sm font-semibold text-gray-1200 transition-colors hover:border-gray-1200";
  const field =
    "min-h-11 w-full appearance-none rounded-full border border-gray-400 bg-white px-5 py-2.5 text-base text-gray-1200 shadow-none outline-none transition-colors placeholder:text-gray-1000/60 hover:border-gray-1000 focus:border-gray-1200 focus:outline-none focus-visible:outline-none disabled:opacity-60";

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => {
          setOpen(true);
          track("feedback_open", { form_location: formLocation, trigger: label });
        }}
        className={`${baseTrigger} ${className}`}
      >
        {label}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center overscroll-contain overflow-y-auto bg-gray-1200/40 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:items-center sm:p-6"
          onClick={close}
          role="presentation"
        >
          <div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="feedback-dialog-title"
            aria-describedby="feedback-dialog-description"
            className="my-auto max-h-[calc(100dvh-1.5rem)] w-full max-w-[460px] overflow-y-auto overscroll-contain rounded-3xl bg-white p-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] shadow-[0_24px_80px_rgba(0,0,0,0.24)] sm:p-8"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="text-left">
                <h2 id="feedback-dialog-title" className="m-0 font-serif text-2xl leading-tight text-gray-1200">{text.title}</h2>
                <p id="feedback-dialog-description" className="mt-1 text-sm leading-relaxed text-gray-1000">
                  {text.description}
                </p>
              </div>
              <button
                type="button"
                ref={closeRef}
                onClick={close}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xl leading-none text-gray-1000"
                aria-label={text.close}
              >
                ×
              </button>
            </div>

                    {state === "success" ? (
              <div role="status" aria-live="polite" className="mt-6 rounded-2xl bg-gray-100 px-5 py-5">
                <p className="font-sans text-sm font-semibold text-gray-1200">{text.successTitle}</p>
                <p className="mt-2 font-serif text-lg leading-relaxed text-gray-1200">{text.success}</p>
                <button
                  type="button"
                  onClick={close}
                  className="mt-5 rounded-full bg-gray-1200 px-5 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-80">{text.done}</button>
              </div>
            ) : (
              <form onSubmit={submit} onFocus={(event) => fieldFocus((event.target as unknown as HTMLInputElement).name || "message")} noValidate aria-busy={state === "loading"} className="mt-6 flex flex-col gap-3">
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
                  placeholder={text.name}
                  aria-label={text.name}
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
                  placeholder={text.email}
                  aria-label={text.email}
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
                  placeholder={text.message}
                  aria-label={text.message}
                  rows={5}
                  maxLength={4000}
                  required
                  className="min-h-32 w-full appearance-none resize-y rounded-2xl border border-gray-400 bg-white px-5 py-3 text-base leading-relaxed text-gray-1200 shadow-none outline-none transition-colors placeholder:text-gray-1000/60 hover:border-gray-1000 focus:border-gray-1200 focus:outline-none focus-visible:outline-none disabled:opacity-60"
                  name="message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  disabled={state === "loading"}
                />
                <div className="mt-1 flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
                  <p role="status" aria-live="polite" className="min-h-5 max-w-[240px] text-xs leading-relaxed text-gray-1000">
                    {state === "error" ? error : "{text.reviewed}"}
                  </p>
                  <button
                    type="submit"
                    disabled={state === "loading"}
                    className="min-h-11 shrink-0 rounded-full bg-gray-1200 px-6 text-sm font-semibold text-white transition-opacity hover:opacity-80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-gray-1200 disabled:cursor-wait disabled:opacity-50"
                  >
                    {state === "loading" ? text.sending : text.send}
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
