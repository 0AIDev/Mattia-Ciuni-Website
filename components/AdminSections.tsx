"use client";

import { useMemo, useState } from "react";
import { WorldMap } from "@/components/WorldMap";
import { CustomDropdown } from "@/components/CustomDropdown";
import type { CareerQuestion } from "@/lib/careers/jobs";
import { Button, Card, Empty, Field, Notice, Pill, SectionHeader, Select, Table, TextArea, TextInput } from "@/components/admin/ui";
import type { AdminContentItem, CmsKind } from "@/lib/cms-types";

/**
 * Le sezioni del pannello che non hanno bisogno di un proprio endpoint.
 *
 * Stanno qui, e non in `AdminWorkspace.tsx`, perche' il file del workspace deve
 * contenere solo la navigazione: quando una sezione cresce, il diff deve
 * toccare un file suo e non la struttura dell'interfaccia.
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
export type ConfigStatus = { github: boolean; deploy_hook: boolean; supabase: boolean; storage: boolean; branch: string | null; repository: string | null };

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
    <div className="admin-card grid overflow-hidden border border-[#e5e5e3] bg-white sm:grid-cols-5">
      {metrics.map(([label, value]) => (
        <div key={label} className="border-b border-[#ededeb] p-4 sm:border-b-0 sm:border-r sm:last:border-r-0">
          <p className="text-xs text-[#777]">{label}</p>
          <p className="mt-3 text-2xl tracking-[-.04em] text-[#111]">{value}</p>
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
      <div className="flex h-44 items-end gap-2 border-b border-[#bdbdbd]">
        {rows.length ? rows.map((row, index) => (
          <div key={index} className="group flex h-full flex-1 items-end">
            <div className="relative w-full bg-[#222]" style={{ height: `${Math.max(3, (Number(row.visitors || 0) / max) * 100)}%` }}>
              <span className="absolute -top-5 left-1/2 hidden -translate-x-1/2 text-[10px] text-[#111] group-hover:block">{number(row, "visitors")}</span>
            </div>
          </div>
        )) : <div className="flex w-full items-center justify-center text-sm text-[#777]">Waiting for traffic data.</div>}
      </div>
    </Card>
  );
}

export function AnalyticsView({ analytics }: { analytics: AnalyticsData | null }) {
  return (
    <div className="space-y-6">
      <Metrics analytics={analytics} />
      <VisitorsChart analytics={analytics} />
      <div className="grid gap-6 xl:grid-cols-2">
        <Card title="Pages">{analytics?.pages.length ? <Table headers={["Page", "Views", "Avg. time", "Scroll"]} rows={analytics.pages.slice(0, 12).map((row) => [<span key={String(row.page_path)} className="truncate">{String(row.page_path)}</span>, number(row, "views"), `${number(row, "avg_seconds", "—")}s`, `${number(row, "avg_scroll_percent", "—")}%`])} /> : <Empty />}</Card>
        <Card title="World map"><WorldMap rows={analytics?.geo || []} /></Card>
      </div>
      <div className="grid gap-6 xl:grid-cols-2">
        <Card title="Flow">{analytics?.flow.length ? <Table headers={["From", "To", "Moves", "Time"]} rows={analytics.flow.slice(0, 10).map((row) => [String(row.from_path), String(row.next_page || "(none)"), number(row, "moves"), `${number(row, "avg_seconds_before_leaving", "—")}s`])} /> : <Empty />}</Card>
        <Card title="Acquisition">{analytics?.acquisition.length ? <Table headers={["Source / medium", "Campaign", "Visitors", "Conv."]} rows={analytics.acquisition.slice(0, 10).map((row) => [`${String(row.source)} / ${String(row.medium)}`, String(row.campaign), number(row, "visitors"), number(row, "conversions")])} /> : <Empty />}</Card>
      </div>
      <Card title="Conversions">{analytics?.conversions.length ? <Table headers={["Event", "Page", "Source", "Campaign"]} rows={analytics.conversions.slice(0, 12).map((row) => [String(row.conversion), String(row.page_path), String(row.source), String(row.campaign)])} /> : <Empty>No conversions recorded yet.</Empty>}</Card>
    </div>
  );
}

export function Overview({ analytics, records, jobs, applicants, items }: { analytics: AnalyticsData | null; records: FeedbackRecord[]; jobs: AdminJob[]; applicants: ApplicantRecord[]; items: AdminContentItem[] }) {
  const drafts = items.filter((item) => item.status === "draft").length;
  return (
    <div className="space-y-6">
      <SectionHeader eyebrow="Workspace" title="Overview" description="The site, without the noise." />
      <Metrics analytics={analytics} />
      <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <VisitorsChart analytics={analytics} />
        <Card title="Content">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div><p className="text-2xl text-[#111]">{items.length}</p><p className="mt-1 text-xs text-[#777]">items in the library</p></div>
            <div><p className="text-2xl text-[#111]">{drafts}</p><p className="mt-1 text-xs text-[#777]">drafts waiting</p></div>
            <div><p className="text-2xl text-[#111]">{items.filter((item) => item.status === "published").length}</p><p className="mt-1 text-xs text-[#777]">published to Git</p></div>
            <div><p className="text-2xl text-[#111]">{jobs.filter((job) => job.status === "open").length}</p><p className="mt-1 text-xs text-[#777]">open roles</p></div>
          </div>
        </Card>
      </div>
      <div className="grid gap-6 md:grid-cols-3">
        <Card title="Feedback"><p className="text-3xl text-[#111]">{records.length}</p><p className="mt-2 text-sm text-[#777]">waiting for review</p></Card>
        <Card title="Applicants"><p className="text-3xl text-[#111]">{applicants.length}</p><p className="mt-2 text-sm text-[#777]">applications for the open roles</p></Card>
        <Card title="Jobs"><p className="text-3xl text-[#111]">{jobs.length}</p><p className="mt-2 text-sm text-[#777]">offers in the registry</p></Card>
      </div>
    </div>
  );
}

export function FeedbackView({ records, loading, onCreateTest, onModerate }: { records: FeedbackRecord[]; loading: boolean; onCreateTest: () => void; onModerate: (id: string, action: "publish" | "reject") => void }) {
  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="Community"
        title="Inbox"
        description="Everything people sent. Publish it if it holds, reject it if it does not."
        actions={<Button onClick={onCreateTest} disabled={loading}>Send test feedback</Button>}
      />
      {records.length ? records.map((record) => (
        <article key={record.id} className="admin-card rounded-[20px] border border-[#e5e5e3] bg-white p-5 sm:p-6">
          <div className="flex flex-wrap justify-between gap-3 text-xs text-[#777]">
            <span className="text-[#222]">{record.name || "Anonymous"}{record.email ? ` · ${record.email}` : ""}</span>
            <time>{new Date(record.submitted_at).toLocaleString()}</time>
          </div>
          <p className="mt-5 max-w-3xl whitespace-pre-wrap text-sm leading-6 text-[#333]">{record.message}</p>
          <div className="mt-5 flex flex-wrap items-center gap-4 text-xs">
            <button type="button" onClick={() => onModerate(record.id, "publish")} disabled={loading} className="border-b border-[#111] pb-1 text-[#111] disabled:opacity-50">Publish</button>
            <button type="button" onClick={() => onModerate(record.id, "reject")} disabled={loading} className="border-b border-[#aaa] pb-1 text-[#666] disabled:opacity-50">Reject</button>
            <span className="text-[#888]">{record.page_url}</span>
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
    <div className="space-y-6">
      <SectionHeader
        eyebrow="Hiring"
        title="Applicants"
        description="Every application from the careers forms, newest first. The CV stays in storage: this list shows what was written."
        actions={<div className="w-56"><Select value={filter} onChange={setFilter} label="Filter by role" options={[{ value: "", label: "All roles" }, ...jobs.map((job) => ({ value: job.slug, label: job.title }))]} /></div>}
      />
      {visible.length ? visible.map((applicant) => {
        const open = openId === applicant.id;
        return (
          <article key={applicant.id} className="admin-card rounded-[20px] border border-[#e5e5e3] bg-white p-5 sm:p-6">
            <div className="flex flex-wrap items-baseline justify-between gap-3 text-xs text-[#777]">
              <span className="text-[#222]">{applicant.full_name}{applicant.email ? ` · ${applicant.email}` : ""}{applicant.email_verified ? " · verified" : ""}</span>
              <time>{new Date(applicant.submitted_at || applicant.created_at || "").toLocaleString()}</time>
            </div>
            <p className="mt-2 text-sm font-medium text-[#111]">{jobTitleOf(jobs, String(applicant.job_slug))}{applicant.country_timezone ? <span className="ml-2 font-normal text-[#777]">{String(applicant.country_timezone)}</span> : null}</p>
            {applicant.artifact_link ? <p className="mt-1 break-all text-xs"><a href={String(applicant.artifact_link)} target="_blank" rel="noreferrer noopener" className="underline">Artifact</a>{applicant.cv_filename ? <span className="ml-3 text-[#999]">CV: {String(applicant.cv_filename)}</span> : null}</p> : null}
            {open ? (
              <div className="mt-4 space-y-4 text-sm leading-6 text-[#333]">
                <p className="whitespace-pre-wrap">{String(applicant.artifact_description || "")}</p>
                <p className="whitespace-pre-wrap">{String(applicant.motivation || "")}</p>
                {applicant.github_url || applicant.portfolio_url ? (
                  <p className="text-xs">
                    {applicant.github_url ? <a href={String(applicant.github_url)} target="_blank" rel="noreferrer noopener" className="mr-4 underline">GitHub</a> : null}
                    {applicant.portfolio_url ? <a href={String(applicant.portfolio_url)} target="_blank" rel="noreferrer noopener" className="underline">Portfolio</a> : null}
                  </p>
                ) : null}
                {applicant.custom_answers && Object.keys(applicant.custom_answers).length ? (
                  <div className="space-y-2 border-t border-[#ededeb] pt-3 text-xs text-[#555]">
                    <p className="text-[10px] uppercase tracking-[.14em] text-[#777]">Custom answers</p>
                    {Object.entries(applicant.custom_answers).map(([key, value]) => <p key={key} className="whitespace-pre-wrap"><span className="font-mono text-[11px] text-[#999]">{key}: </span>{String(value)}</p>)}
                  </div>
                ) : null}
              </div>
            ) : null}
            <div className="mt-4">
              <button type="button" onClick={() => setOpenId(open ? null : applicant.id)} className="border-b border-[#aaa] pb-0.5 text-xs text-[#555]">{open ? "Collapse" : "Read application"}</button>
            </div>
          </article>
        );
      }) : <Card title="Applicants"><Empty>No applications yet.{loading ? "" : " They appear as soon as someone completes the form."}</Empty></Card>}
    </div>
  );
}

export function JobsView({ jobs: initialJobs, loading, onSaveJobs }: { jobs: AdminJob[]; loading: boolean; onSaveJobs: (jobs: AdminJob[]) => void }) {
  const [jobs, setJobs] = useState(initialJobs);
  const [selected, setSelected] = useState(0);
  const current = jobs[selected];
  function update(key: keyof AdminJob, input: string | CareerQuestion[]) { setJobs((items) => items.map((job, index) => index === selected ? { ...job, [key]: input } : job)); }
  function addJob() { const next: AdminJob = { slug: `new-role-${jobs.length + 1}`, title: "New role", department: "Engineering", location: "Remote", type: "Full-time", compensation: "", status: "coming-soon", shortPitch: "", description: "", questions: [] }; setJobs((items) => [...items, next]); setSelected(jobs.length); }
  function addQuestion() { update("questions", [...(current.questions || []), { id: `question-${Date.now()}`, label: "New question", type: "textarea", required: true, minimum: 0 }]); }
  function updateQuestion(index: number, key: keyof CareerQuestion, value: string | boolean) { const questions = [...(current.questions || [])]; questions[index] = { ...questions[index], [key]: key === "minimum" ? Math.max(0, Number(value) || 0) : value } as CareerQuestion; update("questions", questions); }
  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="Hiring"
        title="Job offers"
        description="Create and manage the public careers pipeline. Saving updates the live registry, not a draft."
        actions={<><Button onClick={addJob}>Add offer</Button><Button tone="primary" onClick={() => onSaveJobs(jobs)} disabled={loading}>Save changes</Button></>}
      />
      <div className="grid gap-6 lg:grid-cols-[230px_1fr]">
        <Card title="Offers">
          <div className="divide-y divide-[#ededeb]">
            {jobs.map((job, index) => (
              <button key={`${job.slug}-${index}`} type="button" onClick={() => setSelected(index)} className={`w-full px-1 py-3 text-left text-sm ${selected === index ? "font-medium text-[#111]" : "text-[#777]"}`}>
                <span className="block truncate">{job.title}</span>
                <span className="mt-1 block text-[11px] text-[#999]">{job.status}</span>
              </button>
            ))}
          </div>
        </Card>
        {current ? (
          <Card title="Offer details">
            <div className="grid gap-4 sm:grid-cols-2">
              {(["title", "slug", "department", "location", "type", "compensation"] as const).map((key) => (
                <Field key={key} label={key}><TextInput value={current[key]} onChange={(value) => update(key, value)} /></Field>
              ))}
              <Field label="status">
                <CustomDropdown value={current.status} onChange={(value) => update("status", value)} label="Offer status" options={[{ value: "open", label: "Open" }, { value: "coming-soon", label: "Coming soon" }, { value: "closed", label: "Closed" }]} />
              </Field>
              <div className="sm:col-span-2"><Field label="short pitch"><TextInput value={current.shortPitch} onChange={(value) => update("shortPitch", value)} /></Field></div>
              <div className="sm:col-span-2"><Field label="description" hint="Markdown. The apply page shows this above the form."><TextArea rows={10} value={current.description} onChange={(value) => update("description", value)} /></Field></div>
              <div className="sm:col-span-2">
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-xs text-[#777]">custom questions</span>
                  <button type="button" onClick={addQuestion} className="border-b border-[#111] text-xs text-[#111]">Add question</button>
                </div>
                <div className="space-y-3">
                  {(current.questions || []).map((question, index) => (
                    <div key={question.id} className="grid gap-2 rounded-2xl border border-[#ededeb] p-3 sm:grid-cols-[1fr_120px_80px_70px]">
                      <TextInput value={question.label} onChange={(value) => updateQuestion(index, "label", value)} placeholder="Question" />
                      <CustomDropdown value={question.type} onChange={(value) => updateQuestion(index, "type", value)} label="Answer type" options={[{ value: "text", label: "Short text" }, { value: "textarea", label: "Long text" }, { value: "url", label: "URL" }]} />
                      <input type="number" min={0} value={question.minimum} onChange={(event) => updateQuestion(index, "minimum", event.target.value)} aria-label="Minimum characters" className="admin-form-control rounded-full border border-[#bbb] px-3 py-2 text-sm outline-none" />
                      <label className="flex items-center gap-2 text-xs text-[#555]"><input type="checkbox" checked={question.required} onChange={(event) => updateQuestion(index, "required", event.target.checked)} />Required</label>
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
}: {
  onCreateNda: (fullName: string, email: string) => Promise<string | null>;
  config: ConfigStatus | null;
  onPublishContent: (id: string) => Promise<boolean>;
  publishing: boolean;
}) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [link, setLink] = useState("");
  const [error, setError] = useState("");
  const [creating, setCreating] = useState(false);

  async function createNda() {
    setCreating(true); setError(""); setLink("");
    const created = await onCreateNda(fullName, email);
    if (created) { setLink(created); setFullName(""); setEmail(""); } else setError("The NDA link could not be created.");
    setCreating(false);
  }

  const checks: Array<[string, boolean | null, string]> = [
    ["GitHub publishing", config?.github ?? null, "Commits the published JSON"],
    ["Cloudflare deploy hook", config?.deploy_hook ?? null, "Triggers a build after a publish"],
    ["Supabase", config?.supabase ?? null, "Drafts, media metadata, analytics"],
    ["R2 media", config?.storage ?? null, "Images, audio and documents"],
  ];

  return (
    <div className="space-y-6">
      <SectionHeader eyebrow="Workspace" title="Settings" description="The controls that should not be hidden in code." />
      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Publishing status">
          <div className="space-y-3">
            {checks.map(([label, ok, hint]) => (
              <div key={label} className="flex items-start justify-between gap-4 border-b border-[#ededeb] pb-3 last:border-0 last:pb-0">
                <div>
                  <p className="text-sm text-[#333]">{label}</p>
                  <p className="mt-0.5 text-xs text-[#999]">{hint}</p>
                </div>
                <Pill tone={ok === null ? "neutral" : ok ? "good" : "bad"}>{ok === null ? "unknown" : ok ? "ready" : "not configured"}</Pill>
              </div>
            ))}
            {config?.repository ? <p className="pt-1 font-mono text-[11px] text-[#999]">{config.repository} @ {config.branch}</p> : null}
            {!config?.github ? <Notice tone="bad">Publishing is off: without the GitHub token the panel can save drafts, but nothing reaches the public site.</Notice> : null}
          </div>
        </Card>

        <Card title="NDA access">
          <p className="text-sm leading-6 text-[#555]">Create a one-time private link. The recipient name and email are stored in Supabase; the raw token is never stored.</p>
          <div className="mt-5 space-y-3">
            <Field label="Full name"><TextInput value={fullName} onChange={setFullName} /></Field>
            <Field label="Email"><TextInput type="email" value={email} onChange={setEmail} /></Field>
            <Button tone="primary" onClick={() => void createNda()} disabled={creating || !fullName || !email}>{creating ? "Creating…" : "Create NDA link"}</Button>
            {error ? <p role="alert" className="text-xs text-[#8c3a3a]">{error}</p> : null}
            {link ? (
              <div className="rounded-2xl bg-[#f4f4f2] p-3">
                <p className="text-xs text-[#777]">Send this link manually. It expires in 30 days and works once.</p>
                <input readOnly value={link} aria-label="Generated NDA link" className="mt-2 w-full min-w-0 bg-transparent text-xs text-[#111] outline-none" onFocus={(event) => event.currentTarget.select()} />
              </div>
            ) : null}
          </div>
        </Card>
      </div>

      <Card title="Analytics and privacy">
        <div className="space-y-4 text-sm text-[#555]">
          <p className="leading-6">Anonymous first-party aggregates are active. GA4 remains consent-gated. Microsoft Clarity records sessions with masked inputs. No IP address or user agent is exposed here.</p>
          <div className="flex justify-between border-t border-[#ededeb] pt-3"><span>Umami</span><span>Connected</span></div>
          <div className="flex justify-between border-t border-[#ededeb] pt-3"><span>Microsoft Clarity</span><span>Connected</span></div>
          <div className="flex justify-between border-t border-[#ededeb] pt-3"><span>Supabase views</span><span>Server-only</span></div>
        </div>
      </Card>
    </div>
  );
}

export type { CmsKind };
