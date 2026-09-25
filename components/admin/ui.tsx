"use client";

import type { ReactNode } from "react";
import { CustomDropdown } from "@/components/CustomDropdown";

/**
 * Le primitive del pannello.
 *
 * Sono qui, e non ripetute in ogni sezione, perche' la coerenza e' una
 * requisito: un pannello con otto sezioni ognuna coi propri border e i propri
 * input sembra otto strumenti diversi invece di uno solo. Ogni valore di
 * classe compare una volta, quindi un ritocco al design system si fa in un
 * posto.
 */

export function Card({ title, action, children, className = "" }: { title: string; action?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={`admin-card border border-[#e5e5e3] bg-white p-5 sm:p-6 ${className}`}>
      <div className="mb-5 flex items-baseline justify-between gap-4 border-b border-[#ededeb] pb-3">
        <h2 className="text-xl font-medium tracking-[-.01em] text-[#111]">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

export function Empty({ children = "No data yet." }: { children?: ReactNode }) {
  return <p className="py-12 text-center text-sm text-[#777]">{children}</p>;
}

export function Table({ headers, rows }: { headers: string[]; rows: ReactNode[][] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[560px] text-left text-[13px]">
        <thead>
          <tr className="border-b border-[#d8d8d8] text-[10px] uppercase tracking-[.14em] text-[#777]">
            {headers.map((header) => <th key={header} className="px-3 pb-3 font-normal first:pl-0">{header}</th>)}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={index} className="border-b border-[#ededed] last:border-0">
              {row.map((cell, cellIndex) => <td key={cellIndex} className="max-w-[300px] truncate px-3 py-3 text-[#333] first:pl-0">{cell}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const CONTROL = "admin-form-control w-full rounded-full border border-[#bbb] bg-transparent px-4 py-2.5 text-sm text-[#111] outline-none focus:border-[#111]";
const AREA = "admin-form-control w-full resize-y rounded-2xl border border-[#bbb] bg-transparent px-4 py-3 text-sm text-[#111] outline-none focus:border-[#111]";

export function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs text-[#777]">{label}</span>
      {children}
      {hint ? <span className="mt-1.5 block text-[11px] leading-5 text-[#999]">{hint}</span> : null}
    </label>
  );
}

export function TextInput({ value, onChange, placeholder, type = "text", disabled }: { value: string; onChange: (value: string) => void; placeholder?: string; type?: string; disabled?: boolean }) {
  return <input type={type} value={value} disabled={disabled} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} className={`${CONTROL} disabled:opacity-50`} />;
}

export function TextArea({ value, onChange, rows = 4, mono, placeholder, disabled }: { value: string; onChange: (value: string) => void; rows?: number; mono?: boolean; placeholder?: string; disabled?: boolean }) {
  return <textarea rows={rows} value={value} disabled={disabled} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} className={`${AREA} ${mono ? "font-mono text-xs leading-5" : ""} disabled:opacity-50`} />;
}

export function Select({ value, onChange, options, label }: { value: string; onChange: (value: string) => void; options: Array<{ value: string; label: string }>; label: string }) {
  return <CustomDropdown value={value} onChange={onChange} label={label} options={options} />;
}

export function Button({ children, onClick, disabled, tone = "quiet", title }: { children: ReactNode; onClick: () => void; disabled?: boolean; tone?: "primary" | "quiet" | "danger"; title?: string }) {
  const tones = {
    primary: "bg-[#111] text-white border-[#111]",
    quiet: "border-[#bbb] text-[#555] hover:border-[#111] hover:text-[#111]",
    danger: "border-[#ccc] text-[#a33] hover:border-[#a33]",
  } as const;
  return (
    <button type="button" title={title} onClick={onClick} disabled={disabled} className={`rounded-full border px-4 py-2.5 text-sm transition-colors disabled:opacity-40 ${tones[tone]}`}>
      {children}
    </button>
  );
}

export function Pill({ children, tone = "neutral" }: { children: ReactNode; tone?: "neutral" | "good" | "warn" | "bad" }) {
  const tones = { neutral: "bg-[#f1f1ef] text-[#666]", good: "bg-[#e8f0e8] text-[#2c5c2c]", warn: "bg-[#f5efe2] text-[#7a5a1f]", bad: "bg-[#f6e9e9] text-[#8c3a3a]" } as const;
  return <span className={`inline-block rounded-full px-2.5 py-0.5 text-[11px] ${tones[tone]}`}>{children}</span>;
}

export function SectionHeader({ eyebrow, title, description, actions }: { eyebrow: string; title: string; description?: string; actions?: ReactNode }) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <p className="text-[10px] uppercase tracking-[.16em] text-[#777]">{eyebrow}</p>
        <h1 className="mt-2 text-4xl font-medium tracking-[-.03em] text-[#111]">{title}</h1>
        {description ? <p className="mt-2 max-w-2xl text-sm leading-6 text-[#666]">{description}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-3">{actions}</div> : null}
    </header>
  );
}

export function Notice({ children, tone = "neutral" }: { children: ReactNode; tone?: "neutral" | "good" | "bad" }) {
  const tones = { neutral: "border-[#e5e5e3] bg-white text-[#333]", good: "border-[#cfe0cf] bg-[#f4f9f4] text-[#2c5c2c]", bad: "border-[#e6cfcf] bg-[#fdf6f6] text-[#8c3a3a]" } as const;
  return <p className={`rounded-2xl border px-4 py-3 text-sm ${tones[tone]}`}>{children}</p>;
}
