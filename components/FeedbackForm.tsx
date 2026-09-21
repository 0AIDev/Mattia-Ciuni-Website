"use client";

import { FormEvent, useState } from "react";

/**
 * Il form di submission della sezione /feedback/: sostituisce il link email.
 * Manda a /api/feedback, che salva il messaggio in KV per la review.
 * Stessa grammatica minimal del form della newsletter: pill, bordo che si
 * stringe al focus, stato su `role="status"`.
 */

const COPY = {
  success:
    "Received. I read every submission: if it holds up, it gets published here, with your name or just an initial, your choice.",
  genericError: "Something broke on my side. Try again in a minute.",
  rateLimited: "Too many submissions. Try again in a few minutes.",
  tooShort: "Give me a little more: what would you change, and why?",
  invalidEmail: "That email doesn't look right.",
};

export function FeedbackForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [companyWebsite, setCompanyWebsite] = useState("");
  const [state, setState] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [error, setError] = useState("");

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

  if (state === "success") {
    return (
      <div role="status" aria-live="polite" className="mt-6">
        <p className="font-serif text-lg leading-relaxed text-gray-1200 sm:text-xl">{COPY.success}</p>
      </div>
    );
  }

  return (
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
      <div className="flex flex-col gap-3 sm:flex-row">
        <input
          type="text"
          placeholder="Name (optional)"
          aria-label="Name, optional"
          autoComplete="name"
          maxLength={80}
          className="min-h-11 w-full rounded-2xl border border-gray-300 bg-transparent px-4 text-[15px] text-gray-1200 outline-none transition-colors placeholder:text-gray-1000/60 focus:border-gray-1200 sm:flex-1"
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
          className="min-h-11 w-full rounded-2xl border border-gray-300 bg-transparent px-4 text-[15px] text-gray-1200 outline-none transition-colors placeholder:text-gray-1000/60 focus:border-gray-1200 sm:flex-1"
          name="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={state === "loading"}
        />
      </div>
      <textarea
        placeholder="What would you attack, what's missing, what's wrong?"
        aria-label="Your feedback"
        rows={4}
        maxLength={4000}
        required
        className="w-full resize-y rounded-2xl border border-gray-300 bg-transparent px-4 py-3 text-[15px] leading-relaxed text-gray-1200 outline-none transition-colors placeholder:text-gray-1000/60 focus:border-gray-1200"
        name="message"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        disabled={state === "loading"}
      />
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <button
          type="submit"
          disabled={state === "loading"}
          className="min-h-11 rounded-full bg-gray-1200 px-6 text-sm font-semibold text-white transition-opacity hover:opacity-80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-gray-1200 disabled:cursor-wait disabled:opacity-50"
        >
          {state === "loading" ? "Sending" : "Send feedback"}
        </button>
        <p id="feedback-status" role="status" aria-live="polite" className="min-h-5 text-sm text-gray-1000">
          {state === "error" ? error : "Reviewed by Mattia, published if it holds."}
        </p>
      </div>
    </form>
  );
}
