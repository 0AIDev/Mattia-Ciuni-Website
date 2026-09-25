"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { ChevronDownIcon } from "@/components/admin/icons";

/**
 * Le primitive del pannello.
 *
 * Stanno qui, e non ripetute in ogni sezione, perche' la coerenza e' un
 * requisito: un pannello con nove sezioni ognuna coi propri border e i propri
 * input sembra nove strumenti diversi invece di uno solo.
 *
 * Due scelte valgono per tutto il file.
 *
 * La prima: **monocromo**. Non c'e' un colore di stato, ci sono un punto pieno,
 * un punto vuoto e la parola accanto. Un pannello con dieci significati in
 * dieci colori smette di comunicare: qui il significato lo porta il testo, e il
 * colore non serve a niente.
 *
 * La seconda: **compatto**. Le altezze sono 28px per i controlli e 13px per il
 * testo, perche' in uno strumento si guardano cento righe di dati, non una
 * landing page. Le misure compaiono una volta ciascuna, cosi' un ritocco al
 * design system si fa in un posto.
 */

export function Card({ title, action, children, className = "" }: { title: string; action?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={`overflow-hidden rounded-lg border border-admin-line bg-admin-panel ${className}`}>
      <header className="flex min-h-10 items-center justify-between gap-3 border-b border-admin-line px-3.5 py-2">
        <h2 className="text-[13px] font-medium text-admin-ink">{title}</h2>
        {action}
      </header>
      <div className="p-3.5">{children}</div>
    </section>
  );
}

export function Empty({ children = "No data yet." }: { children?: ReactNode }) {
  return <p className="py-10 text-center text-[13px] text-admin-faint">{children}</p>;
}

