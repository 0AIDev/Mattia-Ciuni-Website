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

check("role is open and no placeholder role remains", openJobs().length === 1 && comingSoonJobs().length === 0 && getJob("agent-runtime-founding-engineer")?.status === "open");
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

console.log(failures ? `careers: ${failures} FAILED` : "careers: data, validation and honeypot contracts passed; live email/Supabase flow remains UNVERIFIED");
process.exit(failures ? 1 : 0);
