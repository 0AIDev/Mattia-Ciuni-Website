"use client";

import { useEffect, useState } from "react";

/**
 * Il toggle del tema nel footer.
 *
 * Minimal per scelta: un bottone che mostra il tema verso cui si può passare
 * (la luna nel light, il sole nel dark), no switch animato, no tre stati. Il
 * tema parte adattivo dal device (`prefers-color-scheme`, gestito dallo script
 * inline in app/layout.tsx prima del primo paint) e una volta che la persona
 * sceglie, la sua scelta vince e resta in localStorage.
 *
 * Il valore si legge dopo il mount per non rompere l'idratazione: lo script
 * inline ha già messo la classe su <html>, qui si legge solo per disegnare
 * l'icona giusta. Al click si scrive localStorage, si toggla la classe e si
 * aggiorna `color-scheme` (scrollbar, form controls, `100vh` su mobile).
 */
export function ThemeToggle() {
  const [dark, setDark] = useState<boolean | null>(null);

  useEffect(() => {
    setDark(document.documentElement.classList.contains("dark"));
  }, []);

  function choose(next: boolean) {
    setDark(next);
    const root = document.documentElement;
    root.classList.toggle("dark", next);
    root.style.colorScheme = next ? "dark" : "light";
    try {
      localStorage.setItem("mattia-ciuni-theme", next ? "dark" : "light");
    } catch {
      // Storage bloccato (es. browsing privato rigido): il tema cambia per la
      // sessione e nessuno se ne accorge, non e' un errore da mostrare.
    }
  }

  // Prima dell'idratazione il bottone esiste ma non mostra l'icona: evita lo
  // scambio di glifo al paint (sempre lo stesso spazio, niente layout shift).
  const label = dark === null ? "Theme" : dark ? "Switch to light mode" : "Switch to dark mode";

  return (
    <button
      type="button"
      onClick={() => dark !== null && choose(!dark)}
      aria-label={label}
      title={label}
      className="inline-flex h-6 w-6 items-center justify-center rounded-full text-gray-1000 transition-colors hover:text-gray-1200"
    >
      {dark === null ? null : dark ? (
        // Sole: visibile in dark, porta al light.
        <svg aria-hidden="true" viewBox="0 0 20 20" fill="none" className="h-4 w-4">
          <circle cx="10" cy="10" r="3.75" stroke="currentColor" strokeWidth="1.5" />
          <path d="M10 2.5v1.75M10 15.75V17.5M2.5 10h1.75M15.75 10H17.5M4.7 4.7l1.24 1.24M14.06 14.06l1.24 1.24M15.3 4.7l-1.24 1.24M5.94 14.06 4.7 15.3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      ) : (
        // Luna: visibile in light, porta al dark.
        <svg aria-hidden="true" viewBox="0 0 20 20" fill="none" className="h-4 w-4">
          <path d="M16.5 12.4A7 7 0 0 1 7.6 3.5a7 7 0 1 0 8.9 8.9Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
        </svg>
      )}
    </button>
  );
}