export function Table({ headers, rows }: { headers: string[]; rows: ReactNode[][] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[520px] border-collapse text-left text-[13px]">
        <thead>
          <tr className="border-b border-admin-line">
            {headers.map((header) => (
              <th key={header} className="px-3 pb-2 text-[11px] font-normal uppercase tracking-[.06em] text-admin-faint first:pl-0">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={index} className="border-b border-admin-line/70 last:border-0">
              {row.map((cell, cellIndex) => (
                <td key={cellIndex} className="max-w-[320px] truncate px-3 py-2 text-admin-ink first:pl-0">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const CONTROL =
  "w-full min-w-0 border border-admin-line bg-admin-panel px-2.5 py-1.5 text-[13px] text-admin-ink outline-none transition-colors placeholder:text-admin-faint hover:border-[#dbdbd8] focus:border-[#c9c9c6] disabled:opacity-50";

export function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[12px] text-admin-muted">{label}</span>
      {children}
      {hint ? <span className="mt-1.5 block text-[11px] leading-4 text-admin-faint">{hint}</span> : null}
    </label>
  );
}

export function TextInput({ value, onChange, placeholder, type = "text", disabled }: { value: string; onChange: (value: string) => void; placeholder?: string; type?: string; disabled?: boolean }) {
  return <input type={type} value={value} disabled={disabled} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} className={CONTROL} />;
}

export function TextArea({ value, onChange, rows = 4, mono, placeholder, disabled }: { value: string; onChange: (value: string) => void; rows?: number; mono?: boolean; placeholder?: string; disabled?: boolean }) {
  return (
    <textarea
      rows={rows}
      value={value}
      disabled={disabled}
      placeholder={placeholder}
      onChange={(event) => onChange(event.target.value)}
      className={`${CONTROL} resize-y ${mono ? "font-mono text-[12px] leading-5" : ""}`}
    />
  );
}

/**
 * La tendina del pannello.
 *
 * Non riusa `CustomDropdown`: quello e' un controllo del sito pubblico, pill e
 * con i colori del tema, e importarlo qui avrebbe portato la forma di una pagina
 * dentro uno strumento. E' anche una dipendenza in meno fra i due mondi: il
 * pannello si puo' ridisegnare senza toccare una pagina pubblica.
 */
export function Select({ value, onChange, options, label }: { value: string; onChange: (value: string) => void; options: Array<{ value: string; label: string }>; label: string }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const selected = options.find((option) => option.value === value) || options[0];

  useEffect(() => {
    if (!open) return;
    function onOutside(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function onEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onOutside);
    document.addEventListener("keydown", onEscape);
    return () => {
      document.removeEventListener("mousedown", onOutside);
      document.removeEventListener("keydown", onEscape);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-label={label}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
        className="flex min-h-7 w-full items-center justify-between gap-2 rounded-md border border-admin-line bg-admin-panel px-2.5 py-1 text-left text-[13px] text-admin-ink transition-colors hover:border-[#dbdbd8]"
      >
        <span className="min-w-0 flex-1 truncate">{selected?.label}</span>
        <ChevronDownIcon className="h-3.5 w-3.5 shrink-0 text-admin-faint" />
      </button>
      {open ? (
        <div role="listbox" aria-label={label} className="absolute left-0 right-0 top-[calc(100%+4px)] z-30 max-h-64 overflow-y-auto rounded-md border border-admin-line bg-admin-panel p-1 shadow-[0_8px_24px_rgba(0,0,0,0.08)]">
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              role="option"
              aria-selected={option.value === value}
              onClick={() => { onChange(option.value); setOpen(false); }}
              className={`flex w-full items-center rounded px-2 py-1.5 text-left text-[13px] transition-colors ${option.value === value ? "bg-admin-soft text-admin-ink" : "text-admin-muted hover:bg-admin-soft hover:text-admin-ink"}`}
            >
              <span className="min-w-0 flex-1 truncate">{option.label}</span>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function Button({ children, onClick, disabled, tone = "quiet", title }: { children: ReactNode; onClick: () => void; disabled?: boolean; tone?: "primary" | "quiet"; title?: string }) {
  const tones = {
    primary: "border-transparent bg-admin-ink text-white hover:bg-[#3d4048]",
    quiet: "border-admin-line bg-admin-panel text-admin-ink hover:bg-admin-soft",
  } as const;
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex h-7 shrink-0 items-center gap-1.5 rounded-md border px-2.5 text-[13px] transition-colors disabled:pointer-events-none disabled:opacity-40 ${tones[tone]}`}
    >
      {children}
    </button>
  );
}

/** Un `Button` che e' solo testo: e' l'azione secondaria di una riga. */
export function InlineButton({ children, onClick, disabled, title }: { children: ReactNode; onClick: () => void; disabled?: boolean; title?: string }) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      disabled={disabled}
      className="text-[12px] text-admin-muted transition-colors hover:text-admin-ink disabled:pointer-events-none disabled:opacity-40"
    >
      {children}
    </button>
  );
}

export function IconButton({ children, onClick, disabled, title }: { children: ReactNode; onClick: () => void; disabled?: boolean; title: string }) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      onClick={onClick}
      disabled={disabled}
      className="inline-flex h-6 w-6 items-center justify-center rounded-md text-admin-faint transition-colors hover:bg-admin-active hover:text-admin-ink disabled:pointer-events-none disabled:opacity-40"
    >
      {children}
    </button>
  );
}

/**
 * Lo stato di una cosa, senza colore.
 *
 * Il punto porta la distinzione che serve a colpo d'occhio (pieno = c'e',
 * vuoto = non c'e'), la parola porta il significato. Se il colore sparisse del
 * tutto il pannello resterebbe leggibile, ed e' esattamente il punto.
 */
export function Pill({ children, tone = "neutral" }: { children: ReactNode; tone?: "neutral" | "good" | "warn" | "bad" }) {
  const dots = {
    neutral: "bg-[#c4c4c1]",
    good: "bg-admin-ink",
    warn: "bg-admin-muted",
    bad: "border border-admin-faint bg-transparent",
  } as const;
  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap text-[11px] text-admin-muted">
      <span aria-hidden="true" className={`h-1.5 w-1.5 shrink-0 rounded-full ${dots[tone]}`} />
      {children}
    </span>
  );
}

export function SectionHeader({ eyebrow, title, description, actions }: { eyebrow: string; title: string; description?: string; actions?: ReactNode }) {
  return (
    <header className="flex flex-wrap items-start justify-between gap-3">
      <div className="min-w-0">
        <p className="text-[12px] text-admin-faint">{eyebrow}</p>
        <h1 className="mt-1 text-[22px] font-semibold tracking-[-.01em] text-admin-ink">{title}</h1>
        {description ? <p className="mt-1.5 max-w-2xl text-[13px] leading-5 text-admin-muted">{description}</p> : null}
      </div>
      {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
    </header>
  );
}

export function Notice({ children, tone = "neutral" }: { children: ReactNode; tone?: "neutral" | "good" | "bad" }) {
  const tones = {
    neutral: "border-admin-line bg-admin-soft text-admin-muted",
    good: "border-admin-line bg-admin-soft text-admin-ink",
    bad: "border-[#d6d6d3] bg-admin-soft text-admin-ink",
  } as const;
  return <p className={`rounded-md border px-3 py-2 text-[13px] leading-5 ${tones[tone]}`}>{children}</p>;
}
