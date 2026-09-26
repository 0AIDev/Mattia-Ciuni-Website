"use client";

import { useMemo, useState } from "react";
import { WorldMap } from "@/components/WorldMap";
import { ChevronDownIcon } from "@/components/admin/icons";
import { DeployStatusLine } from "@/components/AdminDeployStatus";
import type { CareerQuestion } from "@/lib/careers/jobs";
import { Button, Card, Empty, Field, InlineButton, Notice, Pill, SectionHeader, Select, Table, TextArea, TextInput } from "@/components/admin/ui";
import type { AdminContentItem, CmsKind } from "@/lib/cms-types";

/**
 * Le sezioni del pannello che non hanno bisogno di un proprio endpoint.
 *
 * Stanno qui, e non in `AdminWorkspace.tsx`, perche' il file del workspace deve
 * contenere solo la navigazione: quando una sezione cresce, il diff deve toccare
 * un file suo e non la struttura dell'interfaccia.
 */

export type FeedbackRecord = { id: string; submitted_at: string; status: "pending_review" | "published" | "rejected"; name: string; email: string; message: string; page_url: string };
export type AnalyticsRow = Record<string, unknown>;
export type AnalyticsData = { daily: AnalyticsRow[]; pages: AnalyticsRow[]; flow: AnalyticsRow[]; acquisition: AnalyticsRow[]; conversions: AnalyticsRow[]; geo: AnalyticsRow[]; available: boolean };
export type ApplicantRecord = {
  id: string; job_slug: string; full_name: string; email: string; country_timezone?: string; github_url?: string | null;
  portfolio_url?: string | null; artifact_link?: string; artifact_description?: string; motivation?: string;
  custom_answers?: Record<string, unknown>; cv_filename?: string; email_verified?: boolean; status?: string;
  submitted_at?: string; created_at?: string;
};
export type AdminJob = {
  slug: string; title: string; department: string; location: string; type: string; compensation: string;
  status: "open" | "coming-soon" | "closed"; shortPitch: string; description: string; questions?: CareerQuestion[];
};
export type ConfigStatus = { github: boolean; deploy_hook: boolean; supabase: boolean; tables: boolean | null; storage: boolean; branch: string | null; repository: string | null };

function number(row: AnalyticsRow | undefined, key: string, fallback = "0") {
  const item = row?.[key];
  if (item === null || item === undefined || item === "") return fallback;
  const parsed = Number(item);
  return Number.isFinite(parsed) ? parsed.toLocaleString() : String(item);
}

function Metrics({ analytics }: { analytics: AnalyticsData | null }) {
  const pages = analytics?.pages || [];
  const visitors = analytics?.daily.reduce((sum, row) => sum + Number(row.visitors || 0), 0) || 0;
  const views = pages.reduce((sum, row) => sum + Number(row.views || 0), 0);
  const leaves = pages.reduce((sum, row) => sum + Number(row.leaves || 0), 0);
  const duration = pages.length ? Math.round(pages.reduce((sum, row) => sum + Number(row.avg_seconds || 0), 0) / pages.length) : 0;
  const metrics: Array<[string, string | number]> = [["Visitors", visitors], ["Views", views], ["Pages", pages.length], ["Exit rate", `${views ? Math.round((leaves / views) * 100) : 0}%`], ["Avg. duration", `${duration}s`]];
  return (
    <div className="grid overflow-hidden rounded-lg border border-admin-line bg-admin-panel sm:grid-cols-5">
      {metrics.map(([label, value], index) => (
        <div key={label} className={`p-3.5 ${index ? "border-t border-admin-line sm:border-l sm:border-t-0" : ""}`}>
          <p className="text-[11px] uppercase tracking-[.06em] text-admin-faint">{label}</p>
          <p className="admin-tabular mt-2 text-[20px] font-medium tracking-[-.02em] text-admin-ink">{value}</p>
        </div>
      ))}
    </div>
  );
}

