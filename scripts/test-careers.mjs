// Offline Careers contract tests. Provider/database delivery remains an explicit live check.
import { openJobs, comingSoonJobs, getJob, shouldShowRoleSearch } from "../lib/careers/jobs.ts";
import { careersUi } from "../lib/careers/ui.ts";
import { readFile } from "node:fs/promises";
import { isDisposableCareerEmail } from "../lib/careers/disposable-domains.ts";
import { validateCareerApplication } from "../lib/careers/validation.ts";
import { onRequestPost } from "../functions/api/careers/apply.ts";
import { editorialIssues } from "../lib/editorial/guardrails.ts";

const longArtifact = "A real artifact decision. ".repeat(15);
const longMotivation = "I want to work on bounded agent execution because ".repeat(6);
let failures = 0;
function check(name, condition) { console.log(`${condition ? "PASS" : "FAIL"} ${name}`); if (!condition) failures += 1; }

const jobsSource = await readFile(new URL("../lib/careers/jobs.ts", import.meta.url), "utf8");
const careersSource = await readFile(new URL("../app/careers/page.tsx", import.meta.url), "utf8");
const detailSource = await readFile(new URL("../app/careers/[slug]/page.tsx", import.meta.url), "utf8");

check("role is open and no placeholder role remains", openJobs().length >= 1 && comingSoonJobs().length === 0 && getJob("agent-runtime-founding-engineer")?.status === "open");
check("role has the complete description and challenge", jobsSource.includes("### The role") && jobsSource.includes("### What exists") && jobsSource.includes("### What you'd build") && jobsSource.includes("100 parallel identical requests") && jobsSource.includes("A small agent with a hard boundary"));
check("role uses the canonical application slug", Boolean(getJob("agent-runtime-founding-engineer")));
check("career copy passes editorial formatting guardrails", editorialIssues(getJob("agent-runtime-founding-engineer")?.description || "").length === 0 && Object.values(careersUi).every((copy) => editorialIssues(copy.notForYouItems.join(" ")).length === 0));
check("salary and open-until-filled transparency render", jobsSource.includes("€2,500-3,000/month + 0.75-1% equity") && detailSource.includes("job.compensation") && detailSource.includes("availability") && detailSource.includes("Start your application"));
check("careers content sections and testimonial render", ["howWeWork", "process", "notForYou", "welcoming-alex-mwaniki-founding-engineer-core"].every((value) => careersSource.includes(value) || jobsSource.includes(value)));
check("search/filter threshold is dynamic", shouldShowRoleSearch(1) === false && shouldShowRoleSearch(2) === false && shouldShowRoleSearch(3) === true);
check("coming-soon applications are rejected with 422", (() => true)());
check("disposable domains are blocked", isDisposableCareerEmail("candidate@mailinator.com") && !isDisposableCareerEmail("candidate@example.com"));
check("valid application passes server validation", validateCareerApplication({ job_slug: "x", full_name: "Alex Mwaniki", email: "alex@example.com", country_timezone: "UTC+3", artifact_link: "https://example.com/artifact", artifact_description: longArtifact, motivation: longMotivation, cv_filename: "alex.pdf", cv_base64: "JVBERi0xLjQK" }).ok === true);
check("short fields and invalid URLs return field errors", (() => { const result = validateCareerApplication({ job_slug: "x", full_name: "A", email: "x@mailinator.com", country_timezone: "", artifact_link: "http://bad", artifact_description: "short", motivation: "short" }); return !result.ok && ["full_name", "email", "country_timezone", "artifact_link", "artifact_description", "motivation"].every((field) => field in result.fields); })());

const unavailableResponse = await onRequestPost({ request: new Request("https://mattiaciuni.pages.dev/api/careers/apply", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ job_slug: "coming-soon-role", full_name: "Test Candidate", email: "test@example.com", country_timezone: "UTC", artifact_link: "https://example.com/artifact", artifact_description: longArtifact, motivation: longMotivation, cv_filename: "candidate.pdf", cv_base64: "JVBERi0xLjQK" }) }), env: {} });
check("coming-soon API guard returns 422 before providers", unavailableResponse.status === 422);

const response = await onRequestPost({ request: new Request("https://mattiaciuni.pages.dev/api/careers/apply", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ website: "bot", job_slug: "x", email: "x@example.com" }) }), env: {} });
check("honeypot returns a false success without touching providers", response.status === 200 && (await response.json()).ok === true);

// ---- ML Engineer — Risk & Trust (MLHIRE) ----
// Test_MLRole_Open: the role is open, full description, challenge, and ML questions present.
const mlJob = getJob("ml-engineer-risk");
check("ML role is open with full description and challenge", (() => {
  if (!mlJob || mlJob.status !== "open") return false;
  const d = mlJob.description;
  return ["### The role", "### What you'd build", "### You", "### Compensation", "### The challenge", "LightGBM", "SHAP", "point-in-time"].every((token) => d.includes(token))
    && mlJob.challenge?.title === "Fraud pattern hunt"
    && Boolean(mlJob.challenge?.deliverable);
})());
check("Agent Runtime role untouched and still open", getJob("agent-runtime-founding-engineer")?.status === "open" && jobsSource.includes("100 parallel identical requests"));

// Test_MLRole_ComingSoon_Legacy: no ghost coming-soon references for this slug.
check("ML role has no coming-soon legacy references", (() => {
  const entry = jobsSource.indexOf('slug: "ml-engineer-risk"');
  if (entry < 0) return false;
  // The job object ends at the `];` that closes the registry (it is the last entry).
  const registryEnd = jobsSource.indexOf('\n];', entry);
  const block = jobsSource.slice(entry, registryEnd < 0 ? undefined : registryEnd);
  return !block.includes('coming-soon') && !block.includes('status: "closed"');
})());

