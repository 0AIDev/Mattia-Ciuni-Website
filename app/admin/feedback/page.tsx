"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";

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

/**
 * La coda di review, privata.
 *
 * Dopo l'audit del 21/09 il token **non vive in React**: serve una volta sola, per
 * il login, e da lì in avanti la credenziale è il cookie di sessione (HttpOnly,
 * `__Host-`, SameSite=Strict) che il browser manda da sé sulle richieste
 * same-origin. Prima il token restava nello stato del componente e in ogni header
 * `Authorization`: bastava un errore in un componente qualsiasi per averlo in mano.
 *
 * Il "Log out" adesso chiude davvero: la sessione viene cancellata lato server.
 */
export default function FeedbackAdminPage() {
  const [token, setToken] = useState("");
  const [records, setRecords] = useState<FeedbackRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [authenticated, setAuthenticated] = useState(false);

  /**
   * Nessun parametro segreto: se la sessione è valida, il cookie basta. Lo stato
   * `loading` lo tengono i chiamanti (login e moderate), non questa funzione:
   * così il controllo silenzioso all'avvio non accende nessuno spinner, e nessun
   * `setState` parte prima di un `await` dentro un effetto.
   */
  const load = useCallback(async ({ quiet = false } = {}) => {
    try {
      const response = await fetch("/api/admin/feedback", { cache: "no-store" });
      if (response.status === 401) {
        setAuthenticated(false);
        setRecords([]);
        if (!quiet) setError("That admin token is not valid.");
        return;
      }
      const data = (await response.json().catch(() => ({}))) as {
        records?: FeedbackRecord[];
      };
      if (!response.ok) throw new Error("The review queue is unavailable.");
      setRecords(data.records || []);
      setAuthenticated(true);
      setError("");
    } catch (caught) {
      setAuthenticated(false);
      if (!quiet) {
        setError(caught instanceof Error ? caught.message : "The review queue is unavailable.");
      }
    }
  }, []);

  // All'apertura si prova la sessione esistente in silenzio: se c'è, la coda
  // appare senza chiedere di nuovo il token; se non c'è, resta il modulo.
  //
  // La regola `set-state-in-effect` è disattivata di proposito e solo qui: è la
  // lettura di una sessione al montaggio, e nessuno `setState` parte prima di un
  // `await` — cioè prima che il componente sia montato. L'alternativa che la
  // regola suggerisce (derivare lo stato nel render) non può funzionare: la
  // risposta arriva da una richiesta di rete.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load({ quiet: true });
  }, [load]);

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
      if (response.status === 429) {
        throw new Error("Too many attempts. Try again in a few minutes.");
      }
      if (!response.ok) throw new Error("That admin token is not valid.");
      // Il token non viene conservato: da qui in avanti conta il cookie.
      setToken("");
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
      await fetch("/api/admin/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "logout" }),
      });
    } catch {
      // Anche se la richiesta non arriva, lo stato locale viene azzerato.
    } finally {
      setToken("");
      setRecords([]);
      setAuthenticated(false);
      setError("");
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
      await load();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "The feedback could not be updated.");
    } finally {
      setLoading(false);
    }
  }

  if (!authenticated) {
    return (
      <main className="mx-auto flex min-h-screen max-w-[460px] items-center px-6 py-12">
        <section className="w-full rounded-3xl border border-gray-300 bg-white p-6 sm:p-8">
          <h1 className="font-serif text-3xl text-gray-1200">Feedback review</h1>
          <p className="mt-3 text-sm leading-relaxed text-gray-1000">
            The queue is private. Enter the admin token to review submissions.
          </p>
          {/* Il modulo si vede subito e la sessione si controlla in sottofondo
              (vedi l'effetto sopra): se è valida, la coda prende il posto del
              modulo da sola. Niente stato "sto controllando": un modulo che
              compare dopo qualche centinaio di millisecondi è peggio di un
              modulo che era già lì, e il modulo non è un segreto. */}
          <form onSubmit={login} className="mt-6 flex flex-col gap-3">
              <label htmlFor="admin-token" className="sr-only">
                Admin token
              </label>
              <input
                id="admin-token"
                type="password"
                value={token}
                onChange={(event) => setToken(event.target.value)}
                placeholder="Admin token"
                autoComplete="current-password"
                className="w-full rounded-full border border-gray-400 bg-white px-5 py-3 text-sm text-gray-1200 outline-none focus:border-gray-1200 focus:outline-none"
                required
              />
              <button
                type="submit"
                disabled={loading}
                className="rounded-full bg-gray-1200 px-5 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-80 disabled:opacity-50"
              >
                {loading ? "Checking" : "Open queue"}
              </button>
          </form>
          {error ? (
            <p role="alert" className="mt-3 text-sm text-gray-1000">
              {error}
            </p>
          ) : null}
        </section>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-[760px] px-6 py-12 sm:py-20">
      <header className="flex items-start justify-between gap-6">
        <div>
          <h1 className="font-serif text-3xl text-gray-1200">Feedback review</h1>
          <p className="mt-2 text-sm text-gray-1000">
            {records.length} item{records.length === 1 ? "" : "s"} in the queue
          </p>
        </div>
        <button
          type="button"
          onClick={() => void logout()}
          className="rounded-full border border-gray-300 px-4 py-2 text-sm text-gray-1000 hover:border-gray-1200"
        >
          Log out
        </button>
      </header>
      {error ? (
        <p role="alert" className="mt-5 text-sm text-gray-1000">
          {error}
        </p>
      ) : null}
      <div className="mt-10 grid gap-4">
        {!records.length ? (
          <p className="rounded-2xl border border-gray-300 px-5 py-6 text-gray-1000">
            The queue is empty.
          </p>
        ) : null}
        {records.map((record) => (
          <article key={record.id} className="rounded-2xl border border-gray-300 px-5 py-5 sm:px-6">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-gray-1000">
              <span className="font-medium text-gray-1200">{record.name || "Anonymous"}</span>
              {record.email ? <span>{record.email}</span> : null}
              <span>·</span>
              <time dateTime={record.submitted_at}>
                {new Date(record.submitted_at).toLocaleString()}
              </time>
            </div>
            <p className="mt-4 whitespace-pre-wrap text-[15px] leading-relaxed text-gray-1200">
              {record.message}
            </p>
            <div className="mt-5 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => void moderate(record.id, "publish")}
                disabled={loading}
                className="rounded-full bg-gray-1200 px-4 py-2 text-sm font-semibold text-white hover:opacity-80 disabled:opacity-50"
              >
                Publish
              </button>
              <button
                type="button"
                onClick={() => void moderate(record.id, "reject")}
                disabled={loading}
                className="rounded-full border border-gray-300 px-4 py-2 text-sm text-gray-1000 hover:border-gray-1200 disabled:opacity-50"
              >
                Reject
              </button>
              <span className="text-xs text-gray-1000">{record.page_url}</span>
            </div>
          </article>
        ))}
      </div>
    </main>
  );
}
