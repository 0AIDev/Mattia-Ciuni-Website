"use client";

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

const API = "/api/admin/feedback";

export default function FeedbackAdminPage() {
  const [token, setToken] = useState("");
  const [code, setCode] = useState("");
  const [setup, setSetup] = useState<Setup | null>(null);
  const [mode, setMode] = useState<"loading" | "setup" | "login">("loading");
  const [records, setRecords] = useState<FeedbackRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [authenticated, setAuthenticated] = useState(false);
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
        setRecords([]);
        setMode(data.setup_required ? "setup" : "login");
        if (!quiet && !data.setup_required) setError("The token or authenticator code is not valid.");
        return;
      }
      if (!response.ok) throw new Error(localApiMessage(response));
      const data = (await response.json()) as { records?: FeedbackRecord[] };
      setRecords(data.records || []);
      setAuthenticated(true);
      setMode("login");
      setError("");
    } catch (caught) {
      setAuthenticated(false);
      setMode("login");
      const message = caught instanceof Error ? caught.message : "The review queue is unavailable.";
      // In `next dev` Pages Functions are not mounted. Do not hide that fact on
      // the initial check: otherwise the user types a valid token into a form
      // that can never reach the API and only sees a generic failure later.
      if (!quiet || message.includes("local Pages API")) setError(message);
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
      setAuthenticated(false);
      setMode("login");
      setError("");
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

  if (!authenticated) {
    return (
      <main id="admin-feedback-page" className="mx-auto flex min-h-screen max-w-[460px] items-center px-6 py-12 font-sans">
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
              <div className="mt-6 flex justify-center"><img src={setup.qr_data_url} alt="One-time authenticator setup QR code" width={240} height={240} className="rounded-2xl" /></div>
              <p className="mt-4 break-all rounded-2xl bg-gray-100 px-4 py-3 font-mono text-xs text-gray-1000">{setup.manual_key}</p>
              <form onSubmit={confirmSetup} className="mt-4 flex flex-col gap-3">
                <label htmlFor="setup-code" className="sr-only">Authenticator code</label>
                <input id="setup-code" inputMode="numeric" pattern="[0-9]{6}" maxLength={6} value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))} placeholder="6-digit code" autoComplete="one-time-code" className="w-full appearance-none rounded-full border border-gray-400 bg-white px-5 py-3 text-center text-sm tracking-[0.3em] text-gray-1200 outline-none shadow-none focus:border-gray-1200 focus:outline-none" required />
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
                  <input id="admin-code" inputMode="numeric" pattern="[0-9]{6}" maxLength={6} value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))} placeholder="Authenticator code" autoComplete="one-time-code" className="w-full appearance-none rounded-full border border-gray-400 bg-white px-5 py-3 font-sans text-center text-sm tracking-[0.3em] text-gray-1200 outline-none shadow-none focus:border-gray-1200 focus:outline-none" required autoFocus />
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
    <main id="admin-feedback-page" className="mx-auto max-w-[760px] px-6 py-12 sm:py-20">
      <header className="flex items-start justify-between gap-6">
        <div><h1 className="font-serif text-3xl text-gray-1200">Feedback review</h1><p className="mt-2 text-sm text-gray-1000">{records.length} item{records.length === 1 ? "" : "s"} in the queue</p></div>
        <button type="button" onClick={() => void logout()} className="rounded-full border border-gray-300 px-4 py-2 text-sm text-gray-1000 hover:border-gray-1200">Log out</button>
      </header>
      {error ? <p role="alert" className="mt-5 text-sm text-gray-1000">{error}</p> : null}
      <div className="mt-10 grid gap-4">
        {!records.length ? <p className="rounded-2xl border border-gray-300 px-5 py-6 text-gray-1000">The queue is empty.</p> : null}
        {records.map((record) => (
          <article key={record.id} className="rounded-2xl border border-gray-300 px-5 py-5 sm:px-6">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-gray-1000"><span className="font-medium text-gray-1200">{record.name || "Anonymous"}</span>{record.email ? <span>{record.email}</span> : null}<span>·</span><time dateTime={record.submitted_at}>{new Date(record.submitted_at).toLocaleString()}</time></div>
            <p className="mt-4 whitespace-pre-wrap text-[15px] leading-relaxed text-gray-1200">{record.message}</p>
            <div className="mt-5 flex flex-wrap items-center gap-2"><button type="button" onClick={() => void moderate(record.id, "publish")} disabled={loading} className="rounded-full bg-gray-1200 px-4 py-2 text-sm font-semibold text-white hover:opacity-80 disabled:opacity-50">Publish</button><button type="button" onClick={() => void moderate(record.id, "reject")} disabled={loading} className="rounded-full border border-gray-300 px-4 py-2 text-sm text-gray-1000 hover:border-gray-1200 disabled:opacity-50">Reject</button><span className="text-xs text-gray-1000">{record.page_url}</span></div>
          </article>
        ))}
      </div>
    </main>
  );
}
