"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Lo stato del deploy, letto dalla Function.
 *
 * `available` falso vuol dire che il file di build non c'e' ancora: nasce con la
 * build successiva alla modifica che l'ha introdotto, quindi su un deploy
 * precedente la risposta giusta e' "non lo so", non "non e' online".
 */
type DeployState = {
  available: boolean;
  /** `null` quando la domanda non aveva un `since`: non lo so, non "online". */
  live: boolean | null;
  built_at?: string;
  waited_seconds: number | null;
  origin?: string;
};

const API = "/api/admin/feedback";

/** Frequenza di lettura: stretta mentre qualcosa e' in arrivo, lenta quando no. */
const PENDING_INTERVAL = 4000;
const IDLE_INTERVAL = 30000;

function relative(seconds: number): string {
  const total = Math.max(0, Math.round(seconds));
  if (total < 60) return `${total}s`;
  const minutes = Math.floor(total / 60);
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} h`;
  return `${Math.floor(hours / 24)} d`;
}

/**
 * Una riga che chiude il cerchio: pubblicare, guardare "Deploying", vedere
 * "Live".
 *
 * Senza questo il pannello diceva "published" e lasciava il resto a te: il
 * commit e' partito, ma la build dura ancora, e l'unico modo di saperlo era
 * aprire il sito e ricaricare a mano. Un publish che sembra non essere avvenuto
 * e' il modo piu' rapido per convincersi che il pannello abbia perso il lavoro.
 */
export function DeployStatusLine({
  pendingSince,
  onLive,
  className = "",
}: {
  /** L'istante del publish, dal clock della Function: se c'e', qualcosa arriva. */
  pendingSince?: string | null;
  onLive?: () => void;
  className?: string;
}) {
  const [state, setState] = useState<(DeployState & { since: string | null }) | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const liveReported = useRef<string | null>(null);

  const read = useCallback(async (since?: string | null) => {
    try {
      const response = await fetch(API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(since ? { action: "deploy_status", since } : { action: "deploy_status" }),
        cache: "no-store",
      });
      if (!response.ok) return;
      const data = (await response.json().catch(() => null)) as DeployState | null;
      if (data && (typeof data.live === "boolean" || data.live === null)) {
        // Il `since` della domanda viaggia con la risposta: e' l'unico modo per
        // sapere che questa lettura riguarda il publish che sto aspettando, e
        // non una richiesta di stato di un secondo prima.
        setState({ ...data, since: since ?? null });
        setNow(Date.now());
      }
    } catch {
      // Una lettura fallita non e' un errore da mostrare: il prossimo giro
      // riprova e la riga resta com'era invece di saltare.
    }
  }, []);

  useEffect(() => {
    void read(pendingSince);
    const timer = window.setInterval(() => void read(pendingSince), pendingSince ? PENDING_INTERVAL : IDLE_INTERVAL);
    return () => window.clearInterval(timer);
  }, [read, pendingSince]);

  // L'orologio locale serve solo a far scorrere i secondi fra una lettura e
  // l'altra: e' quello che l'utente guarda, non il numero esatto.
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), pendingSince ? 1000 : 5000);
    return () => window.clearInterval(timer);
  }, [pendingSince]);

  useEffect(() => {
    if (!pendingSince || !state?.live || !onLive) return;
    // Solo una lettura fatta *per* questo publish puo' dichiararlo online.
    // Senza questo, la risposta di una semplice lettura di stato (che non ha un
    // `since`) arrivava dopo il click e chiudeva il conto subito, dicendo "live"
    // mentre la build era ancora in coda: il conto che il pannello deve chiudere
    // spariva al primo giro di polling.
    if (state.since !== pendingSince) return;
    if (liveReported.current === pendingSince) return;
    liveReported.current = pendingSince;
    onLive();
  }, [onLive, pendingSince, state]);

  if (!state || !state.available) {
    return <p className={`truncate text-[11px] text-admin-faint ${className}`}>Last build: unknown</p>;
  }

  if (pendingSince && !state.live) {
    return (
      <p className={`flex items-center gap-1.5 truncate text-[11px] text-admin-muted ${className}`} role="status">
        <span aria-hidden="true" className="h-1 w-1 shrink-0 animate-pulse rounded-full bg-admin-faint" />
        <span className="admin-tabular">Deploying {relative((now - Date.parse(pendingSince)) / 1000)}</span>
      </p>
    );
  }

  // `built_at` arriva dalla macchina che costruisce: per un "3 min fa" l'orologio
  // del browser va benissimo, e la riga resta leggibile anche con il dock spento.
  const builtAt = state.built_at ? Date.parse(state.built_at) : Number.NaN;
  const label = Number.isFinite(builtAt)
    ? `Last build ${relative((now - builtAt) / 1000)} ago`
    : "Last build: unknown";

  return <p className={`truncate text-[11px] text-admin-faint ${className}`} role="status">{label}</p>;
}
