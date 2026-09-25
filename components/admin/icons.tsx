import type { ReactNode } from "react";

/**
 * Le icone del pannello.
 *
 * Sono disegnate qui invece di installare un pacchetto perche' il pannello ne
 * usa una dozzina: un set di 1500 icone peserebbe nel bundle e nella manutenzione
 * per dodici path. Tutte hanno la stessa griglia (24), lo stesso spessore (1.5) e
 * lo stesso tratto tondo, che e' quello che le fa sembrare un set e non dodici
 * disegni diversi.
 *
 * Il colore lo decide `currentColor`: nessuna icona ha un colore suo.
 */

function Svg({ children, className = "h-4 w-4" }: { children: ReactNode; className?: string }) {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      {children}
    </svg>
  );
}

type IconProps = { className?: string };

export function HomeIcon({ className }: IconProps) {
  return <Svg className={className}><path d="M3 10.5 12 3l9 7.5" /><path d="M5 9.5V21h14V9.5" /></Svg>;
}

export function InboxIcon({ className }: IconProps) {
  return <Svg className={className}><path d="M3 13h4l2 3h6l2-3h4" /><path d="M4.5 5h15l1.5 8v6H3v-6z" /></Svg>;
}

export function ChartIcon({ className }: IconProps) {
  return <Svg className={className}><path d="M4 20V10" /><path d="M10 20V4" /><path d="M16 20v-7" /><path d="M22 20H2" /></Svg>;
}

export function FileIcon({ className }: IconProps) {
  return <Svg className={className}><path d="M6 3h8l4 4v14H6z" /><path d="M14 3v4h4" /><path d="M9 13h6" /><path d="M9 17h4" /></Svg>;
}

export function TypeIcon({ className }: IconProps) {
  return <Svg className={className}><path d="M4 7V4h16v3" /><path d="M12 4v16" /><path d="M9 20h6" /></Svg>;
}

export function ImageIcon({ className }: IconProps) {
  return <Svg className={className}><rect x="3" y="4" width="18" height="16" rx="2" /><circle cx="8.5" cy="9.5" r="1.5" /><path d="m4 17 5-5 4 4 3-2 4 4" /></Svg>;
}

export function SearchIcon({ className }: IconProps) {
  return <Svg className={className}><circle cx="11" cy="11" r="6" /><path d="m20 20-4.5-4.5" /></Svg>;
}

export function BriefcaseIcon({ className }: IconProps) {
  return <Svg className={className}><rect x="3" y="7" width="18" height="13" rx="2" /><path d="M9 7V5h6v2" /><path d="M3 12h18" /></Svg>;
}

export function SlidersIcon({ className }: IconProps) {
  return <Svg className={className}><path d="M4 8h16" /><path d="M4 16h16" /><circle cx="9" cy="8" r="2" /><circle cx="15" cy="16" r="2" /></Svg>;
}

export function RefreshIcon({ className }: IconProps) {
  return <Svg className={className}><path d="M20 12a8 8 0 1 1-2.4-5.7" /><path d="M20 4v4h-4" /></Svg>;
}

export function LogOutIcon({ className }: IconProps) {
  return <Svg className={className}><path d="M15 4h4v16h-4" /><path d="M11 12H3" /><path d="m7 8-4 4 4 4" /></Svg>;
}

export function ChevronDownIcon({ className }: IconProps) {
  return <Svg className={className}><path d="m6 9 6 6 6-6" /></Svg>;
}

export function PlusIcon({ className }: IconProps) {
  return <Svg className={className}><path d="M12 5v14" /><path d="M5 12h14" /></Svg>;
}

export function XIcon({ className }: IconProps) {
  return <Svg className={className}><path d="m6 6 12 12" /><path d="m18 6-12 12" /></Svg>;
}

export function MenuIcon({ className }: IconProps) {
  return <Svg className={className}><path d="M4 7h16" /><path d="M4 12h16" /><path d="M4 17h16" /></Svg>;
}

export function ExternalIcon({ className }: IconProps) {
  return <Svg className={className}><path d="M14 4h6v6" /><path d="m20 4-8 8" /><path d="M19 14v6H4V5h6" /></Svg>;
}

export function TrashIcon({ className }: IconProps) {
  return <Svg className={className}><path d="M4 7h16" /><path d="M9 7V4h6v3" /><path d="M6 7l1 13h10l1-13" /></Svg>;
}

export function CheckIcon({ className }: IconProps) {
  return <Svg className={className}><path d="m5 13 4 4L19 7" /></Svg>;
}
