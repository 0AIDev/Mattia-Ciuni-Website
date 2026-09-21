import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        "gray-background": "#FCFCFC",
        "preview-bg": "#FFFFFF",
        "preview-border": "#E4E4E4",
        "text-text-paragraph": "#262626",
        gray: {
          100: "#EFEFEF",
          300: "#E9E9E9",
          400: "#DADADA",
          1000: "#686868",
          1100: "#3C3C3C",
          1200: "#161616",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "Inter", "sans-serif"],
        // Self-hosted da next/font (app/layout.tsx): nessuna richiesta alla CDN
        // di Google a runtime. Il nome resta come ripiego per chi ha il font
        // installato.
        serif: ["'Instrument Serif'", "serif"],
      },
      boxShadow: {
        custom: "0 2px 4px rgba(0, 0, 0, 0.08)",
      },
    },
  },
  plugins: [],
};

export default config;