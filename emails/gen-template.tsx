import { render } from "@react-email/render";
import { writeFile } from "node:fs/promises";
import React from "react";
import FeedbackReceivedEmail from "./FeedbackReceivedEmail";

/**
 * Congela il template della mail in un modulo TypeScript semplice.
 *
 * Perché: la Function che risponde a /api/feedback non può importare JSX (le
 * Functions vengono caricate come moduli TS semplici, e il test offline le
 * esegue con Node, che non compila .tsx). Qui invece il JSX c'è, viene
 * renderizzato una volta sola, e quello che resta è una stringa con il
 * segnaposto `{{NAME}}`: la Function si limita a sostituirlo.
 *
 *   npm run email:template
 */
async function main() {
  const escapedName = "{{NAME}}";
  const named = await render(<FeedbackReceivedEmail name={escapedName} />);
  const anonymous = await render(<FeedbackReceivedEmail />);
  // Variante testo: alcuni client la preferiscono, e una mail senza parte
  // testuale finisce più facilmente nello spam.
  const namedText = await render(<FeedbackReceivedEmail name={escapedName} />, {
    plainText: true,
  });
  const anonymousText = await render(<FeedbackReceivedEmail />, { plainText: true });

  const asTemplate = (html: string) =>
    `\`${html.replace(/\\/g, "\\\\").replace(/`/g, "\\`").replace(/\$\{/g, "\\${")}\``;

  const file = `// GENERATO da \`npm run email:template\` — non modificare a mano.
// Sorgente: emails/FeedbackReceivedEmail.tsx
//
// La Function sostituisce {{NAME}} con il nome di chi ha scritto, già escapato.

/** Mail con il nome di chi ha inviato il feedback. */
export const FEEDBACK_EMAIL_NAMED = ${asTemplate(named)};

/** Mail senza nome: nessun destinatario inventato. */
export const FEEDBACK_EMAIL_ANON = ${asTemplate(anonymous)};

/** Versione testo, con il nome di chi ha inviato il feedback. */
export const FEEDBACK_EMAIL_NAMED_TEXT = ${asTemplate(namedText)};

/** Versione testo senza nome. */
export const FEEDBACK_EMAIL_ANON_TEXT = ${asTemplate(anonymousText)};
`;

  await writeFile("functions/lib/feedback-email-template.ts", file, "utf8");
  console.log(
    `Scritto functions/lib/feedback-email-template.ts (${named.length} html, ${anonymous.length} anon, ${namedText.length} testo)`,
  );
}

void main();
