"use client";

import { FormEvent, useState } from "react";

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

export default function FeedbackAdminPage() {
  const [token, setToken] = useState("");
  const [records, setRecords] = useState<FeedbackRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [authenticated, setAuthenticated] = useState(false);

  async function load(value = token) {
    if (!value) return;
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/admin/feedback", {
        headers: { Authorization: `Bearer ${value}` },
        cache: "no-store",
      });
      const data = (await response.json().catch(() => ({}))) as { records?: FeedbackRecord[]; code?: string };
      if (!response.ok) throw new Error(data.code === "unauthorized" ? "That admin token is not valid." : "The review queue is unavailable.");
      setRecords(data.records || []);
      setAuthenticated(true);
    } catch (caught) {
      setAuthenticated(false);
      setError(caught instanceof Error ? caught.message : "The review queue is unavailable.");
    } finally {
      setLoading(false);
    }
  }

  async function login(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/admin/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "login", token }),
      });
      if (!response.ok) throw new Error("That admin token is not valid.");
      await load(token);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Login failed.");
      setLoading(false);
    }
  }

  async function moderate(id: string, action: "publish" | "reject") {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/admin/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, id }),
      });
      if (!response.ok) throw new Error("The feedback could not be updated.");
      await load(token);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "The feedback could not be updated.");
      setLoading(false);
    }
  }

  function logout() {
    setToken("");
    setRecords([]);
    setAuthenticated(false);
  }

  if (!authenticated) {
    return (
      <main className="mx-auto flex min-h-screen max-w-[460px] items-center px-6 py-12">
        <section className="w-full rounded-3xl border border-gray-300 bg-white p-6 sm:p-8">
          <p className="text-xs uppercase tracking-[0.18em] text-gray-1000">Private</p>
          <h1 className="mt-3 font-serif text-3xl text-gray-1200">Feedback review</h1>
          <p className="mt-3 text-sm leading-relaxed text-gray-1000">The queue is private. Enter the admin token to review submissions.</p>
          <form onSubmit={login} className="mt-6 flex flex-col gap-3">
            <label htmlFor="admin-token" className="sr-only">Admin token</label>
            <input id="admin-token" type="password" value={token} onChange={(event) => setToken(event.target.value)} placeholder="Admin token" autoComplete="current-password" className="w-full rounded-full border border-gray-400 bg-white px-5 py-3 text-sm text-gray-1200 outline-none focus:border-gray-1200 focus:outline-none" required />
            <button type="submit" disabled={loading} className="rounded-full bg-gray-1200 px-5 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-80 disabled:opacity-50">{loading ? "Checking" : "Open queue"}</button>
          </form>
          {error ? <p role="alert" className="mt-3 text-sm text-gray-1000">{error}</p> : null}
        </section>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-[760px] px-6 py-12 sm:py-20">
      <header className="flex items-start justify-between gap-6">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-gray-1000">Private</p>
          <h1 className="mt-3 font-serif text-3xl text-gray-1200">Feedback review</h1>
          <p className="mt-2 text-sm text-gray-1000">{records.length} item{records.length === 1 ? "" : "s"} in the queue</p>
        </div>
        <button type="button" onClick={logout} className="rounded-full border border-gray-300 px-4 py-2 text-sm text-gray-1000 hover:border-gray-1200">Log out</button>
      </header>
      {error ? <p role="alert" className="mt-5 text-sm text-gray-1000">{error}</p> : null}
      <div className="mt-10 grid gap-4">
        {!records.length ? <p className="rounded-2xl border border-gray-300 px-5 py-6 text-gray-1000">The queue is empty.</p> : null}
        {records.map((record) => (
          <article key={record.id} className="rounded-2xl border border-gray-300 px-5 py-5 sm:px-6">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-gray-1000">
              <span className="font-medium text-gray-1200">{record.name || "Anonymous"}</span>
              {record.email ? <span>{record.email}</span> : null}
              <span>·</span>
              <time dateTime={record.submitted_at}>{new Date(record.submitted_at).toLocaleString()}</time>
            </div>
            <p className="mt-4 whitespace-pre-wrap text-[15px] leading-relaxed text-gray-1200">{record.message}</p>
            <div className="mt-5 flex flex-wrap items-center gap-2">
              <button type="button" onClick={() => void moderate(record.id, "publish")} disabled={loading} className="rounded-full bg-gray-1200 px-4 py-2 text-sm font-semibold text-white hover:opacity-80 disabled:opacity-50">Publish</button>
              <button type="button" onClick={() => void moderate(record.id, "reject")} disabled={loading} className="rounded-full border border-gray-300 px-4 py-2 text-sm text-gray-1000 hover:border-gray-1200 disabled:opacity-50">Reject</button>
              <span className="text-xs text-gray-1000">{record.page_url}</span>
            </div>
          </article>
        ))}
      </div>
    </main>
  );
}