function VisitorsChart({ analytics }: { analytics: AnalyticsData | null }) {
  const rows = (analytics?.daily || []).slice(0, 14).reverse();
  const max = Math.max(1, ...rows.map((row) => Number(row.visitors || 0)));
  return (
    <Card title="Visitors">
      <div className="flex h-36 items-end gap-1.5 border-b border-admin-line">
        {rows.length ? rows.map((row, index) => (
          <div key={index} className="group flex h-full flex-1 items-end">
            <div className="relative w-full rounded-t-[2px] bg-admin-ink/85" style={{ height: `${Math.max(3, (Number(row.visitors || 0) / max) * 100)}%` }}>
              <span className="admin-tabular absolute -top-5 left-1/2 hidden -translate-x-1/2 text-[11px] text-admin-ink group-hover:block">{number(row, "visitors")}</span>
            </div>
          </div>
        )) : <p className="w-full pb-4 text-center text-[13px] text-admin-faint">Waiting for traffic data.</p>}
      </div>
    </Card>
  );
}

export function AnalyticsView({ analytics }: { analytics: AnalyticsData | null }) {
  return (
    <div className="space-y-4">
      <Metrics analytics={analytics} />
      <VisitorsChart analytics={analytics} />
      <div className="grid gap-4 xl:grid-cols-2">
        <Card title="Pages">{analytics?.pages.length ? <Table headers={["Page", "Views", "Avg. time", "Scroll"]} rows={analytics.pages.slice(0, 12).map((row) => [<span key={String(row.page_path)} className="truncate">{String(row.page_path)}</span>, number(row, "views"), `${number(row, "avg_seconds", "—")}s`, `${number(row, "avg_scroll_percent", "—")}%`])} /> : <Empty />}</Card>
        <Card title="World map"><WorldMap rows={analytics?.geo || []} /></Card>
      </div>
      <div className="grid gap-4 xl:grid-cols-2">
        <Card title="Flow">{analytics?.flow.length ? <Table headers={["From", "To", "Moves", "Time"]} rows={analytics.flow.slice(0, 10).map((row) => [String(row.from_path), String(row.next_page || "(none)"), number(row, "moves"), `${number(row, "avg_seconds_before_leaving", "—")}s`])} /> : <Empty />}</Card>
        <Card title="Acquisition">{analytics?.acquisition.length ? <Table headers={["Source / medium", "Campaign", "Visitors", "Conv."]} rows={analytics.acquisition.slice(0, 10).map((row) => [`${String(row.source)} / ${String(row.medium)}`, String(row.campaign), number(row, "visitors"), number(row, "conversions")])} /> : <Empty />}</Card>
      </div>
      <Card title="Conversions">{analytics?.conversions.length ? <Table headers={["Event", "Page", "Source", "Campaign"]} rows={analytics.conversions.slice(0, 12).map((row) => [String(row.conversion), String(row.page_path), String(row.source), String(row.campaign)])} /> : <Empty>No conversions recorded yet.</Empty>}</Card>
    </div>
  );
}

