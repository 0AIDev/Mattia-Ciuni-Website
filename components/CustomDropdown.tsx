"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

type DropdownOption = {
  value: string;
  label: string;
  leading?: ReactNode;
  suffix?: ReactNode;
};

type CustomDropdownProps = {
  value: string;
  options: DropdownOption[];
  onChange: (value: string) => void;
  label: string;
  className?: string;
  compact?: boolean;
};

function Chevron({ open }: { open: boolean }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 16 16" fill="none" className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`}>
      <path d="m4 6 4 4 4-4" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
    </svg>
  );
}

export function CustomDropdown({ value, options, onChange, label, className = "", compact = false }: CustomDropdownProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const selected = options.find((option) => option.value === value) || options[0];

  useEffect(() => {
    if (!open) return;
    function closeOnOutside(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", closeOnOutside);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("mousedown", closeOnOutside);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);

  function choose(nextValue: string) {
    onChange(nextValue);
    setOpen(false);
  }

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <button
        type="button"
        aria-label={label}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
        className={compact
          ? "flex min-h-9 w-full items-center justify-between gap-2 rounded-full border border-gray-300 bg-transparent px-3 text-left text-sm text-gray-1200 transition-colors hover:bg-gray-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-1200"
          : "flex min-h-11 w-full items-center justify-between gap-3 rounded-full border border-gray-300 bg-white px-4 text-left text-sm text-gray-1200 transition-colors hover:border-gray-1000 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-1200"}
      >
        <span className="flex min-w-0 flex-1 items-center gap-2">
          {selected?.leading}
          <span className="min-w-0 flex-1 truncate">{selected?.label}</span>
          {compact ? <span className="shrink-0 text-xs text-gray-1000">{selected?.suffix}</span> : null}
        </span>
        <Chevron open={open} />
      </button>
      {open ? (
        <div
          role="listbox"
          aria-label={label}
          className={compact
            ? "absolute bottom-[calc(100%+0.5rem)] left-1/2 z-30 w-[220px] -translate-x-1/2 overflow-hidden rounded-[18px] border border-gray-300 bg-white p-1.5 shadow-[0_8px_24px_rgba(0,0,0,0.12)]"
            : "absolute left-0 right-0 top-[calc(100%+0.5rem)] z-30 overflow-hidden rounded-2xl border border-gray-300 bg-white p-1.5 shadow-[0_12px_35px_rgba(0,0,0,0.12)]"}
        >
          {options.map((option) => (
            <button
              key={option.value}
              title={compact ? option.label : undefined}
              type="button"
              role="option"
              aria-selected={option.value === value}
              onClick={() => choose(option.value)}
              className={compact
                ? `flex w-full items-center justify-between gap-3 rounded-[12px] px-3 py-1.5 text-left text-sm text-gray-1200 transition-colors hover:bg-gray-100 ${option.value === value ? "bg-gray-100" : ""}`
                : "flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-left text-sm text-gray-1200 transition-colors hover:bg-gray-100"}
            >
              <span className="flex min-w-0 items-center gap-2">
                {option.leading}
                <span className="min-w-0 flex-1 whitespace-nowrap">{option.label}</span>
              </span>
              {compact ? <span className="ml-auto shrink-0 text-xs text-gray-1000">{option.suffix}</span> : option.value === value ? <span aria-hidden="true" className="text-sm">✓</span> : null}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
