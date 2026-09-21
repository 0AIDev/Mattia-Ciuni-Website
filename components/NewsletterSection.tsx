"use client";

import { FormEvent, useState, useSyncExternalStore } from "react";

const COPY = {
  success:
    "You're in. Check your inbox for the Welcome email, then you'll get the story so far while you wait for Sunday.",
  genericError: "Something broke on my side. Try again in a minute.",
  duplicate: "You're already on the list. See you Sunday.",
};
const SUBSCRIBED_KEY = "mattia-ciuni-newsletter-subscribed";
const subscribeToStorage = (onChange: () => void) => {
  window.addEventListener("storage", onChange);
  return () => window.removeEventListener("storage", onChange);
};
const hasSubscribed = () => window.localStorage.getItem(SUBSCRIBED_KEY) === "1";
const hasNotSubscribed = () => false;

export function NewsletterSection() {
  const [email, setEmail] = useState("");
  const [companyWebsite, setCompanyWebsite] = useState("");
  const [state, setState] = useState<"idle" | "loading" | "success" | "error" | "duplicate">("idle");
  const [error, setError] = useState("");
  const [ignoreRemembered, setIgnoreRemembered] = useState(false);
  const remembered = useSyncExternalStore(subscribeToStorage, hasSubscribed, hasNotSubscribed);
  const displayState = !ignoreRemembered && remembered && state === "idle" ? "duplicate" : state;

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
      const params = new URLSearchParams(window.location.search);
      const referrer = document.referrer;
      const clickId = ["gclid", "gbraid", "wbraid", "fbclid", "ttclid", "msclkid", "li_fat_id"].find((key) => params.has(key));
      let source = params.get("utm_source") || "";
      let medium = params.get("utm_medium") || "";
      if (clickId && !medium) medium = "paid";
      if (!source && referrer) {
        try {
          source = new URL(referrer).hostname.replace(/^www\\./, "");
          medium = medium || (source.includes("google.") || source.includes("bing.") ? "organic_search" : "referral");
        } catch {
          source = "referral";
        }
      }
      const response = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: normalized,
          company_website: companyWebsite,
          source: source || "direct",
          medium: medium || "none",
          campaign: params.get("utm_campaign") || "",
          content: params.get("utm_content") || "",
          term: params.get("utm_term") || "",
          landing_page: `${window.location.pathname}${window.location.search}`,
          referrer,
        }),
      });
      const result = (await response.json().catch(() => ({}))) as { code?: string };
      if (response.ok) {
        window.localStorage.setItem(SUBSCRIBED_KEY, "1");
        setState("success");
      } else if (response.status === 409 || result.code === "already_subscribed") {
        window.localStorage.setItem(SUBSCRIBED_KEY, "1");
        setState("duplicate");
      } else {
        setState("error");
        setError(result.code === "rate_limited" ? "Too many attempts. Try again in a minute." : COPY.genericError);
      }
    } catch {
      setState("error");
      setError(COPY.genericError);
    }
  }

  function useAnotherEmail() {
    window.localStorage.removeItem(SUBSCRIBED_KEY);
    setIgnoreRemembered(true);
    setEmail("");
    setState("idle");
  }

  return (
    <section aria-labelledby="newsletter-title" className="mx-auto mb-14 max-w-[692px] px-5 sm:mb-24 sm:px-6">
      <div className="mx-auto max-w-[560px]">
        <h2 id="newsletter-title" className="max-w-[30rem] text-balance font-serif text-xl leading-[1.18] text-gray-1200 sm:text-3xl sm:leading-tight">
          Every Sunday I send one email: what I shipped, what broke, what I decided and why.
        </h2>
        <p className="mt-3 max-w-[520px] text-[15px] leading-[1.55] text-gray-1000 sm:text-base sm:leading-relaxed">
          Building Payle in public, from Italy to San Francisco. No spam, no growth hacks. Just the log.
        </p>

        {displayState === "success" ? (
          <div className="mt-7" role="status" aria-live="polite">
            <p className="font-serif text-lg leading-relaxed text-gray-1200 sm:text-xl">
              You&apos;re in. Check your inbox for the <strong>Welcome</strong> email, then you&apos;ll get the story so far while you wait for Sunday.
            </p>
          </div>
        ) : displayState === "duplicate" ? (
          <div className="mt-7" role="status" aria-live="polite">
            <p className="font-serif text-lg leading-relaxed text-gray-1200 sm:text-xl">{COPY.duplicate}</p>
            <button type="button" onClick={useAnotherEmail} className="mt-3 text-xs text-gray-1000 underline decoration-gray-400 underline-offset-4 hover:text-gray-1200">
              Use another email
            </button>
          </div>
        ) : (
          <>
            <div className="mt-6 w-full max-w-[520px] rounded-full border border-gray-300 p-1 transition-colors focus-within:border-gray-1200 focus-within:ring-2 focus-within:ring-gray-1200/15 sm:mt-7">
              <form
                onSubmit={submit}
                className="flex w-full min-w-0 flex-row items-center gap-1 sm:gap-2"
                noValidate
              >
              <label htmlFor="newsletter-email" className="sr-only">Email address</label>
              <input
                id="newsletter-email"
                name="email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="your@email.com"
                autoComplete="email"
                inputMode="email"
                aria-invalid={state === "error"}
                aria-describedby={state === "error" ? "newsletter-status" : undefined}
                disabled={state === "loading"}
                className="newsletter-email min-h-11 min-w-0 flex-1 rounded-full border-0 bg-transparent px-3 py-2 text-[15px] text-gray-1200 outline-none placeholder:text-gray-1000/60 focus:outline-none focus:ring-0 disabled:opacity-60 sm:px-4 sm:text-base"
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
                className="min-h-11 shrink-0 whitespace-nowrap rounded-full bg-gray-1200 px-4 text-sm font-semibold text-white transition-opacity hover:opacity-80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-gray-1200 disabled:cursor-wait disabled:opacity-50 sm:px-5"
              >
                {state === "loading" ? "Subscribing..." : "Subscribe"}
              </button>
              </form>
            </div>
            <p id="newsletter-status" role="status" aria-live="polite" className="mt-3 min-h-5 text-sm text-gray-1000">
              {state === "error" ? error : ""}
            </p>
          </>
        )}

        <p className="mt-4 max-w-[520px] text-[13px] leading-[1.55] text-gray-1000 sm:mt-5 sm:leading-relaxed">
          One email a week. Unsubscribe anytime. No data sharing, ever. Your voice never leaves your phone either. {" "}
          <a href="/privacy/" className="underline decoration-gray-400 underline-offset-4 hover:text-gray-1200">privacy</a>
        </p>
      </div>
    </section>
  );
}
