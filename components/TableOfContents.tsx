"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { ChevronRight } from "@/components/icons";
import SectionCopyLink from "@/components/SectionCopyLink";
import { cn } from "@/lib/utils";
import { track } from "@/lib/analytics";
import type { Locale } from "@/lib/i18n";
import { articleUi } from "@/lib/article-ui";

export interface TocItem {
  anchor: string;
  label: string;
}

// Deve combaciare con `scroll-mt-20` degli heading.
const SCROLL_OFFSET = 80;

/**
 * Il click su un link interno è gestito da Lenis (listener globale su
 * `a[href^="#"]`): qui sincronizziamo solo l'URL, così il link alla sezione
 * resta copiabile con l'hash giusto.
 */
function navigateTo(
  event: React.MouseEvent<HTMLAnchorElement>,
  anchor: string,
) {
  const el = document.getElementById(anchor);
  if (!el) return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    event.preventDefault();
    window.scrollTo({
      top: el.getBoundingClientRect().top + window.scrollY - SCROLL_OFFSET,
      behavior: "auto",
    });
  }
  window.history.replaceState(null, "", `#${anchor}`);
}

/** Rail laterale sticky: solo desktop, a sinistra della colonna da 692px. */
export default function TableOfContents({ items, locale = "en" }: { items: TocItem[]; locale?: Locale }) {
  const text = articleUi[locale];
  const key = items.map((item) => item.anchor).join("|");
  const anchors = useMemo(() => key.split("|").filter(Boolean), [key]);
  const [active, setActive] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);
  const frame = useRef(0);

  // Sezione corrente = ultimo heading che ha passato la linea di lettura.
  useEffect(() => {
    if (!anchors.length) return;
    const measure = () => {
      frame.current = 0;
      const line = Math.max(SCROLL_OFFSET, window.innerHeight * 0.12);
      let current: string | null = null;
      for (const anchor of anchors) {
        const el = document.getElementById(anchor);
        if (el && el.getBoundingClientRect().top <= line) current = anchor;
      }
      setActive(current);
    };
    const schedule = () => {
      if (!frame.current) frame.current = window.requestAnimationFrame(measure);
    };
    measure();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      if (frame.current) window.cancelAnimationFrame(frame.current);
    };
  }, [anchors]);

  const onNavigate = useCallback(
    (event: React.MouseEvent<HTMLAnchorElement>, anchor: string) => {
      setActive(anchor);
      track("toc_click", { anchor, label: document.getElementById(anchor)?.textContent?.slice(0, 120) || anchor, placement: "rail" });
      navigateTo(event, anchor);
    },
    [],
  );

  if (!items.length) return null;

  return (
    // Il rail vive dentro l'articolo: sticky durante la lettura e limitato
    // automaticamente ai bordi dell'articolo, senza restare fisso nella pagina.
    <div className="article-toc-shell pointer-events-none absolute inset-y-0 -left-[220px] z-40 hidden w-[220px] justify-end xl:flex">
      <nav
        aria-label={text.onThisPage}
        onMouseEnter={() => setExpanded(true)}
        onMouseLeave={() => setExpanded(false)}
        onFocus={() => setExpanded(true)}
        onBlur={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
            setExpanded(false);
          }
        }}
        className="sticky top-6 flex max-h-[calc(100vh-3rem)] items-center bg-transparent transition-[width] duration-300 ease-out motion-reduce:transition-none pointer-events-auto"
        style={{ width: expanded ? 220 : 32 }}
      >
        <div className="relative flex w-full flex-col pr-6" style={{ gap: 6 }}>
          {items.map((item) => {
            const isActive = active === item.anchor;
            return (
              // Il bottone "copia" è fratello del link, non annidato: un solo
              // bersaglio per volta, così il click non naviga mai per errore.
              <div
                key={item.anchor}
                className="group/row relative flex items-center justify-end transition-[height] duration-300 ease-out motion-reduce:transition-none"
                style={{ height: expanded ? 24 : 8 }}
              >
                <SectionCopyLink
                  anchor={item.anchor}
                  label={item.label}
                  size={14}
                  className={cn(
                    "mr-2 text-neutral-400 transition-opacity duration-300 hover:text-neutral-500 focus-visible:opacity-100 motion-reduce:transition-none",
                    expanded
                      ? "opacity-0 group-hover/row:opacity-100"
                      : "pointer-events-none opacity-0",
                  )}
                />
                <a
                  href={`#${item.anchor}`}
                  onClick={(event) => onNavigate(event, item.anchor)}
                  aria-current={isActive ? "true" : undefined}
                  className="relative flex cursor-pointer items-center"
                  style={{ width: expanded ? "auto" : 12, paddingRight: 0 }}
                >
                  <div
                    aria-hidden="true"
                    className={cn(
                      "absolute right-0 h-0.5 rounded-full transition-all duration-300 ease-out motion-reduce:transition-none",
                      isActive ? "bg-neutral-400" : "bg-neutral-300",
                    )}
                    style={{
                      width: expanded ? 0 : isActive ? 24 : 12,
                      opacity: expanded ? 0 : 1,
                    }}
                  />
                  <span
                    className={cn(
                      "whitespace-nowrap text-right text-xs font-medium transition-all duration-300 ease-out motion-reduce:transition-none",
                      isActive
                        ? "text-neutral-500"
                        : "text-neutral-400 hover:text-neutral-500",
                    )}
                    style={{
                      opacity: expanded ? 1 : 0,
                      transform: expanded ? "none" : "translateX(8px)",
                    }}
                  >
                    {item.label}
                  </span>
                </a>
              </div>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

/**
 * Indice ripiegato in cima all'articolo: solo mobile/tablet (sotto `xl`),
 * dove il rail laterale non c'è.
 */
export function MobileTableOfContents({ items, locale = "en" }: { items: TocItem[]; locale?: Locale }) {
  const text = articleUi[locale];
  const [open, setOpen] = useState(false);

  if (!items.length) return null;

  return (
    <div className="mb-16 border-t border-gray-300 xl:hidden">
      <button
        type="button"
        aria-expanded={open}
        aria-controls="on-this-page"
        onClick={() => { setOpen((value) => !value); track("toc_toggle", { open: !open, placement: "mobile" }); }}
        className="flex w-full cursor-pointer items-center justify-between gap-4 py-3.5 text-sm text-gray-1000"
      >
        {text.onThisPage}
        <span
          className="shrink-0 transition-transform duration-300 motion-reduce:transition-none"
          style={{ transform: open ? "rotate(90deg)" : undefined }}
        >
          <ChevronRight className="h-4 w-4" />
        </span>
      </button>
      {open ? (
        <ul id="on-this-page" className="m-0 list-none p-0">
          {items.map((item) => (
            <li
              key={item.anchor}
              className="flex items-center justify-between gap-3 py-1.5"
            >
              <a
                href={`#${item.anchor}`}
                onClick={(event) => {
                  // Chiudere il pannello *prima* che Lenis calcoli la posizione,
                  // altrimenti l'heading atterra spostato di tutta l'altezza
                  // dell'indice appena richiuso.
                  flushSync(() => setOpen(false));
                  track("toc_click", { anchor: item.anchor, placement: "mobile" });
                  navigateTo(event, item.anchor);
                }}
                className="text-sm text-text-paragraph"
              >
                {item.label}
              </a>
              <SectionCopyLink
                anchor={item.anchor}
                label={item.label}
                size={14}
                className="text-neutral-400 hover:text-neutral-500"
              />
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
