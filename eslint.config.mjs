import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = [
  // Stato locale dei tool, non codice: `.wrangler/` lo scrive `wrangler dev`
  // (bundle temporanei che non passano nessuna regola del progetto),
  // `.next/` e `out/` sono l'output del build.
  {
    ignores: [".wrangler/**", ".next/**", "out/**", "node_modules/**"],
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