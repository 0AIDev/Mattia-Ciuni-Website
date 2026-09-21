import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = [
  // Stato locale dei tool, non codice: `.wrangler/` lo scrive `wrangler pages dev`,
  // `.pages-preview/` è la copia dell'export servita dal runtime di Pages,
  // `.scratch/` sono le prove a mano; `.next/` e `out/` sono l'output del build.
  {
    ignores: [
      ".wrangler/**",
      ".pages-preview/**",
      ".scratch/**",
      ".next/**",
      "out/**",
      "node_modules/**",
    ],
  },
  ...nextVitals,
  ...nextTs,
  // scripts/*.js sono script Node CJS (es. verify.js), non bundletlare con TS rules.
  {
    files: ["scripts/*.js"],
    rules: { "@typescript-eslint/no-require-imports": "off" },
  },
];

export default eslintConfig;