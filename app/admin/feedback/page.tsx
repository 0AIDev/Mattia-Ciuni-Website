"use client";

import Image from "next/image";
import { FormEvent, useCallback, useEffect, useState } from "react";
import QRCode from "qrcode";
import { AdminWorkspace, type AdminJob } from "@/components/AdminWorkspace";

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

type AdminJobsResponse = { jobs?: AdminJob[] };

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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [authenticated, setAuthenticated] = useState(false);
  const [identity, setIdentity] = useState<AdminIdentity | null>(null);
  const [sessionChecked, setSessionChecked] = useState(false);
  const [resetRequested, setResetRequested] = useState(false);

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
      setIdentity(IDENTITIES.ceo);
      setAuthenticated(true);
      setMode("login");
      setError("");
    } catch (caught) {
      if (localPreviewEnabled()) {
        setRecords([]);
        setAnalytics(EMPTY_ANALYTICS);
        setJobs([]);
        setIdentity(IDENTITIES.ceo);
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
      <main id="admin-feedback-page" className="mx-auto w-full max-w-[760px] min-w-0 px-5 py-8 font-sans sm:px-6 sm:py-20">
        <section aria-busy="true" aria-label="Checking admin session" className="animate-pulse">
          <header className="flex items-start justify-between gap-6">
            <div className="space-y-3">
              <div className="h-9 w-56 rounded-full bg-gray-200" />
              <div className="h-4 w-64 rounded-full bg-gray-200" />
              <div className="h-4 w-36 rounded-full bg-gray-200" />
            </div>
            <div className="flex gap-2">
              <div className="h-10 w-36 rounded-full bg-gray-200" />
              <div className="h-10 w-20 rounded-full bg-gray-200" />
            </div>
          </header>
          <div className="mt-10 grid gap-4">
            {["w-full", "w-[92%]"].map((width) => (
              <div key={width} className={`rounded-2xl border border-gray-200 bg-white px-5 py-5 sm:px-6 ${width}`}>
                <div className="flex flex-wrap gap-2">
                  <div className="h-4 w-28 rounded-full bg-gray-200" />
                  <div className="h-4 w-36 rounded-full bg-gray-200" />
                  <div className="h-4 w-24 rounded-full bg-gray-200" />
                </div>
                <div className="mt-5 space-y-2">
                  <div className="h-4 w-full rounded-full bg-gray-200" />
                  <div className="h-4 w-4/5 rounded-full bg-gray-200" />
                </div>
                <div className="mt-5 flex gap-2">
                  <div className="h-9 w-20 rounded-full bg-gray-200" />
                  <div className="h-9 w-20 rounded-full bg-gray-200" />
                  <div className="h-4 w-32 self-center rounded-full bg-gray-200" />
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    );
  }

  if (!authenticated) {
    return (
      <main id="admin-feedback-page" className="mx-auto flex min-h-[100dvh] max-w-[460px] items-center px-5 py-8 font-sans sm:px-6 sm:py-12">
        <section className="w-full rounded-3xl border border-gray-300 bg-white p-6 sm:p-8">
          {resetRequested ? (
            <>
              <h1 className="font-serif text-3xl text-gray-1200">Reset your authenticator</h1>
              <p className="mt-3 text-sm leading-relaxed text-gray-1000">This revokes every existing admin session and lets you configure TOTP again from zero. It requires the dedicated Cloudflare reset secret.</p>
              <form onSubmit={resetAuthenticator} className="mt-6 flex flex-col gap-3">
                <label htmlFor="totp-reset-token" className="sr-only">TOTP reset secret</label>
                <input id="totp-reset-token" type="password" value={token} onChange={(event) => setToken(event.target.value)} placeholder="TOTP reset secret" autoComplete="off" className="w-full appearance-none rounded-full border border-gray-400 bg-white px-5 py-3 text-sm text-gray-1200 outline-none shadow-none focus:border-gray-1200 focus:outline-none" required />
                <button type="submit" disabled={loading || !token} className="rounded-full bg-red-600 px-5 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-80 disabled:opacity-50">{loading ? "Resetting" : "Reset authenticator"}</button>
              </form>
            </>
          ) : mode === "setup" && !setup ? (
            <>
              <h1 className="font-serif text-3xl text-gray-1200">Set up your authenticator</h1>
              <p className="mt-3 text-sm leading-relaxed text-gray-1000">
                This one-time setup uses the bootstrap secret configured for this deployment to create your authenticator. Scan the QR code, then confirm one six-digit code.
              </p>
              <form onSubmit={beginSetup} className="mt-6 flex flex-col gap-3">
                <label htmlFor="admin-token" className="sr-only">Admin token</label>
                <input id="admin-token" type="password" value={token} onChange={(event) => setToken(event.target.value)} placeholder="One-time setup secret" autoComplete="current-password" className="w-full appearance-none rounded-full border border-gray-400 bg-white px-5 py-3 text-sm text-gray-1200 outline-none shadow-none focus:border-gray-1200 focus:outline-none" required />
                <button type="submit" disabled={loading} className="rounded-full bg-gray-1200 px-5 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-80 disabled:opacity-50">{loading ? "Generating" : "Generate QR code"}</button>
              </form>
            </>
          ) : setup ? (
            <>
              <h1 className="font-serif text-3xl text-gray-1200">Scan once, then confirm</h1>
              <p className="mt-3 text-sm leading-relaxed text-gray-1000">Scan this QR code in Google Authenticator, 1Password, Authy or another TOTP app. The QR code and manual key will not be shown again.</p>
              <div className="mt-6 flex justify-center"><Image src={setup.qr_data_url} alt="One-time authenticator setup QR code" width={240} height={240} unoptimized className="rounded-2xl" /></div>
              <p className="mt-4 break-all rounded-2xl bg-gray-100 px-4 py-3 font-mono text-xs text-gray-1000">{setup.manual_key}</p>
              <form onSubmit={confirmSetup} className="mt-4 flex flex-col gap-3">
                <label htmlFor="setup-code" className="sr-only">Authenticator code</label>
                <div className="relative">
                  <input id="setup-code" aria-label="Authenticator code" inputMode="numeric" pattern="[0-9]{6}" maxLength={6} value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))} autoComplete="one-time-code" style={{ letterSpacing: "0px", fontFamily: "var(--font-inter), Inter, sans-serif" }} className="w-full appearance-none rounded-full border border-gray-400 bg-white px-5 py-3 admin-code-input text-center font-sans text-base font-medium tabular-nums tracking-normal text-gray-1200 outline-none shadow-none focus:border-gray-1200 focus:outline-none" required />
                  {!code ? <span aria-hidden="true" style={{ letterSpacing: "0px", fontFamily: "var(--font-inter), Inter, sans-serif" }} className="pointer-events-none absolute inset-0 flex items-center justify-center px-5 font-sans text-base text-gray-400">6-digit code</span> : null}
                </div>
                <button type="submit" disabled={loading || code.length !== 6} className="rounded-full bg-gray-1200 px-5 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-80 disabled:opacity-50">{loading ? "Confirming" : "Enable two-factor login"}</button>
              </form>
            </>
          ) : (
            <>
              <h1 className="font-serif text-3xl text-gray-1200">Feedback review</h1>
              <p className="mt-3 text-sm leading-relaxed text-gray-1000">Sign in with the authorized admin email and your current authenticator code.</p>
              <form onSubmit={login} className="mt-6 flex flex-col gap-3">
                <label htmlFor="admin-email" className="sr-only">Admin email</label>
                <input id="admin-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Admin email" autoComplete="username" className="w-full appearance-none rounded-full border border-gray-400 bg-white px-5 py-3 font-sans text-sm text-gray-1200 outline-none shadow-none focus:border-gray-1200 focus:outline-none" required />
                <label htmlFor="admin-code" className="sr-only">Authenticator code</label>
                <div className="relative">
                  <input id="admin-code" aria-label="Authenticator code" inputMode="numeric" pattern="[0-9]{6}" maxLength={6} value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))} autoComplete="one-time-code" style={{ letterSpacing: "0px", fontFamily: "var(--font-inter), Inter, sans-serif" }} className="w-full appearance-none rounded-full border border-gray-400 bg-white px-5 py-3 admin-code-input text-center font-sans text-base font-medium tabular-nums tracking-normal text-gray-1200 outline-none shadow-none focus:border-gray-1200 focus:outline-none" required autoFocus />
                  {!code ? <span aria-hidden="true" style={{ letterSpacing: "0px", fontFamily: "var(--font-inter), Inter, sans-serif" }} className="pointer-events-none absolute inset-0 flex items-center justify-center px-5 font-sans text-base text-gray-400">Authenticator code</span> : null}
                </div>
                <button type="submit" disabled={loading || code.length !== 6 || !email} className="rounded-full bg-gray-1200 px-5 py-3 font-sans text-sm font-semibold text-white transition-opacity hover:opacity-80 disabled:opacity-50">{loading ? "Checking" : "Open queue"}</button>
              </form>
            </>
          )}
          {error ? <p role="alert" className="mt-3 text-sm text-gray-1000">{error}</p> : null}
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

  return <AdminWorkspace
      records={records}
      analytics={analytics}
      jobs={jobs}
      applicants={applicants}
      identity={identity}
      loading={loading}
      error={error}
      onLogout={() => void logout()}
      onCreateTest={() => void createTestFeedback()}
      onModerate={(id, action) => void moderate(id, action)}
      onSaveJobs={(nextJobs) => void saveJobs(nextJobs)}
      onCreateNda={createNda}
      localMode={localPreviewEnabled()}
    />;
}

