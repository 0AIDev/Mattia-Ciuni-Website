"use client";

import { useEffect, useSyncExternalStore } from "react";

const MEASUREMENT_ID = "G-YQS0R94ZQP";
const CONSENT_KEY = "mattia-ciuni-analytics-consent";

type Gtag = (...args: unknown[]) => void;

declare global {
  interface Window {
    dataLayer: unknown[];
    gtag?: Gtag;
  }
}

function sourceData() {
  const params = new URLSearchParams(window.location.search);
  const referrer = document.referrer;
  let source = params.get("utm_source") || "";
  let medium = params.get("utm_medium") || "";
  const campaign = params.get("utm_campaign") || "";
  const content = params.get("utm_content") || "";
  const term = params.get("utm_term") || "";
  const clickId = ["gclid", "gbraid", "wbraid", "fbclid", "ttclid", "msclkid", "li_fat_id"].find((key) => params.has(key));

  if (clickId && !medium) medium = "paid";
  if (!source && referrer) {
    try {
      const host = new URL(referrer).hostname;
      source = host.replace(/^www\./, "");
      medium = medium || (host.includes("google.") || host.includes("bing.") ? "organic_search" : "referral");
    } catch {
      source = "referral";
    }
  }

  return {
    source: source || "direct",
    medium: medium || "none",
    campaign: campaign || "(not set)",
    content: content || "(not set)",
    term: term || "(not set)",
    referrer_domain: referrer ? (() => {
      try { return new URL(referrer).hostname; } catch { return ""; }
    })() : "(none)",
    landing_page: `${window.location.pathname}${window.location.search}`,
  };
}

function loadAnalytics() {
  if (document.querySelector(`script[data-ga="${MEASUREMENT_ID}"]`)) return;
  window.dataLayer = window.dataLayer || [];
  window.gtag = (...args: unknown[]) => window.dataLayer.push(args);
  window.gtag("consent", "default", { ad_storage: "denied", analytics_storage: "granted", ad_user_data: "denied", ad_personalization: "denied" });
  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${MEASUREMENT_ID}`;
  script.dataset.ga = MEASUREMENT_ID;
  document.head.appendChild(script);
  window.gtag("js", new Date());
  window.gtag("config", MEASUREMENT_ID, { anonymize_ip: true, send_page_view: false });
  const attribution = sourceData();
  const firstTouch = window.localStorage.getItem("mattia-ciuni-first-touch");
  if (!firstTouch) {
    window.localStorage.setItem("mattia-ciuni-first-touch", JSON.stringify({ ...attribution, date: new Date().toISOString() }));
  }
  const sessionKey = "mattia-ciuni-traffic-source-sent";
  if (!window.sessionStorage.getItem(sessionKey)) {
    window.sessionStorage.setItem(sessionKey, "1");
    window.gtag("event", "traffic_source", { ...attribution, first_touch: firstTouch || JSON.stringify(attribution) });
  }
  window.gtag("event", "page_view", { page_location: window.location.href, page_title: document.title });

  const onClick = (event: MouseEvent) => {
    const target = (event.target as HTMLElement).closest("a,button");
    if (!target || !window.gtag) return;
    const href = target instanceof HTMLAnchorElement ? target.href : "";
    window.gtag("event", target instanceof HTMLAnchorElement && target.origin !== window.location.origin ? "outbound_click" : "cta_click", {
      link_text: (target.textContent || "").trim().slice(0, 80),
      link_url: href || undefined,
      outbound: href && target instanceof HTMLAnchorElement && target.origin !== window.location.origin ? 1 : 0,
    });
  };
  document.addEventListener("click", onClick, { passive: true });
  return () => document.removeEventListener("click", onClick);
}

const subscribeConsent = (onChange: () => void) => {
  window.addEventListener("storage", onChange);
  window.addEventListener("mattia-analytics-consent", onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener("mattia-analytics-consent", onChange);
  };
};
type ConsentState = "loading" | "unset" | "accepted" | "declined";
const getConsent = (): ConsentState => {
  const saved = window.localStorage.getItem(CONSENT_KEY);
  return saved === "accepted" || saved === "declined" ? saved : "unset";
};
// Keep the server and hydration render intentionally empty. Reading localStorage
// only after hydration prevents the consent banner from flashing for returning
// visitors who already chose an option.
const getServerConsent = (): ConsentState => "loading";

export function GoogleAnalytics() {
  const consent = useSyncExternalStore(subscribeConsent, getConsent, getServerConsent);

  useEffect(() => {
    if (consent === "accepted") loadAnalytics();
  }, [consent]);

  function choose(value: "accepted" | "declined") {
    window.localStorage.setItem(CONSENT_KEY, value);
    window.dispatchEvent(new Event("mattia-analytics-consent"));
  }

  if (consent !== "unset") return null;
  return (
    <aside aria-label="Analytics choice" className="fixed inset-x-4 bottom-4 z-50 mx-auto flex max-w-xl items-center justify-between gap-4 rounded-2xl border border-gray-300 bg-white p-4 text-sm text-gray-1000 shadow-lg">
      <p className="m-0 leading-relaxed">Help me understand which pages are useful. Analytics are anonymous and optional.</p>
      <div className="flex shrink-0 gap-2">
        <button type="button" onClick={() => choose("declined")} className="rounded-full px-3 py-2 text-xs underline decoration-gray-400 underline-offset-4">No thanks</button>
        <button type="button" onClick={() => choose("accepted")} className="rounded-full bg-gray-1200 px-3 py-2 text-xs font-semibold text-white">Allow</button>
      </div>
    </aside>
  );
}
