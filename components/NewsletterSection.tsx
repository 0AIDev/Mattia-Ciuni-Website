"use client";

import { FormEvent, useState } from "react";

const COPY = {
  success:
    "Check your inbox — one click to confirm. Then you'll get the story so far while you wait for Sunday.",
  genericError: "Something broke on my side. Try again in a minute.",
  duplicate: "You're already on the list. See you Sunday.",
};

export function NewsletterSection() {
  const [email, setEmail] = useState("");
  const [companyWebsite, setCompanyWebsite] = useState("");
  const [state, setState] = useState<"idle" | "loading" | "success" | "error" | "duplicate">("idle");
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalized = email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(normalized)) {
      setState("error");
      setError("That email doesn't look right.");
      return;
    }

    setState("loading");
    setError("");
    try {
      const response = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: normalized, company_website: companyWebsite }),
      });
      const result = (await response.json().catch(() => ({}))) as { code?: string };
      if (response.ok) {
        setState("success");
      } else if (response.status === 409 || result.code === "already_subscribed") {
        setState("duplicate");
      } else {
        setState("error");
        setError(COPY.genericError);
      }
    } catch {
      setState("error");
      setError(COPY.genericError);
    }
  }

  return (
    <section
      aria-labelledby="sundays-title"
      className="mx-auto mb-16 max-w-[692px] px-6 sm:mb-24"
    >
      <div className="relative overflow-hidden rounded-3xl bg-gray-1200 px-5 py-9 text-white sm:px-10 sm:py-12">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"
        />
        <div className="relative mx-auto flex max-w-[560px] flex-col items-center text-center">
          <p className="mb-4 text-[13px] uppercase tracking-[0.14em] text-white/40">Sundays</p>
          <h2 id="sundays-title" className="text-balance font-serif text-2xl leading-tight text-white sm:text-3xl">
            Every Sunday I send one email: what I shipped, what broke, what I decided and why.
          </h2>
          <p className="mt-4 max-w-[520px] text-sm leading-relaxed text-white/70 sm:text-base">
            Building Payle in public, from Italy to San Francisco. No spam, no growth hacks. Just the log.
          </p>

          {state === "success" ? (
            <p role="status" aria-live="polite" className="mt-7 text-sm leading-relaxed text-white/85">
              Check your inbox — one click to <strong>confirm</strong>. Then you&apos;ll get the story so far while you wait for Sunday.
            </p>
          ) : state === "duplicate" ? (
            <p role="status" aria-live="polite" className="mt-7 text-sm leading-relaxed text-white/85">{COPY.duplicate}</p>
          ) : (
            <form onSubmit={submit} className="mt-7 w-full max-w-[520px]" noValidate>
              <div className="relative flex flex-col gap-3 rounded-full border border-white/10 bg-white/[0.04] p-1.5 sm:flex-row sm:items-center">
                <label htmlFor="sundays-email" className="sr-only">Email address</label>
                <input
                  id="sundays-email"
                  name="email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="your@email.com"
                  autoComplete="email"
                  inputMode="email"
                  aria-invalid={state === "error"}
                  aria-describedby={state === "error" ? "sundays-status" : undefined}
                  disabled={state === "loading"}
                  className="min-h-11 w-full rounded-full border-0 border-b border-white/30 bg-transparent px-4 py-2.5 text-base text-[#F4F7FC] outline-none placeholder:text-white/40 focus:border-[#58A6FF] focus:ring-0 disabled:opacity-60 sm:min-h-[52px] sm:flex-1"
                />
                <input
                  type="text"
                  name="company_website"
                  value={companyWebsite}
                  onChange={(event) => setCompanyWebsite(event.target.value)}
                  tabIndex={-1}
                  autoComplete="off"
                  aria-hidden="true"
                  className="sr-only"
                />
                <button
                  type="submit"
                  disabled={state === "loading"}
                  className="min-h-11 shrink-0 rounded-full px-5 text-sm font-semibold text-[#F4F7FC] transition-colors hover:bg-white/10 hover:underline focus-visible:outline-white disabled:cursor-wait disabled:opacity-60 sm:px-6"
                >
                  {state === "loading" ? "Subscribing..." : "Subscribe"}
                </button>
              </div>
              <p id="sundays-status" role="status" aria-live="polite" className="mt-3 min-h-5 text-center text-sm text-white/60">
                {state === "error" ? error : ""}
              </p>
            </form>
          )}

          <p className="mt-5 text-[13px] leading-relaxed text-white/40">
            One email a week. Unsubscribe anytime. No data sharing, ever. Your voice never leaves your phone either. {" "}
            <a href="/privacy/" className="text-white/60 underline decoration-white/20 underline-offset-4 hover:text-white">privacy</a>
          </p>
        </div>
      </div>
    </section>
  );
}
