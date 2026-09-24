import type { CareerJob } from "@/lib/careers/jobs";
import { openJobs } from "@/lib/careers/jobs";

/**
 * La sorgente comune dei tre feed (jobs.xml, jobs.rss.xml, jobs.atom.xml) e del
 * JSON-LD delle pagine ruolo. La trasformazione da `jobs.ts` a ciò che un
 * aggregatore legge sta tutta qui, così i tre formati non possono divergere:
 * un feed che dice una cosa e un altro che ne dice un'altra è peggio di un feed
 * assente, perché chi legge non sa quale dei due credere.
 *
 * Solo ruoli `open`: un ruolo `coming-soon` non accetta candidature, e un
 * aggregatore che lo mostra genera candidature che dobbiamo rifiutare.
 */

export const FEED_LIMIT = 100;

/** Tipi `employmentType` accettati dal contratto dei ruoli, in ordine schema.org. */
export function employmentTypeOf(job: CareerJob): string {
  return job.employmentType || "FULL_TIME";
}

function sectionsOf(description: string): string[] {
  return description
    .split(/\n\s*\n/)
    .map((block) => block.trim())
    .filter(Boolean);
}

/** Il titolo di un blocco `### Titolo`, senza il prefisso. */
function headingOf(block: string): string | null {
  const line = block.trim();
  return line.startsWith("### ") ? line.slice(4).trim() : null;
}

/**
 * La description HTML che gli aggregatori mostrano: gli stessi blocchi della
 * pagina ruolo, trasposti in markup pulito — niente script, niente stili
 * esterni, niente classi. Le righe `###` diventano `h3`, gli elenchi `-`
 * diventano `ul/li`, il resto `p`. La fonte è il campo `description` del ruolo:
 * un feed che riscrive la descrizione a mano è un secondo posto dove la verità
 * può divergere.
 */
export function jobDescriptionHtml(job: CareerJob): string {
  const parts: string[] = [];
  for (const block of sectionsOf(job.description)) {
    const lines = block.split("\n").map((line) => line.trim()).filter(Boolean);
    if (lines.length === 1 && lines[0].startsWith("### ")) {
      parts.push(`<h3>${escapeHtml(lines[0].slice(4).trim())}</h3>`);
      continue;
    }
    if (lines.length > 0 && lines.every((line) => /^[-*] /.test(line))) {
      const items = lines.map((line) => `<li>${inlineHtml(line.slice(2))}</li>`).join("");
      parts.push(`<ul>${items}</ul>`);
      continue;
    }
    parts.push(`<p>${inlineHtml(block.replace(/\n+/g, " "))}</p>`);
  }
  return parts.join("\n");
}

/**
 * Il campo `###` è la sezione: qui si riporta nel feed come titolo, perché gli
 * aggregatori che non renderizzano l'HTML mostrano almeno la struttura.
 */
export function jobSections(job: CareerJob): Array<{ title: string }> {
  return sectionsOf(job.description)
    .map((block) => headingOf(block))
    .filter((title): title is string => Boolean(title))
    .map((title) => ({ title }));
}

/**
 * `jobtype` nel formato Indeed è minuscolo e inglese ("full-time",
 * "part-time", "contractor", "internship", "temporary").
 */
export function indeedJobType(job: CareerJob): string {
  switch (employmentTypeOf(job)) {
    case "PART_TIME":
      return "part-time";
    case "CONTRACTOR":
      return "contractor";
    default:
      return "full-time";
  }
}

/** La retribuzione come riga leggibile: quella vera del ruolo, non una formula. */
export function salaryLine(job: CareerJob): string {
  return job.compensation || "";
}

export function feedJobs(): CareerJob[] {
  return openJobs().slice(0, FEED_LIMIT);
}

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Le enfasi inline del registro (`**grassetto**`) diventano markup: il resto
 * dell'HTML della description lo scrive questo file, quindi l'escape qui basta
 * a garantire che nessun carattere del contenuto rompa il documento.
 */
function inlineHtml(value: string): string {
  return escapeHtml(value).replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
}

export function escapeXmlText(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/** CDATA: l'unica sequenza vietata è `]]>`, che si spezza in due blocchi. */
export function cdata(value: string): string {
  return `<![CDATA[${value.replace(/\]\]>/g, "]]]]><![CDATA[>")}]]>`;
}

export function rfc2822(date: string): string {
  return new Date(`${date}T00:00:00Z`).toUTCString();
}
