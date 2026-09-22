"use client";

import Image from "next/image";
import { FormEvent, useCallback, useEffect, useState } from "react";
import QRCode from "qrcode";

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
type AdminRole = "ceo" | "cofounder";
type AdminIdentity = { name: string; role: string; title: string };

type AnalyticsRow = Record<string, unknown>;
type AnalyticsData = {
  daily: AnalyticsRow[];
  pages: AnalyticsRow[];
  flow: AnalyticsRow[];
  acquisition: AnalyticsRow[];
  conversions: AnalyticsRow[];
  available: boolean;
};

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
  cofounder: { name: "Ghassen", role: "Co-Founder & CTO", title: "Co-founder" },
};

const API = "/api/admin/feedback";

export default function FeedbackAdminPage() {
  const [token, setToken] = useState("");
  const [code, setCode] = useState("");
  const [setup, setSetup] = useState<Setup | null>(null);
  const [mode, setMode] = useState<"loading" | "setup" | "login">("loading");
  const [records, setRecords] = useState<FeedbackRecord[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [authenticated, setAuthenticated] = useState(false);
  const [identity, setIdentity] = useState<AdminIdentity | null>(null);
  const [sessionChecked, setSessionChecked] = useState(false);
  const [tokenVerified, setTokenVerified] = useState(false);

  const readError = async (response: Response): Promise<ApiError> =>
    (await response.json().catch(() => ({}))) as ApiError;

  const localApiMessage = (response: Response) =>
    response.status === 404
      ? "The local Pages API is not running. Use npm run preview, not npm run dev, for the admin API."
      : "The review queue is unavailable.";

  const load = useCallback(async ({ quiet = false } = {}) => {
    try {
      const response = await fetch(API, { cache: "no-store" });
      if (response.status === 401) {
        const data = await readError(response);
        setAuthenticated(false);
        setIdentity(null);
        setRecords([]);
        setAnalytics(null);
        setMode(data.setup_required ? "setup" : "login");
        if (!quiet && !data.setup_required) setError("The token or authenticator code is not valid.");
        return;
      }
      if (!response.ok) throw new Error(localApiMessage(response));
      const data = (await response.json()) as { records?: FeedbackRecord[]; role?: AdminRole; analytics?: AnalyticsData };
      setRecords(data.records || []);
      setAnalytics(data.analytics || null);
      setIdentity(IDENTITIES[data.role === "cofounder" ? "cofounder" : "ceo"]);
      setAuthenticated(true);
      setMode("login");
      setError("");
    } catch (caught) {
      setAuthenticated(false);
      setIdentity(null);
      setMode("login");
      const message = caught instanceof Error ? caught.message : "The review queue is unavailable.";
      // In `next dev` Pages Functions are not mounted. Do not hide that fact on
      // the initial check: otherwise the user types a valid token into a form
      // that can never reach the API and only sees a generic failure later.
      if (!quiet || message.includes("local Pages API")) setError(message);
    } finally {
      setSessionChecked(true);
    }
  }, []);

  useEffect(() => {
    // Revalidate the HttpOnly session after a refresh. An unauthenticated 401 is
    // expected here and stays quiet; an existing session restores the queue
    // without asking for the token or TOTP again.
    const timer = window.setTimeout(() => void load({ quiet: true }), 0);
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
      setCode("");
      setTokenVerified(false);
      await load();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Two-factor setup failed.");
    } finally {
      setLoading(false);
    }
  }

  async function verifyToken(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const response = await fetch(API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "token_check", token }),
      });
      const data = await readError(response);
      if (!response.ok) {
        if (data.code === "setup_required") setMode("setup");
        throw new Error(response.status === 429 ? "Too many attempts. Try again later." : response.status === 404 ? localApiMessage(response) : "That admin token is not valid.");
      }
      setTokenVerified(true);
      setCode("");
    } catch (caught) {
      setTokenVerified(false);
      setCode("");
      setError(caught instanceof Error ? caught.message : "Token verification failed.");
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
        body: JSON.stringify({ action: "login", token, code }),
      });
      if (!response.ok) {
        const data = await readError(response);
        if (data.code === "setup_required") {
          setMode("setup");
          throw new Error("Set up the authenticator before signing in.");
        }
        throw new Error(response.status === 429 ? "Too many attempts. Try again later." : response.status === 401 ? "That admin token or authenticator code is not valid." : localApiMessage(response));
      }
      setToken("");
      setCode("");
      setTokenVerified(false);
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
      setToken("");
      setCode("");
      setTokenVerified(false);
      setRecords([]);
      setAnalytics(null);
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
          {mode === "setup" && !setup ? (
            <>
              <h1 className="font-serif text-3xl text-gray-1200">Set up your authenticator</h1>
              <p className="mt-3 text-sm leading-relaxed text-gray-1000">
                This one-time setup uses the admin token to create the only TOTP secret. Scan the QR code, then confirm one six-digit code.
              </p>
              <form onSubmit={beginSetup} className="mt-6 flex flex-col gap-3">
                <label htmlFor="admin-token" className="sr-only">Admin token</label>
                <input id="admin-token" type="password" value={token} onChange={(event) => setToken(event.target.value)} placeholder="Admin token" autoComplete="current-password" className="w-full appearance-none rounded-full border border-gray-400 bg-white px-5 py-3 text-sm text-gray-1200 outline-none shadow-none focus:border-gray-1200 focus:outline-none" required />
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
              <p className="mt-3 text-sm leading-relaxed text-gray-1000">Enter the admin token first. Your authenticator code appears only after the token is verified.</p>
              {!tokenVerified ? (
                <form onSubmit={verifyToken} className="mt-6 flex flex-col gap-3">
                  <label htmlFor="admin-token" className="sr-only">Admin token</label>
                  <input id="admin-token" type="password" value={token} onChange={(event) => { setToken(event.target.value); setTokenVerified(false); setCode(""); }} placeholder="Admin token" autoComplete="current-password" className="w-full appearance-none rounded-full border border-gray-400 bg-white px-5 py-3 font-sans text-sm text-gray-1200 outline-none shadow-none focus:border-gray-1200 focus:outline-none" required />
                  <button type="submit" disabled={loading || !token} className="rounded-full bg-gray-1200 px-5 py-3 font-sans text-sm font-semibold text-white transition-opacity hover:opacity-80 disabled:opacity-50">{loading ? "Verifying" : "Continue"}</button>
                </form>
              ) : (
                <form onSubmit={login} className="mt-6 flex flex-col gap-3">
                  <div className="flex items-center justify-between gap-3 rounded-full bg-gray-100 px-4 py-2 font-sans text-xs text-gray-1000"><span>Admin token verified</span><button type="button" onClick={() => { setTokenVerified(false); setCode(""); }} className="underline underline-offset-4 hover:text-gray-1200">Change</button></div>
                  <label htmlFor="admin-code" className="sr-only">Authenticator code</label>
                  <div className="relative">
                    <input id="admin-code" aria-label="Authenticator code" inputMode="numeric" pattern="[0-9]{6}" maxLength={6} value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))} autoComplete="one-time-code" style={{ letterSpacing: "0px", fontFamily: "var(--font-inter), Inter, sans-serif" }} className="w-full appearance-none rounded-full border border-gray-400 bg-white px-5 py-3 admin-code-input text-center font-sans text-base font-medium tabular-nums tracking-normal text-gray-1200 outline-none shadow-none focus:border-gray-1200 focus:outline-none" required autoFocus />
                    {!code ? <span aria-hidden="true" style={{ letterSpacing: "0px", fontFamily: "var(--font-inter), Inter, sans-serif" }} className="pointer-events-none absolute inset-0 flex items-center justify-center px-5 font-sans text-base text-gray-400">Authenticator code</span> : null}
                  </div>
                  <button type="submit" disabled={loading || code.length !== 6} className="rounded-full bg-gray-1200 px-5 py-3 font-sans text-sm font-semibold text-white transition-opacity hover:opacity-80 disabled:opacity-50">{loading ? "Checking" : "Open queue"}</button>
                </form>
              )}
            </>
          )}
          {error ? <p role="alert" className="mt-3 text-sm text-gray-1000">{error}</p> : null}
        </section>
      </main>
    );
  }

  return (
    <main id="admin-feedback-page" className="mx-auto w-full max-w-[760px] min-w-0 px-5 py-8 sm:px-6 sm:py-20">
      <header className="flex items-start justify-between gap-6">
        <div>
          <h1 className="font-serif text-3xl text-gray-1200">Feedback review</h1>
          <p className="mt-2 font-sans text-sm text-gray-1000">
            {identity?.name || "Admin"} <span aria-hidden="true">·</span> {identity?.role || "Authorized reviewer"}
          </p>
          <p className="mt-1 font-sans text-sm text-gray-1000">{records.length} item{records.length === 1 ? "" : "s"} in the queue</p>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2">
          <button type="button" onClick={() => void createTestFeedback()} disabled={loading} className="rounded-full border border-gray-300 px-4 py-2 text-sm text-gray-1000 transition-colors hover:border-gray-1200 disabled:opacity-50">Send test feedback</button>
          <button type="button" onClick={() => void logout()} disabled={loading} className="rounded-full border border-red-200 px-4 py-2 text-sm text-red-600 transition-colors hover:border-red-500 hover:bg-red-50 disabled:opacity-50">Log out</button>
        </div>
      </header>
      {error ? <p role="alert" className="mt-5 text-sm text-gray-1000">{error}</p> : null}

      <section aria-labelledby="analytics-heading" className="mt-10">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <div>
            <h2 id="analytics-heading" className="font-serif text-2xl text-gray-1200">Site analytics</h2>
            <p className="mt-1 text-xs text-gray-1000">Anonymous copies from Supabase. No IP addresses or user agents.</p>
          </div>
          {analytics?.available ? <span className="text-xs text-gray-1000">Updated when this page loads</span> : null}
        </div>
        {!analytics?.available ? (
          <p className="mt-4 rounded-2xl border border-gray-300 px-5 py-4 text-sm text-gray-1000">Analytics views are unavailable. Run the analytics migration or check the Supabase connection.</p>
        ) : (
          <div className="mt-4 grid gap-3 lg:grid-cols-3">
            <div className="min-w-0 rounded-2xl border border-gray-300 p-4">
              <h3 className="text-sm font-semibold text-gray-1200">Daily</h3>
              <div className="mt-3 overflow-x-auto">
                <table className="w-full min-w-[300px] text-left text-xs">
                  <thead className="text-gray-1000"><tr><th className="pb-2 pr-3 font-medium">Day</th><th className="pb-2 pr-3 font-medium">Event</th><th className="pb-2 pr-3 font-medium">Events</th><th className="pb-2 font-medium">Visitors</th></tr></thead>
                  <tbody>{analytics.daily.slice(0, 8).map((row, index) => <tr key={`${String(row.day)}-${String(row.event)}-${index}`} className="border-t border-gray-200"><td className="py-2 pr-3 whitespace-nowrap">{dateLabel(row.day)}</td><td className="py-2 pr-3">{String(row.event ?? "—")}</td><td className="py-2 pr-3">{metric(row.events)}</td><td className="py-2">{metric(row.visitors)}</td></tr>)}</tbody>
                </table>
                {!analytics.daily.length ? <p className="text-xs text-gray-1000">No daily data yet.</p> : null}
              </div>
            </div>
            <div className="min-w-0 rounded-2xl border border-gray-300 p-4">
              <h3 className="text-sm font-semibold text-gray-1200">Pages</h3>
              <div className="mt-3 overflow-x-auto">
                <table className="w-full min-w-[320px] text-left text-xs">
                  <thead className="text-gray-1000"><tr><th className="pb-2 pr-3 font-medium">Page</th><th className="pb-2 pr-3 font-medium">Views</th><th className="pb-2 pr-3 font-medium">Time</th><th className="pb-2 font-medium">Scroll</th></tr></thead>
                  <tbody>{analytics.pages.slice(0, 8).map((row, index) => <tr key={`${String(row.page_path)}-${index}`} className="border-t border-gray-200"><td className="max-w-[150px] truncate py-2 pr-3" title={String(row.page_path ?? "")}>{String(row.page_path ?? "—")}</td><td className="py-2 pr-3">{metric(row.views)}</td><td className="py-2 pr-3">{metric(row.avg_seconds, "s")}</td><td className="py-2">{metric(row.avg_scroll_percent, "%")}</td></tr>)}</tbody>
                </table>
                {!analytics.pages.length ? <p className="text-xs text-gray-1000">No page data yet.</p> : null}
              </div>
            </div>
            <div className="min-w-0 rounded-2xl border border-gray-300 p-4">
              <h3 className="text-sm font-semibold text-gray-1200">Flow</h3>
              <div className="mt-3 overflow-x-auto">
                <table className="w-full min-w-[300px] text-left text-xs">
                  <thead className="text-gray-1000"><tr><th className="pb-2 pr-3 font-medium">From</th><th className="pb-2 pr-3 font-medium">To</th><th className="pb-2 pr-3 font-medium">Moves</th><th className="pb-2 font-medium">Time</th></tr></thead>
                  <tbody>{analytics.flow.slice(0, 8).map((row, index) => <tr key={`${String(row.from_path)}-${String(row.next_page)}-${index}`} className="border-t border-gray-200"><td className="max-w-[110px] truncate py-2 pr-3" title={String(row.from_path ?? "")}>{String(row.from_path ?? "—")}</td><td className="max-w-[110px] truncate py-2 pr-3" title={String(row.next_page ?? "")}>{String(row.next_page ?? "—")}</td><td className="py-2 pr-3">{metric(row.moves)}</td><td className="py-2">{metric(row.avg_seconds_before_leaving, "s")}</td></tr>)}</tbody>
                </table>
                {!analytics.flow.length ? <p className="text-xs text-gray-1000">No flow data yet.</p> : null}
              </div>
            </div>
            <div className="min-w-0 rounded-2xl border border-gray-300 p-4">
              <h3 className="text-sm font-semibold text-gray-1200">Acquisition</h3>
              <div className="mt-3 overflow-x-auto">
                <table className="w-full min-w-[360px] text-left text-xs">
                  <thead className="text-gray-1000"><tr><th className="pb-2 pr-3 font-medium">Source / medium</th><th className="pb-2 pr-3 font-medium">Campaign</th><th className="pb-2 pr-3 font-medium">Visitors</th><th className="pb-2 font-medium">Conv.</th></tr></thead>
                  <tbody>{analytics.acquisition.slice(0, 8).map((row, index) => <tr key={`${String(row.source)}-${String(row.campaign)}-${index}`} className="border-t border-gray-200"><td className="max-w-[150px] truncate py-2 pr-3" title={`${String(row.source ?? "")} / ${String(row.medium ?? "")}`}>{String(row.source ?? "—")} / {String(row.medium ?? "—")}</td><td className="max-w-[130px] truncate py-2 pr-3" title={String(row.campaign ?? "")}>{String(row.campaign ?? "—")}</td><td className="py-2 pr-3">{metric(row.visitors)}</td><td className="py-2">{metric(row.conversions)}</td></tr>)}</tbody>
                </table>
                {!analytics.acquisition.length ? <p className="text-xs text-gray-1000">No acquisition data yet.</p> : null}
              </div>
            </div>
            <div className="min-w-0 rounded-2xl border border-gray-300 p-4">
              <h3 className="text-sm font-semibold text-gray-1200">Conversions</h3>
              <div className="mt-3 overflow-x-auto">
                <table className="w-full min-w-[360px] text-left text-xs">
                  <thead className="text-gray-1000"><tr><th className="pb-2 pr-3 font-medium">Event</th><th className="pb-2 pr-3 font-medium">Page</th><th className="pb-2 pr-3 font-medium">Source</th><th className="pb-2 font-medium">Campaign</th></tr></thead>
                  <tbody>{analytics.conversions.slice(0, 8).map((row, index) => <tr key={`${String(row.occurred_at)}-${index}`} className="border-t border-gray-200"><td className="py-2 pr-3 whitespace-nowrap">{String(row.conversion ?? "—")}</td><td className="max-w-[110px] truncate py-2 pr-3" title={String(row.page_path ?? "")}>{String(row.page_path ?? "—")}</td><td className="py-2 pr-3">{String(row.source ?? "—")}</td><td className="max-w-[110px] truncate py-2" title={String(row.campaign ?? "")}>{String(row.campaign ?? "—")}</td></tr>)}</tbody>
                </table>
                {!analytics.conversions.length ? <p className="text-xs text-gray-1000">No conversions yet.</p> : null}
              </div>
            </div>
          </div>
        )}
      </section>

      <div className="mt-10 grid gap-4">
        {!records.length ? <p className="rounded-2xl border border-gray-300 px-5 py-6 text-gray-1000">The queue is empty.</p> : null}
        {records.map((record) => (
          <article key={record.id} className="rounded-2xl border border-gray-300 px-5 py-5 sm:px-6">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-gray-1000"><span className="font-medium text-gray-1200">{record.name || "Anonymous"}</span>{record.email ? <span>{record.email}</span> : null}<span>·</span><time dateTime={record.submitted_at}>{new Date(record.submitted_at).toLocaleString()}</time></div>
            <p className="mt-4 whitespace-pre-wrap text-[15px] leading-relaxed text-gray-1200">{record.message}</p>
            <div className="mt-5 flex flex-wrap items-center gap-2"><button type="button" onClick={() => void moderate(record.id, "publish")} disabled={loading} className="rounded-full bg-gray-1200 px-4 py-2 text-sm font-semibold text-white hover:opacity-80 disabled:opacity-50">Publish</button><button type="button" onClick={() => void moderate(record.id, "reject")} disabled={loading} className="rounded-full border border-gray-300 px-4 py-2 text-sm text-gray-1000 hover:border-gray-1200 disabled:opacity-50">Reject</button><span className="max-w-full break-all text-xs text-gray-1000">{record.page_url}</span></div>
          </article>
        ))}
      </div>
    </main>
  );
}
