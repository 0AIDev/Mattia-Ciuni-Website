import { defineConfig, devices } from "@playwright/test";

// Il test parte dal dev server statico, non dall'export gia' servito da
// Cloudflare: cosi' puo' verificare anche il toggle e gli sheet/modal client.
// La porta dedicata evita di collidere con un server gia' aperto durante lo
// sviluppo.
export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  reporter: [["list"]],
  use: {
    baseURL: "http://localhost:3107",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  // Il dev server compila ogni route alla prima richiesta. Con piu' test in
  // parallelo, il primo accesso a una pagina non ancora compilata puo' rispondere
  // in modo diverso dal successivo, e il fallimento e' casuale: non indica un
  // difetto del sito, ma un server di sviluppo che si scalda. Un retry assorbe
  // quello, e resta comunque un fallimento se il difetto e' vero.
  retries: process.env.CI ? 1 : 2,
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: "npm run dev -- --port 3107",
    url: "http://localhost:3107",
    reuseExistingServer: false,
    timeout: 120_000,
  },
});
