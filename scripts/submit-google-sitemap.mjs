import { createSign } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL?.trim();
const privateKey = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY?.replace(/\\n/g, "\n");
const home = join(process.cwd(), "out", "index.html");
const exportedOrigin = existsSync(home)
  ? (readFileSync(home, "utf8").match(/<link rel="canonical" href="([^"]+)"/)?.[1] || "").replace(/\/$/, "")
  : "";
const configuredSiteUrl = process.env.GOOGLE_SEARCH_CONSOLE_SITE_URL?.trim().replace(/\/+$/, "");
const siteUrl = (configuredSiteUrl || exportedOrigin).replace(/\/$/, "");

if (configuredSiteUrl && configuredSiteUrl !== exportedOrigin) {
  console.warn(
    `google search console: skipped (GOOGLE_SEARCH_CONSOLE_SITE_URL must match the export origin ${exportedOrigin || "missing"})`,
  );
  process.exit(0);
}
if (!siteUrl) {
  console.warn("google search console: skipped (the export has no absolute production canonical)");
  process.exit(0);
}

if (!email || !privateKey) {
  console.log("google search console: skipped (service-account credentials are not configured)");
  process.exit(0);
}

const now = Math.floor(Date.now() / 1000);
const encode = (value) => Buffer.from(JSON.stringify(value)).toString("base64url");
const header = encode({ alg: "RS256", typ: "JWT" });
const claim = encode({
  iss: email,
  scope: "https://www.googleapis.com/auth/webmasters",
  aud: "https://oauth2.googleapis.com/token",
  iat: now,
  exp: now + 3600,
});
const signer = createSign("RSA-SHA256");
signer.update(`${header}.${claim}`);
const assertion = `${header}.${claim}.${signer.sign(privateKey, "base64url")}`;

const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
  method: "POST",
  headers: { "Content-Type": "application/x-www-form-urlencoded" },
  body: new URLSearchParams({
    grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
    assertion,
  }),
});
if (!tokenResponse.ok) {
  console.warn(`google search console: token request failed (${tokenResponse.status}); build continues`);
  process.exit(0);
}
const { access_token: accessToken } = await tokenResponse.json();
const sitemap = `${siteUrl}/sitemap.xml`;
const endpoint = `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(siteUrl)}/sitemaps/${encodeURIComponent(sitemap)}`;
const response = await fetch(endpoint, {
  method: "PUT",
  headers: { Authorization: `Bearer ${accessToken}` },
});
if (!response.ok) {
  console.warn(`google search console: sitemap submission failed (${response.status}); build continues`);
} else {
  console.log(`google search console: submitted ${sitemap}`);
}
