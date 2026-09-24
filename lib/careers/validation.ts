import { isDisposableCareerEmail } from "./disposable-domains";

/**
 * Da dove arriva il candidato. Il form legge `?utm_source` e il referrer e
 * manda un valore libero: il server lo confina a questa allowlist, perché il
 * campo finisce nel database e nel report dei canali — e un valore inventato
 * lì (`"source":"(drop table)"`) inquina la metrica che decide dove si
 * investe tempo. Ogni board che legge i feed passa il proprio nome in
 * `?utm_source=` (Indeed, Glassdoor, Jooble, Talent, careerjet); tutto ciò che
 * non combacia con la lista e non è un hostname referrer valido torna `direct`.
 */
export const APPLICATION_SOURCES = ["indeed", "glassdoor", "jooble", "talent", "careerjet", "jobrapido", "linkedin", "google_jobs", "newsletter", "x", "discord", "reddit", "direct"] as const;

export type ApplicationSource = (typeof APPLICATION_SOURCES)[number];

const SOURCE_PATTERN = /^[a-z0-9_-]{1,40}$/;

/** Hostname referrer → fonte, per chi arriva dal feed di una board senza UTM. */
const REFERRER_HOSTS: Array<[RegExp, ApplicationSource]> = [
  [/(^|\.)indeed\.com$/i, "indeed"],
  [/(^|\.)glassdoor\./i, "glassdoor"],
  [/(^|\.)jooble\.org$/i, "jooble"],
  [/(^|\.)talent\.com$/i, "talent"],
  [/(^|\.)neuvoo\.ca$/i, "talent"],
  [/(^|\.)careerjet\./i, "careerjet"],
  [/(^|\.)jobrapido\.com$/i, "jobrapido"],
  [/(^|\.)linkedin\.com$/i, "linkedin"],
];

/**
 * Il valore del form, confinato. Accetta un `utm_source` noto; altrimenti un
 * token sintatticamente valido che il client ha derivato dal referrer; altrimenti
 * `direct`. Nessun input arriva nel database senza passare da qui.
 */
export function applicationSource(input: unknown, referrer?: unknown): ApplicationSource {
  const candidate = typeof input === "string" ? input.trim().toLowerCase().slice(0, 40) : "";
  if ((APPLICATION_SOURCES as readonly string[]).includes(candidate)) return candidate as ApplicationSource;
  if (SOURCE_PATTERN.test(candidate)) return candidate as ApplicationSource;
  const referrerValue = typeof referrer === "string" ? referrer.trim().slice(0, 200) : "";
  if (referrerValue) {
    try {
      const host = new URL(referrerValue).hostname.replace(/^www\./, "");
      const match = REFERRER_HOSTS.find(([pattern]) => pattern.test(host));
      if (match) return match[1];
    } catch { /* referrer non è un URL: si ignora */ }
  }
  return "direct";
}

export type CareerApplicationInput = {
  job_slug?: unknown;
  full_name?: unknown;
  email?: unknown;
  country_timezone?: unknown;
  github_url?: unknown;
  portfolio_url?: unknown;
  artifact_link?: unknown;
  artifact_description?: unknown;
  motivation?: unknown;
  cv_filename?: unknown;
  cv_base64?: unknown;
  website?: unknown;
  custom_answers?: unknown;
  source?: unknown;
};

export type CareerApplicationFields = {
  job_slug: string;
  full_name: string;
  email: string;
  country_timezone: string;
  github_url: string;
  portfolio_url: string;
  artifact_link: string;
  artifact_description: string;
  motivation: string;
  cv_filename: string;
  cv_base64: string;
  website: string;
  custom_answers: Record<string, string>;
  source: ApplicationSource;
};

export type CareerValidation =
  | { ok: true; value: CareerApplicationFields }
  | { ok: false; fields: Partial<Record<keyof CareerApplicationFields, string>> };

function stringValue(value: unknown, max: number): string {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

export function httpsUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && Boolean(url.hostname);
  } catch {
    return false;
  }
}

export function validateCareerApplication(input: CareerApplicationInput): CareerValidation {
  const value: CareerApplicationFields = {
    job_slug: stringValue(input.job_slug, 120),
    full_name: stringValue(input.full_name, 120),
    email: stringValue(input.email, 254).toLowerCase(),
    country_timezone: stringValue(input.country_timezone, 160),
    github_url: stringValue(input.github_url, 500),
    portfolio_url: stringValue(input.portfolio_url, 500),
    artifact_link: stringValue(input.artifact_link, 500),
    artifact_description: stringValue(input.artifact_description, 6000),
    motivation: stringValue(input.motivation, 4000),
    cv_filename: stringValue(input.cv_filename, 255),
    cv_base64: stringValue(input.cv_base64, 7500000),
    website: stringValue(input.website, 500),
    custom_answers: typeof input.custom_answers === "object" && input.custom_answers !== null ? Object.fromEntries(Object.entries(input.custom_answers as Record<string, unknown>).slice(0, 30).map(([key, answer]) => [key.slice(0, 120), stringValue(answer, 10000)])) : {},
    // La fonte non è mai input fidato: la deriva qui, non nel client.
    source: applicationSource(input.source),
  };
  const fields: Partial<Record<keyof CareerApplicationFields, string>> = {};
  if (!value.job_slug) fields.job_slug = "Job is required.";
  if (value.full_name.length < 2) fields.full_name = "Full name must be at least 2 characters.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value.email)) fields.email = "Enter a valid email address.";
  else if (isDisposableCareerEmail(value.email)) fields.email = "Disposable email addresses are not accepted.";
  if (value.country_timezone.length < 2) fields.country_timezone = "Country and timezone must be provided.";
  if (value.github_url && !httpsUrl(value.github_url)) fields.github_url = "GitHub must be a valid HTTPS URL.";
  if (value.portfolio_url && !httpsUrl(value.portfolio_url)) fields.portfolio_url = "Portfolio must be a valid HTTPS URL.";
  if (!httpsUrl(value.artifact_link)) fields.artifact_link = "Artifact link must be a valid HTTPS URL.";
  if (value.artifact_description.length < 300) fields.artifact_description = "Artifact description must be at least 300 characters.";
  if (value.motivation.length < 200) fields.motivation = "Motivation must be at least 200 characters.";
  if (!value.cv_filename || !value.cv_filename.toLowerCase().endsWith(".pdf")) fields.cv_filename = "A PDF CV is required.";
  if (!value.cv_base64 || value.cv_base64.length > 7000000) fields.cv_base64 = "The CV must be a PDF no larger than 5 MB.";
  return Object.keys(fields).length ? { ok: false, fields } : { ok: true, value };
}