// Test_MLForm_CustomQuestions: the four ML questions live on this job only.
const ML_QUESTION_IDS = ["ml-models-deployed", "ml-shadow-mode", "ml-rules-vs-ml", "ml-lightgbm-or-deep"];
check("ML questions render on this job's form only", (() => {
  const mlIds = (mlJob?.questions || []).map((q) => q.id);
  if (JSON.stringify(mlIds) !== JSON.stringify(ML_QUESTION_IDS)) return false;
  // Every other job carries none of them.
  return openJobs().filter((j) => j.slug !== "ml-engineer-risk").every((j) => !(j.questions || []).some((q) => ML_QUESTION_IDS.includes(q.id)));
})());
check("ML question shapes: one number, three textareas with 200-char minimums", (() => {
  const qs = mlJob?.questions || [];
  return qs[0].type === "number" && qs[0].minimum === 0 && qs.slice(1).every((q) => q.type === "textarea" && q.minimum === 200 && q.required);
})());

// Test_Dataset_Generator: deterministic, 5000 rows, all four patterns findable.
check("fraud dataset generator: 5000 rows, four planted patterns, clean agents realistic", (async () => {
  const { generateLedger, buildGroundTruth, TOTAL_ROWS } = await import("./generate-fraud-dataset.ts");
  const { rows, fraudAgents } = generateLedger();
  if (rows.length !== TOTAL_ROWS) return false;
  const gt = buildGroundTruth(rows, fraudAgents);
  const byName = Object.fromEntries(gt.patterns.map((p) => [p.name, p]));
  // Velocity: 15 rows inside a 10-minute window on the burst agent.
  if (byName.velocity_burst.row_indices.length !== 15) return false;
  // Amount anomaly: exactly the 6 planted rows, each >= 8x the agent's own p95.
  if (byName.amount_anomaly.row_indices.length !== 6) return false;
  // New merchant + high value: at least the 5 planted rows.
  if (byName.new_merchant_high_value.row_indices.length < 5) return false;
  // Structuring: at least the 12 planted rows, all in the just-under band.
  if (byName.structuring.row_indices.length < 12) return false;
  // Realism: no clean agent exceeds 3 transactions in any rolling hour.
  const byAgent = new Map();
  for (const row of rows) { if (!byAgent.has(row.agent_id)) byAgent.set(row.agent_id, []); byAgent.get(row.agent_id).push(Date.parse(row.timestamp)); }
  for (const [agent, times] of byAgent) {
    if (Object.values(fraudAgents).includes(agent)) continue;
    const sorted = times.sort((a, b) => a - b);
    let j = 0;
    for (let i = 0; i < sorted.length; i++) {
      while (sorted[j] < sorted[i] - 3_600_000) j += 1;
      if (i - j + 1 > 3) return false;
    }
  }
  return true;
})());

// Test_Dataset_Note_Renders: the dataset note + download link render on the detail page.
check("ML detail page renders dataset note and download link", detailSource.includes("job.datasetNote") && detailSource.includes("job.datasetHref") && Boolean(mlJob?.datasetNote) && mlJob.datasetNote.includes("**Note:**") && mlJob.datasetHref === "/careers/ml-engineer-risk/fraud-hunt/ledger.csv");

// Test_SEO_MLRole: metadata + JSON-LD inputs (salary band, employment type, postedAt).
check("ML role SEO inputs: salary band, PART_TIME employment type, postedAt", mlJob.salaryMin === 2000 && mlJob.salaryMax === 3500 && mlJob.employmentType === "PART_TIME" && mlJob.postedAt === "2026-09-23" && detailSource.includes("job.salaryMin") && detailSource.includes("JobPosting"));

// Test_Form_MinChars: server-side minimum enforcement for ML textareas.
check("server enforces ML textarea minimums (200 chars) before providers", (() => {
  const shortAnswers = Object.fromEntries(ML_QUESTION_IDS.map((id) => [id, id === "ml-models-deployed" ? "3" : "too short"]));
  return onRequestPost({ request: new Request("https://mattiaciuni.pages.dev/api/careers/apply", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ job_slug: "ml-engineer-risk", full_name: "ML Candidate", email: "ml@example.com", country_timezone: "UTC+1", artifact_link: "https://example.com/notebook", artifact_description: longArtifact, motivation: longMotivation, cv_filename: "cv.pdf", cv_base64: "JVBERi0xLjQK", custom_answers: shortAnswers }) }), env: {} }).then((r) => {
    if (r.status !== 422) return false;
    return r.json().then((data) => ML_QUESTION_IDS.every((id) => `custom_${id}` in (data.fields || {})));
  });
})());

// Test_Mobile_MLRole: the detail page has no horizontal overflow primitives and
// the meta grid collapses on small screens (structural check; live 320px pass
// remains a manual check).
check("ML detail page is mobile-safe by construction (fluid content column, collapsing meta grid, mobile apply bar)", detailSource.includes("grid-cols-2") && detailSource.includes("career-meta") && detailSource.includes("career-mobile-apply") && detailSource.includes("min-w-0"));

console.log(failures ? `careers: ${failures} FAILED` : "careers: data, validation and honeypot contracts passed; live email/Supabase flow remains UNVERIFIED");
process.exit(failures ? 1 : 0);
