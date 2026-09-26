import { loadCmsCollection, mergeCmsCollection } from "@/lib/cms-content";
import { blocksToMarkdown } from "@/lib/cms-format";
import { jobs as baseJobs, type CareerJob } from "./jobs";
import { existsSync } from "node:fs";
import { join } from "node:path";

// `job` e non `jobs`: il pannello scrive `content/cms/job/<slug>.json`, quindi
// `content/cms/jobs/` non esisteva e le offerte pubblicate dal pannello non
// arrivavano alla pagina /careers/. Il commit, la build e il deploy erano
// tutti verdi: semplicemente il file lo leggeva nessuno.
const cmsJobs = loadCmsCollection<CareerJob>("job");

// `keepUnlistedFields`: un'offerta ha `postedAt`, `challenge` e i campi del
// dataset, e l'editor del pannello non ha un campo per nessuno dei tre. Se il
// file sostituisse l'offerta intera, il solo fatto di pubblicarla dal pannello
// avrebbe tolto `datePosted` dal `JobPosting` delle due offerte aperte, e
// Google Jobs avrebbe smesso di leggerle.
// Il corpo del ruolo vive nei `content` del file, non in `description`.
//
// Il pannello chiama `description` la **pitch** (la meta description della
// pagina) e tiene il corpo del ruolo in `body_markdown`, che il publish scrive
// come blocchi in `content`. Il registry, invece, tiene il corpo lungo in
// `description`. Quindi il merge prende `description` dal file e perdeva il
// corpo: la pagina del ruolo restava con la sola frase di apertura e il
// `JobPosting` perdeva i suoi `h3`. La conversione e' la stessa che il pannello
// usa in lettura, quindi il giro completo e' senza perdita.
const cmsBodies = cmsJobs.map((item) => {
  const body = (item as CareerJob & { content?: unknown }).content;
  if (!Array.isArray(body)) return item;
  const markdown = blocksToMarkdown(body);
  return markdown ? { ...item, description: markdown } : item;
});

export const jobs: CareerJob[] = mergeCmsCollection(baseJobs, cmsBodies, { keepUnlistedFields: true });

export function getJob(slug: string): CareerJob | undefined {
  return jobs.find((job) => job.slug === slug);
}

export function openJobs(): CareerJob[] {
  return jobs.filter((job) => job.status === "open");
}

export function comingSoonJobs(): CareerJob[] {
  return jobs.filter((job) => job.status === "coming-soon");
}

export function publicJobs(): CareerJob[] {
  return jobs.filter((job) => job.status === "open" || job.status === "coming-soon");
}

export function shouldShowRoleSearch(jobCount: number): boolean {
  return jobCount >= 3;
}

/**
 * La `description` di un ruolo, con un ripiego quando il pitch e' vuoto.
 *
 * Il pitch e' l'unico campo che il pannello puo' lasciare vuoto, e il pulsante
 * "Add offer" lo crea cosi'. Senza ripiego la pagina esce dalla build senza
 * `description`: il motore di ricerca si inventa lo spazio vuoto, e `verify.js`
 * segnala la pagina. Il ripiego e' la stessa frase che gia' sta su /careers/,
 * quindi resta una descrizione vera.
 */
export function jobMetaDescription(job: CareerJob): string {
  return job.shortPitch?.trim() || "I hire by artifact: ship something real, then we talk. Open roles at Payle.";
}

/**
 * La card di un ruolo, se qualcuno l'ha disegnata.
 *
 * `scripts/og.ps1` produce `public/careers/<slug>/og.png` a mano, quindi un
 * ruolo creato dal pannello non ne ha una: dichiarare quell'indirizzo senza il
 * file significa un'immagine rotta in ogni condivisione. La card della sezione
 * esiste sempre, quindi e' quella il ripiego.
 *
 * Sta qui e non nelle due pagine perche' la rotta non localizzata e quella
 * localizzata hanno due `generateMetadata` separati: la regola ("la card del
 * ruolo esiste solo se il file c'e'") e' una sola.
 */
export function jobOgImage(slug: string): string {
  return existsSync(join(process.cwd(), "public", "careers", slug, "og.png")) ? `/careers/${slug}/og.png` : "/careers/og.png";
}
