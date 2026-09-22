import { render } from "@react-email/render";
import React from "react";
import FeedbackReceivedEmail from "../emails/FeedbackReceivedEmail";

/**
 * Invia una mail di prova reale con il template di conferma feedback.
 *
 * Uso:
 *   RESEND_API_KEY=... RESEND_FROM_EMAIL=... npx tsx scripts/send-feedback-email.tsx you@example.com
 *
 * Nessun allegato: le immagini restano URL assoluti, quindi devono essere
 * già online (frame.png, mail-arrow.png, logo-white.svg in produzione),
 * altrimenti la casella le mostra mancanti.
 */
async function main() {
  const to = process.argv[2];
  if (!to) throw new Error("Destinatario mancante: npx tsx scripts/send-feedback-email.tsx you@example.com");

  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error("RESEND_API_KEY mancante");

  const from = process.env.RESEND_FROM_EMAIL ?? "onboarding@resend.dev";

  const html = await render(<FeedbackReceivedEmail name="Liam" />);

  const body = {
    from,
    to: [to],
    reply_to: "ceo@usepayle.com",
    subject: "Your feedback reached me",
    html,
  };

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const text = await response.text();
  console.log("status", response.status);
  console.log(text);
  if (!response.ok) process.exitCode = 1;
}

void main();
