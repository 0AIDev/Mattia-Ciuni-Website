"use client";

import Image from "next/image";
import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import { AdminWorkspace } from "@/components/AdminWorkspace";
import type { AdminJob, ConfigStatus } from "@/components/AdminSections";
import type { AdminContentItem, CmsKind } from "@/lib/cms-types";

type FeedbackRecord = {
  id: string;
  submitted_at: string;
  status: "pending_review" | "published" | "rejected";
  name: string;
  email: string;
  message: string;
  page_url: string;
  reject_reason?: string;
};

type Setup = {
  setup_id: string;
  otpauth_uri: string;
  manual_key: string;
  qr_data_url: string;
};

type ApiError = { code?: string; setup_required?: boolean };
type AdminRole = "ceo";
type AdminIdentity = { name: string; role: string; title: string };

type AnalyticsRow = Record<string, unknown>;
type AnalyticsData = {
  daily: AnalyticsRow[];
  pages: AnalyticsRow[];
  flow: AnalyticsRow[];
  acquisition: AnalyticsRow[];
  conversions: AnalyticsRow[];
  geo: AnalyticsRow[];
  available: boolean;
};

type ApplicantRecord = {
  id: string;
  job_slug: string;
  full_name: string;
  email: string;
  country_timezone?: string;
  github_url?: string | null;
  portfolio_url?: string | null;
  artifact_link?: string;
  artifact_description?: string;
  motivation?: string;
  custom_answers?: Record<string, unknown>;
  cv_filename?: string;
  email_verified?: boolean;
  submitted_at?: string;
  created_at?: string;
};

type AdminJobsResponse = { jobs?: AdminJob[]; content?: AdminContentItem[] };

function metric(value: unknown, suffix = "") {
  if (value === null || value === undefined || value === "") return "—";
  const number = typeof value === "number" ? value : Number(value);
  return Number.isFinite(number) ? `${number}${suffix}` : String(value);
}

function dateLabel(value: unknown) {
  return typeof value === "string" ? value.slice(0, 10) : "—";
}

const IDENTITIES: Record<AdminRole, AdminIdentity> = {
  ceo: { name: "Mattia Ciuni", role: "Chief Executive Officer", title: "CEO" },
};

const API = "/api/admin/feedback";
const EMPTY_ANALYTICS: AnalyticsData = { daily: [], pages: [], flow: [], acquisition: [], conversions: [], geo: [], available: false };

function localPreviewEnabled() {
  if (typeof window === "undefined") return false;
  return ["localhost", "127.0.0.1", "::1"].includes(window.location.hostname);
}

