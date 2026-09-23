"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";
import { usePathname } from "next/navigation";
import { contentKindOf, currentPath, flushCollect, markPageEnter, markScroll, noteNextPage, pageLeavePayload, track, type Gtag } from "@/lib/analytics";
import { attributionParams, captureAttribution } from "@/lib/attribution";

const MEASUREMENT_ID = "G-YQS0R94ZQP";
const CONSENT_EVENT_KEY = "mattia-ciuni-consent-event-v1";
const CONSENT_KEY = "mattia-ciuni-analytics-consent";

/**
 * La forma del comando conta piu' del comando.
 *
 * gtag.js esegue una entry di `dataLayer` solo se e' un oggetto `arguments`:
 * un array viene letto come evento di dataLayer (roba da GTM) e non eseguito.
 * Con la versione precedente, che spingeva il rest parameter come array,
 * succedeva esattamente questo: il container partiva, gli eventi finivano in
 * `dataLayer`, `gtm.dom` e `gtm.load` scattavano, e nessuna richiesta verso
 * google-analytics veniva mai fatta. Zero conversioni, zero errori, nessun modo di accorgersene
 * se non aprendo la finestra e guardando dentro `dataLayer`.
 *
 * Verificato sul campo con due pagine identiche, stesso ID, stesso browser,
 * stessa CSP: con `arguments` partono due hit a region1.google-analytics.com,
 * con un array costruito a mano nessuna. Per questo qui si usa `arguments`
 * invece del rest parameter, che e' l'unica differenza che conta.
 */
function pushCommand(this: unknown) {
  // eslint-disable-next-line prefer-rest-params
  window.dataLayer.push(arguments);
}