export function Overview({ analytics, records, jobs, applicants, items }: { analytics: AnalyticsData | null; records: FeedbackRecord[]; jobs: AdminJob[]; applicants: ApplicantRecord[]; items: AdminContentItem[] }) {
  const drafts = items.filter((item) => item.status === "draft").length;
  const counters: Array<[string, number]> = [
    ["Items in the library", items.length],
    ["Drafts waiting", drafts],
    ["Published to Git", items.filter((item) => item.status === "published").length],
    ["Open roles", jobs.filter((job) => job.status === "open").length],
  ];
  return (
    <div className="space-y-4">
      <SectionHeader eyebrow="Site" title="Overview" description="The site, without the noise." />
      <Metrics analytics={analytics} />
      <div className="grid gap-4 xl:grid-cols-[1.4fr_1fr]">
        <VisitorsChart analytics={analytics} />
        <Card title="Content">
          <div className="grid grid-cols-2 gap-x-4 gap-y-3">
            {counters.map(([label, value]) => (
              <div key={label}>
                <p className="admin-tabular text-[20px] font-medium tracking-[-.02em] text-admin-ink">{value}</p>
                <p className="mt-0.5 text-[12px] text-admin-muted">{label}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <Card title="Inbox"><p className="admin-tabular text-[24px] font-medium tracking-[-.02em] text-admin-ink">{records.length}</p><p className="mt-1 text-[12px] text-admin-muted">waiting for review</p></Card>
        <Card title="Applicants"><p className="admin-tabular text-[24px] font-medium tracking-[-.02em] text-admin-ink">{applicants.length}</p><p className="mt-1 text-[12px] text-admin-muted">applications for the open roles</p></Card>
        <Card title="Jobs"><p className="admin-tabular text-[24px] font-medium tracking-[-.02em] text-admin-ink">{jobs.length}</p><p className="mt-1 text-[12px] text-admin-muted">offers in the registry</p></Card>
      </div>
    </div>
  );
}

export function FeedbackView({ records, loading, onCreateTest, onModerate }: { records: FeedbackRecord[]; loading: boolean; onCreateTest: () => void; onModerate: (id: string, action: "publish" | "reject") => void }) {
  return (
    <div className="space-y-4">
      <SectionHeader
        eyebrow="Community"
        title="Inbox"
        description="Everything people sent. Publish it if it holds, reject it if it does not."
        actions={<Button onClick={onCreateTest} disabled={loading}>Send test feedback</Button>}
      />
      {records.length ? records.map((record) => (
        <article key={record.id} className="overflow-hidden rounded-lg border border-admin-line bg-admin-panel">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-admin-line px-3.5 py-2">
            <span className="min-w-0 truncate text-[12px] text-admin-ink">{record.name || "Anonymous"}{record.email ? ` · ${record.email}` : ""}</span>
            <time className="shrink-0 text-[12px] text-admin-faint">{new Date(record.submitted_at).toLocaleString()}</time>
          </div>
          <div className="p-3.5">
            <p className="max-w-3xl whitespace-pre-wrap text-[13px] leading-5 text-admin-muted">{record.message}</p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Button onClick={() => onModerate(record.id, "publish")} disabled={loading}>Publish</Button>
              <Button onClick={() => onModerate(record.id, "reject")} disabled={loading}>Reject</Button>
              <span className="truncate text-[12px] text-admin-faint">{record.page_url}</span>
            </div>
          </div>
        </article>
      )) : <Card title="Feedback"><Empty>The queue is empty.</Empty></Card>}
    </div>
  );
}

function jobTitleOf(jobs: AdminJob[], slug: string): string {
  return jobs.find((job) => job.slug === slug)?.title || slug;
}

export function ApplicantsView({ applicants, jobs, loading }: { applicants: ApplicantRecord[]; jobs: AdminJob[]; loading: boolean }) {
  const [openId, setOpenId] = useState<string | null>(null);
  const [filter, setFilter] = useState("");
  const visible = useMemo(
    () => (filter ? applicants.filter((item) => item.job_slug === filter) : applicants),
    [applicants, filter],
  );
  return (
    <div className="space-y-4">
      <SectionHeader
        eyebrow="Hiring"
        title="Applicants"
        description="Every application from the careers forms, newest first. The CV stays in storage: this list shows what was written."
        actions={<div className="w-52"><Select value={filter} onChange={setFilter} label="Filter by role" options={[{ value: "", label: "All roles" }, ...jobs.map((job) => ({ value: job.slug, label: job.title }))]} /></div>}
      />
      {visible.length ? visible.map((applicant) => {
        const open = openId === applicant.id;
        return (
          <article key={applicant.id} className="overflow-hidden rounded-lg border border-admin-line bg-admin-panel">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-admin-line px-3.5 py-2">
              <span className="min-w-0 truncate text-[12px] text-admin-ink">
                {applicant.full_name}{applicant.email ? ` · ${applicant.email}` : ""}{applicant.email_verified ? " · verified" : ""}
              </span>
              <time className="shrink-0 text-[12px] text-admin-faint">{new Date(applicant.submitted_at || applicant.created_at || "").toLocaleString()}</time>
            </div>
            <div className="p-3.5">
              <p className="text-[13px] font-medium text-admin-ink">
                {jobTitleOf(jobs, String(applicant.job_slug))}
                {applicant.country_timezone ? <span className="ml-2 font-normal text-admin-muted">{String(applicant.country_timezone)}</span> : null}
              </p>
              {applicant.artifact_link ? (
                <p className="mt-1 flex flex-wrap items-center gap-3 break-all text-[12px]">
                  <a href={String(applicant.artifact_link)} target="_blank" rel="noreferrer noopener" className="text-admin-muted underline decoration-dotted underline-offset-2 hover:text-admin-ink">Artifact</a>
                  {applicant.cv_filename ? <span className="text-admin-faint">CV: {String(applicant.cv_filename)}</span> : null}
                </p>
              ) : null}
              {open ? (
                <div className="mt-3 space-y-3 rounded-md border border-admin-line bg-admin-bg p-3 text-[13px] leading-5 text-admin-muted">
                  <p className="whitespace-pre-wrap">{String(applicant.artifact_description || "")}</p>
                  <p className="whitespace-pre-wrap">{String(applicant.motivation || "")}</p>
                  {applicant.github_url || applicant.portfolio_url ? (
                    <p className="flex flex-wrap gap-3 text-[12px]">
                      {applicant.github_url ? <a href={String(applicant.github_url)} target="_blank" rel="noreferrer noopener" className="text-admin-muted underline decoration-dotted underline-offset-2 hover:text-admin-ink">GitHub</a> : null}
                      {applicant.portfolio_url ? <a href={String(applicant.portfolio_url)} target="_blank" rel="noreferrer noopener" className="text-admin-muted underline decoration-dotted underline-offset-2 hover:text-admin-ink">Portfolio</a> : null}
                    </p>
                  ) : null}
                  {applicant.custom_answers && Object.keys(applicant.custom_answers).length ? (
                    <div className="space-y-1.5 border-t border-admin-line pt-2.5">
                      <p className="text-[11px] uppercase tracking-[.06em] text-admin-faint">Custom answers</p>
                      {Object.entries(applicant.custom_answers).map(([key, value]) => <p key={key} className="whitespace-pre-wrap text-[12px]"><span className="font-mono text-[11px] text-admin-faint">{key}: </span>{String(value)}</p>)}
                    </div>
                  ) : null}
                </div>
              ) : null}
              <div className="mt-3">
                <InlineButton onClick={() => setOpenId(open ? null : applicant.id)}>{open ? "Collapse" : "Read application"}</InlineButton>
              </div>
            </div>
          </article>
        );
      }) : <Card title="Applicants"><Empty>No applications yet.{loading ? "" : " They appear as soon as someone completes the form."}</Empty></Card>}
    </div>
  );
}

export function JobsView({ jobs: initialJobs, loading, onSaveJobs, pendingSince }: { jobs: AdminJob[]; loading: boolean; onSaveJobs: (jobs: AdminJob[]) => void; pendingSince?: string | null }) {
  const [jobs, setJobs] = useState(initialJobs);
  const [selected, setSelected] = useState(0);
  const current = jobs[selected];
  function update(key: keyof AdminJob, input: string | CareerQuestion[]) { setJobs((items) => items.map((job, index) => index === selected ? { ...job, [key]: input } : job)); }
  function addJob() { const next: AdminJob = { slug: `new-role-${jobs.length + 1}`, title: "New role", department: "Engineering", location: "Remote", type: "Full-time", compensation: "", status: "coming-soon", shortPitch: "", description: "", questions: [] }; setJobs((items) => [...items, next]); setSelected(jobs.length); }
  function addQuestion() { update("questions", [...(current.questions || []), { id: `question-${Date.now()}`, label: "New question", type: "textarea", required: true, minimum: 0 }]); }
  function updateQuestion(index: number, key: keyof CareerQuestion, value: string | boolean) { const questions = [...(current.questions || [])]; questions[index] = { ...questions[index], [key]: key === "minimum" ? Math.max(0, Number(value) || 0) : value } as CareerQuestion; update("questions", questions); }
  return (
    <div className="space-y-4">
      <SectionHeader
        eyebrow="Hiring"
        title="Job offers"
        description="Create and manage the public careers pipeline. Saving updates the live registry, not a draft."
        actions={<><Button onClick={addJob}>Add offer</Button><Button tone="primary" onClick={() => onSaveJobs(jobs)} disabled={loading}>Save changes</Button><DeployStatusLine pendingSince={pendingSince} /></>}
      />
      <div className="grid gap-4 lg:grid-cols-[220px_1fr]">
        <Card title="Offers">
          <div className="-mx-3.5 divide-y divide-admin-line">
            {jobs.map((job, index) => (
              <button key={`${job.slug}-${index}`} type="button" onClick={() => setSelected(index)} className={`block w-full px-3.5 py-2 text-left text-[13px] transition-colors ${selected === index ? "bg-admin-soft text-admin-ink" : "text-admin-muted hover:bg-admin-soft hover:text-admin-ink"}`}>
                <span className="block truncate">{job.title}</span>
                <span className="mt-0.5 block text-[11px] text-admin-faint">{job.status}</span>
              </button>
            ))}
          </div>
        </Card>
        {current ? (
          <Card title="Offer details">
            <div className="grid gap-3 sm:grid-cols-2">
              {(["title", "slug", "department", "location", "type", "compensation"] as const).map((key) => (
                <Field key={key} label={key}><TextInput value={current[key]} onChange={(value) => update(key, value)} /></Field>
              ))}
              <Field label="status">
                <Select value={current.status} onChange={(value) => update("status", value)} label="Offer status" options={[{ value: "open", label: "Open" }, { value: "coming-soon", label: "Coming soon" }, { value: "closed", label: "Closed" }]} />
              </Field>
              <div className="sm:col-span-2"><Field label="short pitch"><TextInput value={current.shortPitch} onChange={(value) => update("shortPitch", value)} /></Field></div>
              <div className="sm:col-span-2"><Field label="description" hint="Markdown. The apply page shows this above the form."><TextArea rows={10} value={current.description} onChange={(value) => update("description", value)} /></Field></div>
              <div className="sm:col-span-2">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-[12px] text-admin-muted">custom questions</span>
                  <InlineButton onClick={addQuestion}>Add question</InlineButton>
                </div>
                <div className="space-y-2">
                  {(current.questions || []).map((question, index) => (
                    <div key={question.id} className="grid gap-2 rounded-md border border-admin-line p-2.5 sm:grid-cols-[1fr_120px_80px_70px]">
                      <TextInput value={question.label} onChange={(value) => updateQuestion(index, "label", value)} placeholder="Question" />
                      <Select value={question.type} onChange={(value) => updateQuestion(index, "type", value)} label="Answer type" options={[{ value: "text", label: "Short text" }, { value: "textarea", label: "Long text" }, { value: "url", label: "URL" }, { value: "number", label: "Number" }]} />
                      <input type="number" min={0} value={question.minimum} onChange={(event) => updateQuestion(index, "minimum", event.target.value)} aria-label="Minimum characters" className="w-full rounded-md border border-admin-line px-2.5 py-1.5 text-[13px] text-admin-ink outline-none transition-colors hover:border-[#dbdbd8]" />
                      <label className="flex items-center gap-2 text-[12px] text-admin-muted"><input type="checkbox" className="h-3.5 w-3.5 accent-[#282a30]" checked={question.required} onChange={(event) => updateQuestion(index, "required", event.target.checked)} />Required</label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        ) : <Empty>Add your first offer.</Empty>}
      </div>
    </div>
  );
}

export function SettingsView({
  onCreateNda,
  config,
  onPublishContent,
  publishing,
  onRebuildSite,
  rebuilding,
  pendingSince,
}: {
  onCreateNda: (fullName: string, email: string) => Promise<string | null>;
  config: ConfigStatus | null;
  onPublishContent: (id: string) => Promise<boolean>;
  publishing: boolean;
  onRebuildSite: () => Promise<void>;
  rebuilding: boolean;
  pendingSince?: string | null;
}) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [link, setLink] = useState("");
  const [error, setError] = useState("");
  const [creating, setCreating] = useState(false);
  const [showSchema, setShowSchema] = useState(false);

  async function createNda() {
    setCreating(true); setError(""); setLink("");
    const created = await onCreateNda(fullName, email);
    if (created) { setLink(created); setFullName(""); setEmail(""); } else setError("The NDA link could not be created.");
    setCreating(false);
  }

  const checks: Array<[string, boolean | null, string]> = [
    ["GitHub publishing", config?.github ?? null, "Commits the published JSON"],
    ["Cloudflare deploy hook", config?.deploy_hook ?? null, "Triggers a build after a publish"],
    ["Supabase connection", config?.supabase ?? null, "URL and service role key, server-only"],
    ["Supabase tables", config?.tables ?? null, "Where a draft is written; without them the save fails"],
    ["R2 media", config?.storage ?? null, "Images, audio and documents"],
  ];

  return (
    <div className="space-y-4">
      <SectionHeader eyebrow="Workspace" title="Settings" description="The controls that should not be hidden in code." />
      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Publishing status">
          <div className="space-y-2.5">
            {checks.map(([label, ok, hint]) => (
              <div key={label} className="flex items-start justify-between gap-4 border-b border-admin-line pb-2.5 last:border-0 last:pb-0">
                <div>
                  <p className="text-[13px] text-admin-ink">{label}</p>
                  <p className="mt-0.5 text-[12px] text-admin-faint">{hint}</p>
                </div>
                <Pill tone={ok === null ? "neutral" : ok ? "good" : "bad"}>{ok === null ? "unknown" : ok ? "ready" : "not configured"}</Pill>
              </div>
            ))}
            {config?.repository ? <p className="pt-0.5 font-mono text-[11px] text-admin-faint">{config.repository} @ {config.branch}</p> : null}
            {!config?.github ? <Notice tone="bad">Publishing is off: without the GitHub token the panel can save drafts, but nothing reaches the public site.</Notice> : null}
            {config && config.supabase && config.tables === false ? <Notice tone="bad">The Supabase tables are missing, so no draft can be written. Run the two migrations in supabase/migrations (20260925_000006 and 20260925_000007) in the Supabase SQL editor; they only create tables.</Notice> : null}
          </div>
        </Card>

        <Card title="NDA access">
          <p className="text-[13px] leading-5 text-admin-muted">Create a one-time private link. The recipient name and email are stored in Supabase; the raw token is never stored.</p>
          <div className="mt-3 space-y-3">
            <Field label="Full name"><TextInput value={fullName} onChange={setFullName} /></Field>
            <Field label="Email"><TextInput type="email" value={email} onChange={setEmail} /></Field>
            <Button tone="primary" onClick={() => void createNda()} disabled={creating || !fullName || !email}>{creating ? "Creating…" : "Create NDA link"}</Button>
            {error ? <p role="alert" className="text-[12px] text-admin-muted">{error}</p> : null}
            {link ? (
              <div className="rounded-md border border-admin-line bg-admin-bg p-2.5">
                <p className="text-[12px] text-admin-faint">Send this link manually. It expires in 30 days and works once.</p>
                <input readOnly value={link} aria-label="Generated NDA link" className="mt-1.5 w-full min-w-0 border-0 bg-transparent p-0 font-mono text-[11px] text-admin-ink outline-none" onFocus={(event) => event.currentTarget.select()} />
              </div>
            ) : null}
          </div>
        </Card>
      </div>

      <Card title="Analytics and privacy">
        <div className="space-y-2.5 text-[13px] text-admin-muted">
          <p className="leading-5">Anonymous first-party aggregates are active. GA4 remains consent-gated. Microsoft Clarity records sessions with masked inputs. No IP address or user agent is exposed here.</p>
          {[["Umami", "Connected"], ["Microsoft Clarity", "Connected"], ["Supabase views", "Server-only"]].map(([label, value]) => (
            <div key={label} className="flex justify-between border-t border-admin-line pt-2.5"><span>{label}</span><span className="text-admin-faint">{value}</span></div>
          ))}
        </div>
      </Card>

      <Card title="Publish pipeline">
        <button type="button" onClick={() => setShowSchema((current) => !current)} className="flex w-full items-center justify-between text-left text-[13px] text-admin-muted transition-colors hover:text-admin-ink">
          <span>What a publish does, step by step</span>
          <ChevronDownIcon className={`h-3.5 w-3.5 shrink-0 text-admin-faint transition-transform ${showSchema ? "rotate-180" : ""}`} />
        </button>
        {showSchema ? (
          <ol className="mt-3 space-y-1.5 border-t border-admin-line pt-3 text-[12px] leading-5 text-admin-muted">
            <li>1 · The draft is validated and written to the admin table.</li>
            <li>2 · The published JSON is committed to content/cms/&lt;kind&gt;/&lt;slug&gt;.json on Git.</li>
            <li>3 · That commit <em>is</em> the build request: Cloudflare Pages builds every push to the production branch, and the deploy hook is not called on top of it.</li>
            <li>4 · Redirects become out/_redirects, pages become real routes, sitemap and cards follow.</li>
            <li>5 · The build writes its finishing time to /deploy.json, which is how this panel knows the change is online.</li>
          </ol>
        ) : null}
        <div className="mt-3 flex flex-wrap items-center gap-3 border-t border-admin-line pt-3">
          <Button onClick={() => void onRebuildSite()} disabled={rebuilding || !config?.deploy_hook}>
            {rebuilding ? "Starting…" : "Rebuild the site"}
          </Button>
          <DeployStatusLine pendingSince={pendingSince} />
          {!config?.deploy_hook ? <p className="text-[12px] text-admin-faint">The deploy hook is not configured, so a manual rebuild is not available.</p> : null}
        </div>
      </Card>
    </div>
  );
}

export type { CmsKind };
