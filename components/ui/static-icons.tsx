import type { ReactNode, SVGProps } from "react";

type IconProps = Omit<SVGProps<SVGSVGElement>, "color"> & {
  size?: number;
  color?: string;
};

function Svg({ size = 24, color, className, children, ...props }: IconProps & { children: ReactNode }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={{ color, ...props.style }}
      {...props}
    >
      {children}
    </svg>
  );
}

export function ArrowUpLeftIcon(props: IconProps) {
  return <Svg {...props}><path d="M7 17V7h10" /><path d="M17 17 7 7" /></Svg>;
}

export function ArrowUpRightIcon(props: IconProps) {
  return <Svg {...props}><path d="M7 7h10v10" /><path d="M7 17 17 7" /></Svg>;
}

export function ClockIcon(props: IconProps) {
  return <Svg {...props}><path d="M12 12V6" /><path d="M12 12l4 2" /><circle cx="12" cy="12" r="10" /></Svg>;
}

export function CopyIcon(props: IconProps) {
  return <Svg {...props}><rect width="14" height="14" x="8" y="8" rx="2" /><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" /></Svg>;
}

export function LinkIcon(props: IconProps) {
  return <Svg {...props}><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" /></Svg>;
}

export function MailCheckIcon(props: IconProps) {
  return <Svg {...props}><path d="M22 13V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v12c0 1.1.9 2 2 2h8" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" /><path d="m16 19 2 2 4-4" /></Svg>;
}

export function GlobeIcon(props: IconProps) {
  return <Svg {...props}><circle cx="12" cy="12" r="10" /><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" /><path d="M2 12h20" /></Svg>;
}

export function GithubIcon(props: IconProps) {
  return <Svg {...props}><path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5 c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5 .28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5 -2.64-.5-5.36-.5-8 0 C6 2 5 2 5 2 c-.3 1.15-.3 2.35 0 3.5 A5.403 5.403 0 0 0 4 9 c0 3.5 3 5.5 6 5.5 -.39.49-.68 1.05-.85 1.65 -.17.6-.22 1.23-.15 1.85v4" /><path d="M9 18c-4.51 2-5-2-7-2" /></Svg>;
}

export function LinkedinIcon(props: IconProps) {
  return <Svg {...props}><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7 a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7 a6 6 0 0 1 6-6z" /><rect width="4" height="12" x="2" y="9" /><circle cx="4" cy="4" r="2" /></Svg>;
}

export function CrunchbaseIcon(props: IconProps) {
  return <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width={props.size ?? 24} height={props.size ?? 24} fill="currentColor" className={props.className} aria-hidden={props["aria-hidden"]} style={{ color: props.color, ...props.style }}><path d="M21.6 0H2.4A2.41 2.41 0 0 0 0 2.4v19.2A2.41 2.41 0 0 0 2.4 24h19.2a2.41 2.41 0 0 0 2.4-2.4V2.4A2.41 2.41 0 0 0 24 2.4V21.6A2.41 2.41 0 0 0 21.6 24zM7.045 14.465A2.11 2.11 0 0 0 9.84 13.42h1.66a3.69 3.69 0 1 1 0-1.75H9.84a2.11 2.11 0 1 0-2.795 2.795zm11.345.845a3.55 3.55 0 0 1-1.06.63 3.68 3.68 0 0 1-3.39-.38v.38h-1.51V5.37h1.5v4.11a3.74 3.74 0 0 1 1.8-.63H16a3.67 3.67 0 0 1 2.39 6.46zm-.223-2.766a2.104 2.104 0 1 1-4.207 0 2.104 2.104 0 0 1 4.207 0z" /></svg>;
}

export function InstagramIcon(props: IconProps) {
  return <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width={props.size ?? 24} height={props.size ?? 24} fill="currentColor" className={props.className} aria-hidden={props["aria-hidden"]} style={{ color: props.color, ...props.style }}><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" /></svg>;
}

export function TwitterIcon(props: IconProps) {
  return <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width={props.size ?? 24} height={props.size ?? 24} fill="currentColor" className={props.className} aria-hidden={props["aria-hidden"]} style={{ color: props.color, ...props.style }}><path d="M389.2 48h70.6L305.6 224.2 487 464H345L233.7 318.6 106.5 464H35.8L200.7 275.5 26.8 48H172.4L272.9 180.9 389.2 48zM364.4 421.8h39.1L151.1 88h-42L364.4 421.8z" /></svg>;
}