export default function FeedbackAdminPage() {
  const [token, setToken] = useState("");
  const [email, setEmail] = useState("ceo@usepayle.com");
  const [code, setCode] = useState("");
  const [setup, setSetup] = useState<Setup | null>(null);
  const [mode, setMode] = useState<"loading" | "setup" | "login">("loading");
  const [records, setRecords] = useState<FeedbackRecord[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsData>(EMPTY_ANALYTICS);
  const [jobs, setJobs] = useState<AdminJob[]>([]);
  const [applicants, setApplicants] = useState<ApplicantRecord[]>([]);
  const [content, setContent] = useState<AdminContentItem[]>([]);
  const [config, setConfig] = useState<ConfigStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [authenticated, setAuthenticated] = useState(false);
  const [identity, setIdentity] = useState<AdminIdentity | null>(null);
  const [sessionChecked, setSessionChecked] = useState(false);
  const [resetRequested, setResetRequested] = useState(false);
  // Come `load`: una ref invece di uno stato, perché chiamarla non deve
  // riprocessare l'intera dashboard.
  const loadConfigRef = useRef<(() => Promise<void>) | null>(null);

  const readError = async (response: Response): Promise<ApiError> =>
    (await response.json().catch(() => ({}))) as ApiError;

  const localApiMessage = (response: Response) =>
    response.status === 404
      ? "The local Pages API is not running. Use npm run preview, not npm run dev, for the admin API."
      : "The review queue is unavailable.";

  const load = useCallback(async ({ quiet = false } = {}) => {
    try {
      if (!localPreviewEnabled() && new URLSearchParams(window.location.search).get("reset") === "1") {
        setAuthenticated(false);
        setIdentity(null);
        setMode("setup");
        setSessionChecked(true);
        return;
      }
      const response = await fetch(API, { cache: "no-store" });
      if (response.status === 401) {
        const data = await readError(response);
        setAuthenticated(false);
        setIdentity(null);
        setRecords([]);
        setAnalytics(EMPTY_ANALYTICS);
        setJobs([]);
        setMode(data.setup_required ? "setup" : "login");
        if (!quiet && !data.setup_required) setError("The token or authenticator code is not valid.");
        return;
      }
      if (!response.ok) {
        // `next dev` does not mount Cloudflare Pages Functions. On loopback we
        // still render the workspace so the UI can be reviewed without auth;
        // mutations remain unavailable until `npm run dev:pages` is used.
        if (localPreviewEnabled() && [401, 404, 503].includes(response.status)) {
          setRecords([]);
          setAnalytics(EMPTY_ANALYTICS);
          setJobs([]);
          setIdentity(IDENTITIES.ceo);
          setAuthenticated(true);
          setMode("login");
          setError("");
          return;
        }
        throw new Error(localApiMessage(response));
      }
      const data = (await response.json()) as { records?: FeedbackRecord[]; role?: AdminRole; analytics?: AnalyticsData; applicants?: ApplicantRecord[] } & AdminJobsResponse;
      setRecords(data.records || []);
      setAnalytics(data.analytics || EMPTY_ANALYTICS);
      setJobs(data.jobs || []);
      setApplicants(data.applicants || []);
      setContent(data.content || []);
      setIdentity(IDENTITIES.ceo);
      void loadConfigRef.current?.();
      setAuthenticated(true);
      setMode("login");
      setError("");
    } catch (caught) {
      if (localPreviewEnabled()) {
        setRecords([]);
        setAnalytics(EMPTY_ANALYTICS);
      setJobs([]);
      setContent([]);
      setConfig(null);
      setIdentity(IDENTITIES.ceo);
      void loadConfigRef.current?.();
        setAuthenticated(true);
        setMode("login");
        setError("");
      } else {
        setAuthenticated(false);
        setIdentity(null);
        setMode("login");
        const message = caught instanceof Error ? caught.message : "The review queue is unavailable.";
        // Outside loopback, keep the real authentication/API error visible.
        if (!quiet || message.includes("local Pages API")) setError(message);
      }
    } finally {
      setSessionChecked(true);
    }
  }, []);

  useEffect(() => {
    // `loadConfig` è definita sotto e cambia a ogni render: la reference mantiene
    // `load` stabile, che è la dipendenza di questo effetto.
    loadConfigRef.current = loadConfig;
  });

  useEffect(() => {
    // Revalidate the HttpOnly session after a refresh. An unauthenticated 401 is
    // expected here and stays quiet; an existing session restores the queue
    // without asking for the token or TOTP again.
    const timer = window.setTimeout(() => {
      setResetRequested(new URLSearchParams(window.location.search).get("reset") === "1");
      void load({ quiet: true });
    }, 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  async function beginSetup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const response = await fetch(API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "setup", token }),
      });
      if (!response.ok) {
        const data = await readError(response);
        throw new Error(data.code === "setup_locked" ? "Two-factor setup is already locked or complete." : localApiMessage(response));
      }
      const data = (await response.json()) as Omit<Setup, "qr_data_url">;
      const qr_data_url = await QRCode.toDataURL(data.otpauth_uri, { width: 240, margin: 1, errorCorrectionLevel: "M" });
      setSetup({ ...data, qr_data_url });
      setCode("");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Two-factor setup failed.");
    } finally {
      setLoading(false);
    }
  }

  async function confirmSetup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!setup) return;
    setLoading(true);
    setError("");
    try {
      const response = await fetch(API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "confirm_setup", setup_id: setup.setup_id, code }),
      });
      if (!response.ok) {
        const data = await readError(response);
        throw new Error(data.code === "invalid_code" ? "That authenticator code is not valid." : data.code === "setup_expired" ? "The setup expired. Ask the owner to reset the one-time bootstrap." : localApiMessage(response));
      }
      setSetup(null);
      setToken("");
      setEmail("ceo@usepayle.com");
      setCode("");
      await load();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Two-factor setup failed.");
    } finally {
      setLoading(false);
    }
  }

  async function resetAuthenticator(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const response = await fetch(API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reset_setup", token }),
      });
      if (!response.ok) {
        const data = await readError(response);
        throw new Error(data.code === "unauthorized" ? "The reset secret is not valid." : localApiMessage(response));
      }
      setToken("");
      setCode("");
      setSetup(null);
      setResetRequested(false);
      setMode("setup");
      window.history.replaceState({}, "", "/admin/feedback/");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Authenticator reset failed.");
    } finally {
      setLoading(false);
    }
  }

  async function login(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const response = await fetch(API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "login", email, code }),
      });
      if (!response.ok) {
        const data = await readError(response);
        if (data.code === "setup_required") {
          setMode("setup");
          throw new Error("Set up the authenticator before signing in.");
        }
        throw new Error(response.status === 429 ? "Too many attempts. Try again later." : response.status === 401 ? "That admin email or authenticator code is not valid." : localApiMessage(response));
      }
      setToken("");
      setEmail("ceo@usepayle.com");
      setCode("");
      await load();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Login failed.");
    } finally {
      setLoading(false);
    }
  }

  async function logout() {
    setLoading(true);
    try {
      await fetch(API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "logout" }),
      });
    } finally {
      setEmail("ceo@usepayle.com");
      setCode("");
      setToken("");
      setRecords([]);
      setAnalytics(EMPTY_ANALYTICS);
      setJobs([]);
      setContent([]);
      setConfig(null);
      setAuthenticated(false);
      setIdentity(null);
      setMode("login");
      setError("");
      setLoading(false);
    }
  }

  async function createTestFeedback() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "create_test" }),
      });
      if (!response.ok) throw new Error(response.status === 404 ? localApiMessage(response) : "The test feedback could not be created.");
      await load();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "The test feedback could not be created.");
    } finally {
      setLoading(false);
    }
  }

  // Lo stato di configurazione arriva con i dati: senza di questo la sezione
  // Settingsdirebbe "pronto" su un deploy dove GitHub non e' configurato, e il
  // primo publish fallirebbe con un errore che sembrerebbe del pannello.
  async function loadConfig() {
    try {
      const response = await fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "settings_read" }) });
      if (response.ok) setConfig((await response.json()) as ConfigStatus);
    } catch {
      setConfig(null);
    }
  }

  async function moderate(id: string, action: "publish" | "reject") {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, id }),
      });
      if (!response.ok) throw new Error(response.status === 404 ? localApiMessage(response) : "The feedback could not be updated.");
      await load();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "The feedback could not be updated.");
    } finally {
      setLoading(false);
    }
  }

  if (!sessionChecked) {
    return (
      <main id="admin-feedback-page" className="flex h-[100dvh] overflow-hidden bg-admin-bg font-sans text-admin-ink">
        <div aria-hidden="true" className="hidden w-[236px] shrink-0 flex-col px-2 py-3 md:flex">
          <div className="flex items-center gap-2 px-1.5">
            <span className="admin-logo-black h-4 w-4" />
            <span className="text-[13px] font-medium text-admin-ink">Mattia Ciuni</span>
          </div>
          <div className="mt-5 animate-pulse space-y-1.5 px-1.5">
            {Array.from({ length: 7 }, (_, index) => <div key={index} className="h-5 rounded-md bg-admin-active" />)}
          </div>
        </div>
        <div className="flex min-h-0 min-w-0 flex-1 p-2 md:pl-0">
          <section aria-busy="true" aria-label="Checking admin session" className="w-full overflow-hidden rounded-lg border border-admin-line bg-admin-panel p-5">
            <div className="animate-pulse space-y-3">
              <div className="h-3 w-16 rounded bg-admin-active" />
              <div className="h-5 w-44 rounded bg-admin-active" />
              <div className="h-3 w-72 rounded bg-admin-active" />
              <div className="h-28 rounded-lg bg-admin-soft" />
            </div>
          </section>
        </div>
      </main>
    );
  }

  if (!authenticated) {
    return (
      <main id="admin-feedback-page" className="flex min-h-[100dvh] items-center justify-center bg-admin-bg px-5 py-10 font-sans text-admin-ink">
        <section className="w-full max-w-[400px]">
          <div className="mb-4 flex items-center gap-2 px-0.5">
            <span aria-hidden="true" className="admin-logo-black h-5 w-5" />
            <span className="text-[13px] font-medium text-admin-ink">Mattia Ciuni</span>
            <span className="ml-auto text-[12px] text-admin-faint">Admin</span>
          </div>
          <div className="rounded-lg border border-admin-line bg-admin-panel p-5 sm:p-6">
          {resetRequested ? (
            <>
              <h1 className="text-[18px] font-medium tracking-[-.01em] text-admin-ink">Reset your authenticator</h1>
              <p className="mt-3 text-[13px] leading-5 text-admin-muted">This revokes every existing admin session and lets you configure TOTP again from zero. It requires the dedicated Cloudflare reset secret.</p>
              <form onSubmit={resetAuthenticator} className="mt-4 flex flex-col gap-2.5">
                <label htmlFor="totp-reset-token" className="sr-only">TOTP reset secret</label>
                <input id="totp-reset-token" type="password" value={token} onChange={(event) => setToken(event.target.value)} placeholder="TOTP reset secret" autoComplete="off" className="w-full rounded-md border border-admin-line bg-admin-panel px-3 py-2 text-[13px] text-admin-ink outline-none transition-colors placeholder:text-admin-faint hover:border-[#dbdbd8] focus:border-[#c9c9c6]" required />
                <button type="submit" disabled={loading || !token} className="inline-flex h-9 w-full items-center justify-center rounded-md bg-admin-ink text-[13px] font-medium text-white transition-colors hover:bg-[#3d4048] disabled:pointer-events-none disabled:opacity-40">{loading ? "Resetting" : "Reset authenticator"}</button>
              </form>
            </>
          ) : mode === "setup" && !setup ? (
            <>
              <h1 className="text-[18px] font-medium tracking-[-.01em] text-admin-ink">Set up your authenticator</h1>
              <p className="mt-3 text-[13px] leading-5 text-admin-muted">
                This one-time setup uses the bootstrap secret configured for this deployment to create your authenticator. Scan the QR code, then confirm one six-digit code.
              </p>
              <form onSubmit={beginSetup} className="mt-4 flex flex-col gap-2.5">
                <label htmlFor="admin-token" className="sr-only">Admin token</label>
                <input id="admin-token" type="password" value={token} onChange={(event) => setToken(event.target.value)} placeholder="One-time setup secret" autoComplete="current-password" className="w-full rounded-md border border-admin-line bg-admin-panel px-3 py-2 text-[13px] text-admin-ink outline-none transition-colors placeholder:text-admin-faint hover:border-[#dbdbd8] focus:border-[#c9c9c6]" required />
                <button type="submit" disabled={loading} className="inline-flex h-9 w-full items-center justify-center rounded-md bg-admin-ink text-[13px] font-medium text-white transition-colors hover:bg-[#3d4048] disabled:pointer-events-none disabled:opacity-40">{loading ? "Generating" : "Generate QR code"}</button>
              </form>
            </>
          ) : setup ? (
            <>
              <h1 className="text-[18px] font-medium tracking-[-.01em] text-admin-ink">Scan once, then confirm</h1>
              <p className="mt-3 text-[13px] leading-5 text-admin-muted">Scan this QR code in Google Authenticator, 1Password, Authy or another TOTP app. The QR code and manual key will not be shown again.</p>
              <div className="mt-5 flex justify-center"><Image src={setup.qr_data_url} alt="One-time authenticator setup QR code" width={240} height={240} unoptimized className="rounded-md border border-admin-line" /></div>
              <p className="mt-3 break-all rounded-md border border-admin-line bg-admin-bg px-3 py-2 font-mono text-[11px] text-admin-muted">{setup.manual_key}</p>
              <form onSubmit={confirmSetup} className="mt-3 flex flex-col gap-2.5">
                <label htmlFor="setup-code" className="sr-only">Authenticator code</label>
                <div className="relative">
                  <input id="setup-code" aria-label="Authenticator code" inputMode="numeric" pattern="[0-9]{6}" maxLength={6} value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))} autoComplete="one-time-code" style={{ letterSpacing: "0px", fontFamily: "var(--font-inter), Inter, sans-serif" }} className="admin-code-input w-full rounded-md border border-admin-line bg-admin-panel px-3 py-2 text-left font-sans text-[14px] font-medium tabular-nums tracking-normal text-admin-ink outline-none transition-colors hover:border-[#dbdbd8] focus:border-[#c9c9c6]" required />
                  {!code ? <span aria-hidden="true" style={{ letterSpacing: "0px", fontFamily: "var(--font-inter), Inter, sans-serif" }} className="pointer-events-none absolute inset-0 flex items-center px-3 font-sans text-[13px] text-admin-faint">6-digit code</span> : null}
                </div>
                <button type="submit" disabled={loading || code.length !== 6} className="inline-flex h-9 w-full items-center justify-center rounded-md bg-admin-ink text-[13px] font-medium text-white transition-colors hover:bg-[#3d4048] disabled:pointer-events-none disabled:opacity-40">{loading ? "Confirming" : "Enable two-factor login"}</button>
              </form>
            </>
          ) : (
            <>
              <h1 className="text-[18px] font-medium tracking-[-.01em] text-admin-ink">Sign in</h1>
              <p className="mt-3 text-[13px] leading-5 text-admin-muted">Sign in with the authorized admin email and your current authenticator code.</p>
              <form onSubmit={login} className="mt-6 flex flex-col gap-3">
                <label htmlFor="admin-email" className="sr-only">Admin email</label>
                <input id="admin-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Admin email" autoComplete="username" className="w-full rounded-md border border-admin-line bg-admin-panel px-3 py-2 font-sans text-[13px] text-admin-ink outline-none transition-colors placeholder:text-admin-faint hover:border-[#dbdbd8] focus:border-[#c9c9c6]" required />
                <label htmlFor="admin-code" className="sr-only">Authenticator code</label>
                <div className="relative">
                  <input id="admin-code" aria-label="Authenticator code" inputMode="numeric" pattern="[0-9]{6}" maxLength={6} value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))} autoComplete="one-time-code" style={{ letterSpacing: "0px", fontFamily: "var(--font-inter), Inter, sans-serif" }} className="admin-code-input w-full rounded-md border border-admin-line bg-admin-panel px-3 py-2 text-left font-sans text-[14px] font-medium tabular-nums tracking-normal text-admin-ink outline-none transition-colors hover:border-[#dbdbd8] focus:border-[#c9c9c6]" required autoFocus />
                  {!code ? <span aria-hidden="true" style={{ letterSpacing: "0px", fontFamily: "var(--font-inter), Inter, sans-serif" }} className="pointer-events-none absolute inset-0 flex items-center px-3 font-sans text-[13px] text-admin-faint">Authenticator code</span> : null}
                </div>
                <button type="submit" disabled={loading || code.length !== 6 || !email} className="inline-flex h-9 w-full items-center justify-center rounded-md bg-admin-ink text-[13px] font-medium text-white transition-colors hover:bg-[#3d4048] disabled:pointer-events-none disabled:opacity-40">{loading ? "Checking" : "Continue"}</button>
              </form>
            </>
          )}
          {error ? <p role="alert" className="mt-3 text-[12px] text-admin-muted">{error}</p> : null}
          </div>
        </section>
      </main>
    );
  }

  async function createNda(fullName: string, emailAddress: string): Promise<string | null> {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "nda_create", full_name: fullName, email_address: emailAddress }) });
      const data = (await response.json().catch(() => ({}))) as { link?: string; code?: string };
      if (!response.ok || !data.link) throw new Error(data.code === "unavailable" ? "Supabase is unavailable." : "The NDA link could not be created.");
      return data.link;
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "The NDA link could not be created.");
      return null;
    } finally {
      setLoading(false);
    }
  }

  async function saveJobs(nextJobs: AdminJob[]) {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "jobs_save", jobs: nextJobs }) });
      if (!response.ok) throw new Error("The job offers could not be saved.");
      setJobs(nextJobs);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "The job offers could not be saved.");
    } finally {
      setLoading(false);
    }
  }

  async function saveContent(item: AdminContentItem): Promise<AdminContentItem | null> {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "content_save", content: item }) });
      const data = (await response.json().catch(() => ({}))) as { content?: AdminContentItem; code?: string };
      if (!response.ok || !data.content) {
        if (data.code === "content_table_missing") throw new Error("The Supabase tables are missing, so nothing can be saved. Run the two migrations in supabase/migrations, then reload this page.");
        throw new Error(data.code === "github_not_configured" ? "GitHub publishing is not configured." : "The CMS draft could not be saved.");
      }
      setContent((current) => [data.content!, ...current.filter((entry) => !(entry.kind === data.content!.kind && entry.slug === data.content!.slug))]);
      return data.content;
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "The CMS draft could not be saved.");
      return null;
    } finally {
      setLoading(false);
    }
  }

  async function restoreContent(kind: CmsKind, slug: string): Promise<boolean> {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "content_restore", kind, slug, sha: "HEAD" }) });
      const data = (await response.json().catch(() => ({}))) as { ok?: boolean; code?: string };
      if (!response.ok || !data.ok) throw new Error(data.code === "github_not_configured" ? "GitHub publishing is not configured." : "The published version could not be restored.");
      await load();
      return true;
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "The published version could not be restored.");
      return false;
    } finally {
      setLoading(false);
    }
  }

  async function publishContent(id: string): Promise<boolean> {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "content_publish", id }) });
      const data = (await response.json().catch(() => ({}))) as { content?: AdminContentItem; code?: string; deploy_triggered?: boolean; stored?: boolean };
      if (!response.ok || !data.content) throw new Error(data.code === "github_not_configured" ? "GitHub publishing is not configured." : "The content could not be published.");
      setContent((current) => [data.content!, ...current.filter((entry) => !(entry.kind === data.content!.kind && entry.slug === data.content!.slug))]);
      // Pubblicato e committato, ma la riga di stato non si e' scritta: non e' un
      // fallimento, ed e' comunque qualcosa da sapere subito, perche' il prossimo
      // salvataggio su quell'item partira' dalla versione su Git e non da questa.
      if (data.stored === false) {
        setError("Published: the commit is on Git and the build has been requested. The draft row could not be written (Supabase tables missing), so the library still shows the previous version.");
      }
      return true;
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "The content could not be published.");
      return false;
    } finally {
      setLoading(false);
    }
  }

  return <AdminWorkspace
      records={records}
      analytics={analytics}
      jobs={jobs}
      applicants={applicants}
      content={content}
      config={config}
      identity={identity}
      loading={loading}
      error={error}
      onRefresh={() => void load()}
      onLogout={() => void logout()}
      onCreateTest={() => void createTestFeedback()}
      onModerate={(id, action) => void moderate(id, action)}
      onSaveJobs={(nextJobs) => void saveJobs(nextJobs)}
      onSaveContent={saveContent}
      onPublishContent={publishContent}
      onRestoreContent={restoreContent}
      onCreateNda={createNda}
    />;
}

