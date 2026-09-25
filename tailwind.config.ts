import type { Config } from "tailwindcss";

// I colori passano da CSS variables: light e dark definiscono gli stessi nomi
// con valori diversi (app/globals.css), quindi le classi del sito
// (bg-gray-background, text-gray-1200, ...) restano identiche e la dark mode e'
// solo un cambio di variabile su <html>. Il valore hex qui e' quello light: da
// solo serve come fallback se le variabili non sono caricate, e dice a Tailwind
// che il colore e' opaco (gli opacity modifier restano validi perche' il valore
// della variabile e' un colore intero, non un canale).
const varColor = (name: string, fallback: string) => `rgb(var(${name}) / <alpha-value>)`;

// Esagono -> canali rgb per i fallback e per le variabili in globals.css.
const rgbChannels = (hex: string) => {
  const value = hex.replace("#", "");
  return [0, 2, 4].map((i) => Number.parseInt(value.slice(i, i + 2), 16)).join(" ");
};

const light = {
  background: "#FCFCFC",
  previewBg: "#FFFFFF",
  previewBorder: "#E4E4E4",
  paragraph: "#262626",
  gray50: "#F7F7F7",
  gray100: "#EFEFEF",
  gray200: "#E5E5E5",
  gray300: "#E9E9E9",
  gray400: "#DADADA",
  gray1000: "#686868",
  gray1100: "#3C3C3C",
  gray1200: "#161616",
};

// La scala del pannello admin.
//
// Il pannello e' uno strumento privato con un suo linguaggio, e questi valori
// non passano dalle variabili del sito per un motivo preciso: non ha una dark
// mode. Un tool ha un aspetto solo, e averne due significa mantenerne due; le
// stesse tinte sono ripetute in `app/globals.css` per le poche regole che
// Tailwind non copre (raggio dei campi, focus).
const admin = {
  bg: "#f9f9f8",
  panel: "#ffffff",
  line: "#e9e9e7",
  soft: "#f4f4f2",
  active: "#ebebea",
  ink: "#282a30",
  muted: "#6b6f76",
  faint: "#8f939a",
};

const config: Config = {
  darkMode: "class",
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Stessi nomi di prima: nessuna classe del sito cambia. I valori light
        // sono anche i default delle variabili, dichiarati in globals.css su
        // :root; .dark li ridefinisce.
        admin,
        "gray-background": varColor("--tc-background", rgbChannels(light.background)),
        "preview-bg": varColor("--tc-preview-bg", rgbChannels(light.previewBg)),
        "preview-border": varColor("--tc-preview-border", rgbChannels(light.previewBorder)),
        "text-text-paragraph": varColor("--tc-paragraph", rgbChannels(light.paragraph)),
        gray: {
          50: varColor("--tc-gray-50", rgbChannels(light.gray50)),
          100: varColor("--tc-gray-100", rgbChannels(light.gray100)),
          200: varColor("--tc-gray-200", rgbChannels(light.gray200)),
          300: varColor("--tc-gray-300", rgbChannels(light.gray300)),
          400: varColor("--tc-gray-400", rgbChannels(light.gray400)),
          1000: varColor("--tc-gray-1000", rgbChannels(light.gray1000)),
          1100: varColor("--tc-gray-1100", rgbChannels(light.gray1100)),
          1200: varColor("--tc-gray-1200", rgbChannels(light.gray1200)),
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
      // Il ring di default e' il blu di Tailwind (#3b82f6): ogni `ring-*` senza
      // colore esplicito diventava un alone blu, in aperta guerra con il design
      // system monocromatico del sito. Il default qui lo riporta al nero del
      // sito alla stessa opacita' usata dal form newsletter (1200/15): vale per
      // tutti i ring futuri dimenticati, non solo per quelli presenti.
      ringColor: {
        DEFAULT: "rgba(22, 22, 22, 0.15)",
      },
    },
  },
  plugins: [],
};

export default config;
