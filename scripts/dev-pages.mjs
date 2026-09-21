import { spawn } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";

if (!existsSync(".dev.vars")) {
  console.error("Missing .dev.vars. Copy .dev.vars.example to .dev.vars and set a local ADMIN_TOKEN before starting Pages.");
  process.exit(1);
}

const vars = readFileSync(".dev.vars", "utf8");
const token = vars.match(/^ADMIN_TOKEN\s*=\s*(.+)$/m)?.[1]?.trim();
if (!token || token === "replace-with-a-long-local-token") {
  console.error(".dev.vars needs a real local ADMIN_TOKEN. Do not copy the production token into the repository.");
  process.exit(1);
}

const build = spawn(process.platform === "win32" ? "npm.cmd" : "npm", ["run", "build"], {
  stdio: "inherit",
  shell: false,
});

build.on("exit", (code, signal) => {
  if (code !== 0 || signal) process.exit(code ?? 1);
  const pages = spawn(process.platform === "win32" ? "npx.cmd" : "npx", ["wrangler", "pages", "dev", "out", "--port", "8787"], {
    stdio: "inherit",
    shell: false,
  });
  pages.on("exit", (pagesCode, pagesSignal) => process.exit(pagesCode ?? (pagesSignal ? 1 : 0)));
});
