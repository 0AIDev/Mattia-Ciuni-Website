import { existsSync, readdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join } from "node:path";

const root = fileURLToPath(new URL("..", import.meta.url));
const failures = [];
const fail = (message) => failures.push(message);
const read = (path) => readFileSync(join(root, path), "utf8");

const headers = read("public/_headers");
for (const required of [
  "Content-Security-Policy:",
  "Strict-Transport-Security:",
  "X-Frame-Options: DENY",
  "X-Content-Type-Options: nosniff",
  "Referrer-Policy:",
  "Permissions-Policy:",
]) {
  if (!headers.includes(required)) fail(`missing security header: ${required}`);
}
if (!headers.includes("frame-ancestors 'none'")) fail("CSP must deny framing");
if (!headers.includes("base-uri 'self'")) fail("CSP must constrain base URI");

const sourceRoots = ["app", "components", "functions", "lib", "scripts", "public"];
const files = [];
function walk(dir) {
  if (!existsSync(dir)) return;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) walk(path);
    else if (/\.(ts|tsx|js|mjs|json|md|txt|css)$/.test(entry.name)) files.push(path);
  }
}
sourceRoots.forEach((dir) => walk(join(root, dir)));

const secretPatterns = [
  /(?:sk_live|rk_live|AKIA)[A-Za-z0-9_-]{12,}/,
  /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,
  /(?:password|secret|api[_-]?key)\s*[:=]\s*["'`](?!re_test_key|your_|change-me|example)[^"'`\n]{16,}["'`]/i,
];
for (const file of files) {
  const text = readFileSync(file, "utf8");
  if (secretPatterns.some((pattern) => pattern.test(text))) fail(`possible secret in ${file}`);
  if (file.endsWith(".map")) fail(`source map tracked in ${file}`);
}

for (const forbidden of ["public/.env", "public/.env.local", "public/.dev.vars", "public/admin/feedback.md"]) {
  if (existsSync(join(root, forbidden))) fail(`private artifact exists: ${forbidden}`);
}
if (!existsSync(join(root, "app/.well-known/security.txt/route.ts"))) fail("security.txt route is missing");

if (failures.length) {
  console.error(failures.map((item) => `FAIL ${item}`).join("\n"));
  process.exit(1);
}
console.log(`PASS security audit (${files.length} source files checked)`);
