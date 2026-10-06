export type Attribution = {
  source: string;
  medium: string;
  campaign: string;
  content: string;
  term: string;
  campaign_id: string;
  landing_page: string;
  referrer_domain: string;
  gclid: string;
  gbraid: string;
  wbraid: string;
  fbclid: string;
  msclkid: string;
  ttclid: string;
  li_fat_id: string;
};

export const ATTRIBUTION_SESSION_KEY = "mattia-ciuni-attribution-session-v2";
export const ATTRIBUTION_FIRST_KEY = "mattia-ciuni-first-touch-v2";
export const ATTRIBUTION_LAST_KEY = "mattia-ciuni-last-touch-v2";

const CLICK_IDS = ["gclid", "gbraid", "wbraid", "fbclid", "msclkid", "ttclid", "li_fat_id"] as const;
const EMPTY: Attribution = {
  source: "direct",
  medium: "none",
  campaign: "(not set)",
  content: "(not set)",
  term: "(not set)",
  campaign_id: "(not set)",
  landing_page: "/",
  referrer_domain: "(none)",
  gclid: "",
  gbraid: "",
  wbraid: "",
  fbclid: "",
  msclkid: "",
  ttclid: "",
  li_fat_id: "",
};

function clean(value: string | null | undefined, fallback = "") {
  return (value || "").trim().slice(0, 200) || fallback;
}

/**
 * Gli host di questo sito, e perche' non e' uno solo.
 *
 * Un referrer che arriva da un host nostro non e' una sorgente: e' la stessa
 * visita un passo piu' in la'. Fino al 5 ottobre 2026 il sito viveva su
 * `mattiaciuni.pages.dev`, che da allora risponde 301 verso l'apex: chi ha
 * ancora una pagina vecchia in cache o in cronologia arriva da li'. Con il
 * confronto precedente, che paragonava il referrer al solo host corrente, quel
 * referrer non veniva riconosciuto e diventava una sorgente col nome del vecchio
 * host, con medium `referral`: un dato inventato che nei report sta accanto a
 * Google, e che nessuno riconoscerebbe come un guasto. Le anteprime di
 * Cloudflare (`<hash>.mattiaciuni.pages.dev`) hanno lo stesso problema.
 *
 * L'host e' scritto qui e non importato da `lib/site-origin.ts` per la stessa
 * ragione per cui non lo importa il middleware: quel modulo lancia se
 * `NEXT_PUBLIC_SITE_URL` non coincide, e questo file gira dentro componenti
 * client. Le due copie non possono divergere, perche' `scripts/verify.js`
 * confronta questa costante con l'origine production e con gli host ritirati
 * del middleware.
 */
const SITE_HOST = "mattiaciuni.com";
const PAGES_HOST = `${SITE_HOST.split(".")[0]}.pages.dev`;

/** Vero per ogni host che e' questo sito: apex, `www`, il progetto Pages e le sue anteprime. */
export function isOwnHost(host: string): boolean {
  const bare = host.replace(/^www\./, "");
  return bare === SITE_HOST || bare === PAGES_HOST || bare.endsWith(`.${PAGES_HOST}`);
}

function referrerDomain() {
  if (typeof document === "undefined" || !document.referrer) return "(none)";
  try {
    const host = new URL(document.referrer).hostname;
    return isOwnHost(host) ? "(internal)" : host.replace(/^www\./, "").slice(0, 120);
  } catch {
    return "(unknown)";
  }
}