function loadAnalytics() {
  if (document.querySelector(`script[data-ga="${MEASUREMENT_ID}"]`)) return;
  window.dataLayer = window.dataLayer || [];
  window.gtag = pushCommand as unknown as Gtag;
  window.gtag("consent", "default", { ad_storage: "denied", analytics_storage: "granted", ad_user_data: "denied", ad_personalization: "denied" });
  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${MEASUREMENT_ID}`;
  script.dataset.ga = MEASUREMENT_ID;
  document.head.appendChild(script);
  window.gtag("js", new Date());
  // `send_page_view: false` perché il page_view lo mandiamo noi, con il tipo di
  // contenuto. Niente `anonymize_ip`: era un parametro di Universal Analytics,
  // GA4 ignora gli IP per progetto, e in ogni evento compariva solo come
  // `ep.anonymize_ip=true`, cioe' rumore che sembra una garanzia e non lo e'.
  window.gtag("config", MEASUREMENT_ID, { send_page_view: false });
  return;
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
  const pathname = usePathname();
  // La prima pagina la manda `loadAnalytics`, in coda a `config`; le successive
  // le manda questo effetto. Prima nessuna navigazione client-side produceva un
  // page_view: il sito è un export statico, ma i link interni sono `next/link`,
  // quindi da `Thoughts` a un articolo il browser non ricaricava niente e GA non
  // vedeva la pagina nuova.
  const seenPath = useRef<string | null>(null);

  useEffect(() => {
    const allowed = consent === "accepted";
    const params = attributionParams(allowed);
    const captured = captureAttribution(allowed);
    const sessionKey = "mattia-ciuni-traffic-source-sent-v2";
    if (!window.sessionStorage.getItem(sessionKey)) {
      window.sessionStorage.setItem(sessionKey, "1");
      track("traffic_source", {
        ...params,
        first_source: captured.first.source,
        first_medium: captured.first.medium,
        first_campaign: captured.first.campaign,
        first_landing_page: captured.first.landing_page,
        last_source: captured.last.source,
        last_medium: captured.last.medium,
        last_campaign: captured.last.campaign,
        last_landing_page: captured.last.landing_page,
      });
    }
    if (allowed) loadAnalytics();
    const pageView = {
      page_location: window.location.href,
      page_title: document.title,
      content_kind: contentKindOf(window.location.pathname),
      from_path: "(entry)",
      attribution: params,
      first_touch: captured.first,
      last_touch: captured.last,
    };
    markPageEnter();
    if (!window.sessionStorage.getItem("mattia-ciuni-page-view-sent-v2")) {
      window.sessionStorage.setItem("mattia-ciuni-page-view-sent-v2", "1");
      track("page_view", pageView);
    } else if (allowed) {
      // Il consenso può arrivare dopo il primo page view: in quel caso GA riceve
      // la pagina senza duplicare Umami o la copia Supabase.
      window.gtag?.("event", "page_view", pageView);
    }
  }, [consent]);

  // Una nuova URL con UTM durante una navigazione client-side aggiorna il last
  // touch senza riscrivere il first touch.
  useEffect(() => {
    captureAttribution(consent === "accepted");
  }, [pathname, consent]);

  // I click sono first-party e devono essere raccolti anche quando una persona
  // rifiuta GA: Umami e Supabase restano indipendenti dal consenso GA.
  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      const target = (event.target as HTMLElement).closest("a,button");
      if (!target) return;
      const href = target instanceof HTMLAnchorElement ? target.href : "";
      const isAnchor = target instanceof HTMLAnchorElement;
      const outbound = isAnchor && target.origin !== window.location.origin;
      const isEmail = href.startsWith("mailto:");
      const text = (isEmail ? "email" : target.textContent || "").trim().slice(0, 80);
      const destination = isEmail ? "email" : href ? (() => { try { return new URL(href).hostname.replace(/^www\./, ""); } catch { return ""; } })() : "";
      const ctaId = (target as HTMLElement).dataset.analyticsId || text.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "").slice(0, 64) || "unnamed";
      const params = { cta_id: ctaId, cta_text: text, cta_location: target.closest("[data-analytics-location]")?.getAttribute("data-analytics-location") || currentPath().kind, destination, link_url: isEmail ? "mailto:" : href || undefined, content_kind: currentPath().kind };
      if (href) noteNextPage(href);
      track("navigation_click", params);
      if (outbound) track("outbound_click", { ...params, outbound: 1 });
      else track("cta_click", params);
      if (isEmail) track("email_click", { cta_id: ctaId, destination: "email", content_kind: currentPath().kind });
      if (/github\.com|linkedin\.com|x\.com|instagram\.com|crunchbase\.com/i.test(destination)) track("social_click", { cta_id: ctaId, destination, content_kind: currentPath().kind });
    };
    document.addEventListener("click", onClick, { passive: true });
    return () => document.removeEventListener("click", onClick);
  }, []);

  // Nessuna guardia sul consenso: se Analytics non è caricato, `track()` non
  // trova `window.gtag` e scarta l'evento da sé, mentre Umami (che è sempre in
  // pagina) lo riceve. Con la guardia qui, un visitatore che rifiuta perderebbe
  // per Umami il flusso fra le pagine, che è la parte più utile.
  useEffect(() => {
    const current = pathname || "/";
    if (seenPath.current === null) {
      seenPath.current = current;
      return;
    }
    if (seenPath.current === current) return;
    const from = seenPath.current;
    seenPath.current = current;
    // Il titolo della pagina nuova non è ancora nel DOM quando l'effetto gira:
    // aspettiamo il frame successivo per non registrare il titolo della pagina
    // di partenza su quella di arrivo.
    markPageEnter();
    const frame = window.requestAnimationFrame(() => {
      track("page_view", {
        page_location: window.location.href,
        page_title: document.title,
        content_kind: contentKindOf(current),
        // Il flusso A → B: sulla pagina di arrivo si legge da dove si è partiti,
        // senza dover incrociare due report per ricostruire il percorso.
        from_path: from ?? "(entry)",
      });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [pathname, consent]);

  // Profondità di lettura: quattro traguardi per pagina, una volta ciascuno. Su
  // una pagina che non scorre non parte niente, perché un 100% che si raggiunge
  // senza scorrere non dice nulla su quanto è stato letto.
  useEffect(() => {
    const marks = [25, 50, 75, 100];
    const fired = new Set<number>();
    let frame: number | null = null;
    const measure = () => {
      frame = null;
      const scrollable = document.documentElement.scrollHeight - window.innerHeight;
      if (scrollable <= 4) return;
      const percent = Math.min(100, Math.round((window.scrollY / scrollable) * 100));
      markScroll(percent);
      for (const mark of marks) {
        if (percent >= mark && !fired.has(mark)) {
          fired.add(mark);
          track("scroll_depth", { percent: mark, content_kind: contentKindOf(window.location.pathname) });
        }
      }
    };
    const onScroll = () => {
      if (frame === null) frame = window.requestAnimationFrame(measure);
    };
    measure();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (frame !== null) window.cancelAnimationFrame(frame);
    };
  }, [pathname, consent]);

  // Uscita: quanto è durata la pagina, quanto in basso è arrivata, dove è andata
  // dopo. `visibilitychange` copre il cambio di scheda e la chiusura su mobile,
  // `pagehide` la chiusura e la navigazione vera; l'evento parte **una sola
  // volta** per pagina, perché altrimenti ogni altra scheda aperta ne
  // aggiungerebbe uno.
  useEffect(() => {
    // Il path si cattura qui e non dentro l'handler: su una navigazione
    // client-side l'URL cambia **prima** che questo effetto venga smontato,
    // quindi leggerlo al momento dell'uscita attribuirebbe alla pagina
    // successiva il tempo passato su quella precedente.
    const at = { pathname: window.location.pathname, kind: contentKindOf(window.location.pathname) };
    let sent = false;
    const report = () => {
      if (sent) return;
      sent = true;
      track("page_leave", pageLeavePayload(at));
      // Ultimo momento utile: quello che è ancora in coda va mandato adesso, con
      // `sendBeacon`, perché quando la pagina si chiude una `fetch` normale viene
      // interrotta e la copia nel database perderebbe proprio la fine della visita.
      flushCollect(true);
    };
    const onVisibility = () => {
      if (document.visibilityState === "hidden") report();
    };
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pagehide", report);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pagehide", report);
      // Una navigazione interna non fa scattare né `pagehide` né
      // `visibilitychange`: qui è l'unico punto in cui possiamo dire "da questa
      // pagina è andata via verso quella", che è la metà mancante del flusso.
      report();
    };
  }, [pathname, consent]);

  function choose(value: "accepted" | "declined") {
    window.localStorage.setItem(CONSENT_KEY, value);
    window.dispatchEvent(new Event("mattia-analytics-consent"));
    if (!window.sessionStorage.getItem(CONSENT_EVENT_KEY)) {
      window.sessionStorage.setItem(CONSENT_EVENT_KEY, "1");
      track("analytics_consent_choice", { consent_state: value });
    }
  }

  if (consent !== "unset") return null;
  return (
    <aside aria-label="Analytics choice" className="fixed inset-x-4 bottom-4 z-50 mx-auto flex max-w-xl items-center justify-between gap-4 rounded-2xl border border-gray-300 bg-white p-4 text-sm text-gray-1000 shadow-lg">
      <p className="m-0 leading-relaxed">
        May I load Google Analytics? It is optional, anonymous, and off until you allow it. Visits are already counted
        without cookies, and that needs no permission.
      </p>
      <div className="flex shrink-0 gap-2">
        <button type="button" onClick={() => choose("declined")} className="rounded-full px-3 py-2 text-xs underline decoration-gray-400 underline-offset-4">No thanks</button>
        <button type="button" onClick={() => choose("accepted")} className="rounded-full bg-gray-1200 px-3 py-2 text-xs font-semibold text-white">Allow</button>
      </div>
    </aside>
  );
}
