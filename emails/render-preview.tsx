import { render } from "@react-email/render";
import { readFile, writeFile } from "node:fs/promises";
import React from "react";
import FeedbackReceivedEmail from "./FeedbackReceivedEmail";

/**
 * Genera:
 *   preview.html        → laboratorio, casella chiara e scura affiancate
 *   preview-light.html  → mail dentro una casella chiara
 *   preview-dark.html   → mail dentro una casella scura
 *
 * La mail lascia il canvas trasparente, quindi lo sfondo che si vede qui è
 * quello della casella: in light è bianco, in dark è #151513.
 */
async function main() {
  const html = await render(
    <FeedbackReceivedEmail
      name="Liam"
      pageUrl="https://mattiaciuni.pages.dev/feedback/"
      submittedAt="September 22, 2026"
      message="The product is clear, but I would love to understand how feedback becomes part of the roadmap."
      feedbackUrl="https://mattiaciuni.pages.dev/feedback/"
    />,
  );

  const frame = await readFile("public/frame.png");
  const logo = await readFile("public/logo-white.svg", "utf8");
  const arrow = await readFile("public/mail-arrow.png");

  // Le immagini remote vengono incorporate solo nell'anteprima locale:
  // nelle mail reali servono URL assoluti, che i client possano scaricare.
  const inlined = html
    .replaceAll(
      "https://mattiaciuni.pages.dev/frame.png",
      `data:image/png;base64,${frame.toString("base64")}`,
    )
    .replaceAll(
      "https://mattiaciuni.pages.dev/mail-arrow.png",
      `data:image/png;base64,${arrow.toString("base64")}`,
    )
    .replaceAll(
      "https://mattiaciuni.pages.dev/logo-white.svg",
      `data:image/svg+xml;base64,${Buffer.from(logo).toString("base64")}`,
    );

  const headInner = inlined.match(/<head>([\s\S]*?)<\/head>/)?.[1] ?? "";
  const bodyTag = inlined.match(/<body[^>]*>/)?.[0] ?? "<body>";
  const bodyInner = inlined.match(/<body[^>]*>([\s\S]*?)<\/body>/)?.[1] ?? "";

  // Il <body> della mail diventa un blocco dentro la pagina della casella.
  const mail = `${bodyTag.replace("<body", "<div")}>${bodyInner}</div>`;

  const page = (bg: string, extra = "") => `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>Feedback email</title>
    ${headInner}
    <style>html, body { margin: 0; }${extra}</style>
  </head>
  <body style="background: ${bg}">
    ${mail}
  </body>
</html>
`;

  const lab = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>Feedback email · light &amp; dark</title>
    ${headInner}
    <style>
      html, body { margin: 0; background: #e9e9e4; }
      .lab { display: grid; grid-template-columns: 1fr 1fr; gap: 18px; padding: 18px; }
      .label { margin: 0 0 8px; font-family: Inter, Arial, sans-serif; font-size: 11px; font-weight: 600; letter-spacing: 0.14em; text-transform: uppercase; color: #161616; opacity: 0.5; }
      .panel { border-radius: 14px; overflow: hidden; }
      .panel-light { background: #ffffff; }
      .panel-dark { background: #151513; }
      @media (max-width: 900px) { .lab { grid-template-columns: 1fr; } }
    </style>
  </head>
  <body>
    <div class="lab">
      <div>
        <p class="label">Mailbox · light</p>
        <div class="panel panel-light">${mail}</div>
      </div>
      <div>
        <p class="label">Mailbox · dark</p>
        <div class="panel panel-dark">${mail}</div>
      </div>
    </div>
  </body>
</html>
`;

  await writeFile("emails/preview-light.html", page("#ffffff"), "utf8");
  await writeFile("emails/preview-dark.html", page("#151513"), "utf8");
  await writeFile("emails/preview.html", lab, "utf8");
  console.log(
    "Rendered emails/preview.html (+ preview-light.html, preview-dark.html)",
  );
}

void main();