export function readAttributionFromLocation(): Attribution {
  if (typeof window === "undefined") return EMPTY;
  const query = new URLSearchParams(window.location.search);
  const referrer = referrerDomain();
  const sourceParam = clean(query.get("utm_source")).toLowerCase();
  const referrerIsSearch = /(^|\.)google\.|(^|\.)bing\.|(^|\.)duckduckgo\.|(^|\.)yahoo\./i.test(referrer);
  const clickId = CLICK_IDS.find((key) => query.has(key));
  const source = sourceParam || (clickId ? "paid" : referrer !== "(none)" && referrer !== "(internal)" ? referrer : "direct");
  const medium = clean(query.get("utm_medium")).toLowerCase() || (clickId ? "paid" : referrerIsSearch ? "organic_search" : source === "direct" ? "none" : "referral");
  const result: Attribution = {
    source,
    medium,
    campaign: clean(query.get("utm_campaign"), "(not set)"),
    content: clean(query.get("utm_content"), "(not set)"),
    term: clean(query.get("utm_term"), "(not set)"),
    campaign_id: clean(query.get("utm_id"), "(not set)"),
    // Solo il path: i query params sono già rappresentati dai campi UTM e non
    // devono poter trasportare accidentalmente un'email o un token.
    landing_page: window.location.pathname.slice(0, 300) || "/",
    referrer_domain: referrer,
    gclid: clean(query.get("gclid")),
    gbraid: clean(query.get("gbraid")),
    wbraid: clean(query.get("wbraid")),
    fbclid: clean(query.get("fbclid")),
    msclkid: clean(query.get("msclkid")),
    ttclid: clean(query.get("ttclid")),
    li_fat_id: clean(query.get("li_fat_id")),
  };
  return result;
}

function isMeaningful(value: Attribution) {
  return value.source !== "direct" || value.medium !== "none" || value.campaign !== "(not set)" || value.referrer_domain !== "(none)" || CLICK_IDS.some((key) => value[key]);
}

function readJson(key: string): Attribution | null {
  if (typeof window === "undefined") return null;
  try {
    const parsed = JSON.parse(window.localStorage.getItem(key) || window.sessionStorage.getItem(key) || "null") as Partial<Attribution> | null;
    return parsed ? { ...EMPTY, ...parsed } : null;
  } catch {
    return null;
  }
}

function writeSession(key: string, value: Attribution) {
  window.sessionStorage.setItem(key, JSON.stringify(value));
}

/**
 * Cattura la sorgente una volta per sessione e aggiorna il last touch quando la
 * visita inizia da una nuova campagna. Il first touch persistente viene scritto
 * solo dopo il consenso Analytics; prima resta nel tab e non diventa storage
 * persistente non autorizzato.
 */
export function captureAttribution(analyticsConsent: boolean): { current: Attribution; first: Attribution; last: Attribution } {
  if (typeof window === "undefined") return { current: EMPTY, first: EMPTY, last: EMPTY };
  const current = readAttributionFromLocation();
  const previousSession = readJson(ATTRIBUTION_SESSION_KEY);
  const first = readJson(ATTRIBUTION_FIRST_KEY) || previousSession || current;
  const last = isMeaningful(current) || !previousSession ? current : previousSession;
  if (!previousSession) writeSession(ATTRIBUTION_SESSION_KEY, first);
  writeSession(ATTRIBUTION_LAST_KEY, last);
  if (analyticsConsent && !window.localStorage.getItem(ATTRIBUTION_FIRST_KEY)) {
    window.localStorage.setItem(ATTRIBUTION_FIRST_KEY, JSON.stringify(first));
  }
  return { current, first, last };
}

export function currentAttribution(): { first: Attribution; last: Attribution } {
  if (typeof window === "undefined") return { first: EMPTY, last: EMPTY };
  const session = readJson(ATTRIBUTION_SESSION_KEY) || readAttributionFromLocation();
  return { first: readJson(ATTRIBUTION_FIRST_KEY) || session, last: readJson(ATTRIBUTION_LAST_KEY) || session };
}

export function attributionParams(analyticsConsent: boolean): Record<string, string> {
  const { current, first, last } = captureAttribution(analyticsConsent);
  return {
    source: current.source,
    medium: current.medium,
    campaign: current.campaign,
    content: current.content,
    term: current.term,
    campaign_id: current.campaign_id,
    landing_page: current.landing_page,
    referrer_domain: current.referrer_domain,
    first_source: first.source,
    first_medium: first.medium,
    first_campaign: first.campaign,
    first_content: first.content,
    first_term: first.term,
    first_campaign_id: first.campaign_id,
    first_landing_page: first.landing_page,
    last_source: last.source,
    last_medium: last.medium,
    last_campaign: last.campaign,
    last_content: last.content,
    last_term: last.term,
    last_campaign_id: last.campaign_id,
    last_landing_page: last.landing_page,
  };
}
