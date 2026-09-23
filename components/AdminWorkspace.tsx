"use client";

import { useMemo, useState } from "react";
import { CustomDropdown } from "@/components/CustomDropdown";
import type { CareerQuestion } from "@/lib/careers/jobs";

type FeedbackRecord = {
  id: string;
  submitted_at: string;
  status: "pending_review" | "published" | "rejected";
  name: string;
  email: string;
  message: string;
  page_url: string;
};

type AnalyticsRow = Record<string, unknown>;
export type AdminJob = {
  slug: string;
  title: string;
  department: string;
  location: string;
  type: string;
  compensation: string;
  status: "open" | "coming-soon" | "closed";
  shortPitch: string;
  description: string;
  questions?: CareerQuestion[];
};

type AnalyticsData = {
  daily: AnalyticsRow[];
  pages: AnalyticsRow[];
  flow: AnalyticsRow[];
  acquisition: AnalyticsRow[];
  conversions: AnalyticsRow[];
  available: boolean;
};

type Props = {
  records: FeedbackRecord[];
  analytics: AnalyticsData | null;
  jobs: AdminJob[];
  identity: { name: string; role: string; title: string } | null;
  loading: boolean;
  error: string;
  onLogout: () => void;
  onCreateTest: () => void;
  onModerate: (id: string, action: "publish" | "reject") => void;
  onSaveJobs: (jobs: AdminJob[]) => void;
  localMode?: boolean;
};

type Tab = "overview" | "analytics" | "feedback" | "jobs" | "settings";

const tabs: Array<{ id: Tab; label: string }> = [
  { id: "overview", label: "Overview" },
  { id: "analytics", label: "Analytics" },
  { id: "feedback", label: "Feedback" },
  { id: "jobs", label: "Job offers" },
  { id: "settings", label: "Settings" },
];

function number(row: AnalyticsRow | undefined, key: string, fallback = "0") {
  const item = row?.[key];
  if (item === null || item === undefined || item === "") return fallback;
  const parsed = Number(item);
  return Number.isFinite(parsed) ? parsed.toLocaleString() : String(item);
}

function Card({ title, children, className = "" }: { title: string; children: React.ReactNode; className?: string }) {
  return <section className={`admin-card border border-[#e5e5e3] bg-white p-5 sm:p-6 ${className}`}><div className="mb-5 flex items-baseline justify-between gap-4 border-b border-[#ededeb] pb-3"><h2 className="font-serif text-xl italic text-[#111]">{title}</h2></div>{children}</section>;
}

function Empty({ children = "No data yet." }: { children?: React.ReactNode }) {
  return <p className="py-12 text-center text-sm text-[#777]">{children}</p>;
}

function Table({ headers, rows }: { headers: string[]; rows: React.ReactNode[][] }) {
  return <div className="overflow-x-auto"><table className="w-full min-w-[560px] text-left text-[13px]"><thead><tr className="border-b border-[#d8d8d8] text-[10px] uppercase tracking-[.14em] text-[#777]">{headers.map((header) => <th key={header} className="px-3 pb-3 font-normal first:pl-0">{header}</th>)}</tr></thead><tbody>{rows.map((row, index) => <tr key={index} className="border-b border-[#ededed] last:border-0">{row.map((cell, cellIndex) => <td key={cellIndex} className="max-w-[280px] truncate px-3 py-3 text-[#333] first:pl-0">{cell}</td>)}</tr>)}</tbody></table></div>;
}

function Metrics({ analytics }: { analytics: AnalyticsData | null }) {
  const pages = analytics?.pages || [];
  const visitors = analytics?.daily.reduce((sum, row) => sum + Number(row.visitors || 0), 0) || 0;
  const views = pages.reduce((sum, row) => sum + Number(row.views || 0), 0);
  const leaves = pages.reduce((sum, row) => sum + Number(row.leaves || 0), 0);
  const duration = pages.length ? Math.round(pages.reduce((sum, row) => sum + Number(row.avg_seconds || 0), 0) / pages.length) : 0;
  const metrics: Array<[string, string | number]> = [["Visitors", visitors], ["Views", views], ["Pages", pages.length], ["Exit rate", `${views ? Math.round((leaves / views) * 100) : 0}%`], ["Avg. duration", `${duration}s`]];
  return <div className="admin-card grid overflow-hidden border border-[#e5e5e3] bg-white sm:grid-cols-5">{metrics.map(([label, value], index) => <div key={label} className={`border-b border-[#ededeb] p-4 sm:border-b-0 sm:border-r sm:last:border-r-0 ${index === 0 ? "sm:pl-5" : ""}`}><p className="text-xs text-[#777]">{label}</p><p className="mt-3 text-2xl tracking-[-.04em] text-[#111]">{value}</p></div>)}</div>;
}

function VisitorsChart({ analytics }: { analytics: AnalyticsData | null }) {
  const rows = (analytics?.daily || []).slice(0, 14).reverse();
  const max = Math.max(1, ...rows.map((row) => Number(row.visitors || 0)));
  return <Card title="Visitors"><div className="flex h-44 items-end gap-2 border-b border-[#bdbdbd]">{rows.length ? rows.map((row, index) => <div key={index} className="group flex h-full flex-1 items-end"><div className="relative w-full bg-[#222]" style={{ height: `${Math.max(3, (Number(row.visitors || 0) / max) * 100)}%` }}><span className="absolute -top-5 left-1/2 hidden -translate-x-1/2 text-[10px] text-[#111] group-hover:block">{number(row, "visitors")}</span></div></div>) : <div className="flex w-full items-center justify-center text-sm text-[#777]">Waiting for traffic data.</div>}</div><div className="mt-3 flex justify-between text-[10px] text-[#888]"><span>{rows[0]?.day ? String(rows[0].day).slice(0, 10) : "—"}</span><span>{rows.length ? String(rows[rows.length - 1].day).slice(0, 10) : "—"}</span></div></Card>;
}

function AnalyticsView({ analytics }: { analytics: AnalyticsData | null }) {
  return <div className="space-y-6"><Metrics analytics={analytics} /><VisitorsChart analytics={analytics} /><div className="grid gap-6 xl:grid-cols-2"><Card title="Pages">{analytics?.pages.length ? <Table headers={["Page", "Views", "Avg. time", "Scroll"]} rows={analytics.pages.slice(0, 12).map((row) => [<span key={String(row.page_path)} title={String(row.page_path)}>{String(row.page_path)}</span>, number(row, "views"), `${number(row, "avg_seconds", "—")}s`, `${number(row, "avg_scroll_percent", "—")}%`])} /> : <Empty />}</Card><Card title="World map"><div className="relative min-h-64 overflow-hidden rounded-2xl bg-[#f5f5f5]" style={{ backgroundImage: "radial-gradient(circle at 20% 42%, #444 0 2px, transparent 3px), radial-gradient(circle at 47% 35%, #999 0 3px, transparent 4px), radial-gradient(circle at 71% 49%, #555 0 2px, transparent 3px), linear-gradient(145deg, transparent 25%, #ddd 26% 40%, transparent 41% 48%, #ddd 49% 68%, transparent 69%)" }}><span className="absolute bottom-3 left-3 text-[11px] text-[#666]">Visitors by country</span></div></Card></div><div className="grid gap-6 xl:grid-cols-2"><Card title="Flow">{analytics?.flow.length ? <Table headers={["From", "To", "Moves", "Time"]} rows={analytics.flow.slice(0, 10).map((row) => [String(row.from_path), String(row.next_page || "(none)"), number(row, "moves"), `${number(row, "avg_seconds_before_leaving", "—")}s`])} /> : <Empty />}</Card><Card title="Acquisition">{analytics?.acquisition.length ? <Table headers={["Source / medium", "Campaign", "Visitors", "Conv."]} rows={analytics.acquisition.slice(0, 10).map((row) => [`${String(row.source)} / ${String(row.medium)}`, String(row.campaign), number(row, "visitors"), number(row, "conversions")])} /> : <Empty />}</Card></div><Card title="Conversions">{analytics?.conversions.length ? <Table headers={["Event", "Page", "Source", "Campaign"]} rows={analytics.conversions.slice(0, 12).map((row) => [String(row.conversion), String(row.page_path), String(row.source), String(row.campaign)])} /> : <Empty>No conversions recorded yet.</Empty>}</Card></div>;
}

function WeeklyTraffic({ analytics }: { analytics: AnalyticsData | null }) {
  const rows = (analytics?.daily || []).slice(0, 7).reverse();
  return <Card title="Weekly traffic"><div className="grid grid-cols-7 gap-2">{["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => <div key={day} className="text-center text-[10px] uppercase tracking-[.1em] text-[#777]">{day}</div>)}{Array.from({ length: 7 }, (_, index) => { const count = Number(rows[index]?.visitors || 0); return <div key={index} className="flex h-24 flex-col items-center justify-end gap-2 rounded-xl border border-[#ededed] p-2"><div className="w-full bg-[#555]" style={{ height: `${Math.max(5, Math.min(100, count * 12))}%` }} /><span className="text-[10px] text-[#777]">{count}</span></div>; })}</div></Card>;
}

function Overview({ analytics, records, jobs }: Pick<Props, "analytics" | "records" | "jobs">) {
  return <div className="space-y-6"><header><p className="text-[10px] uppercase tracking-[.16em] text-[#777]">Workspace</p><h1 className="mt-2 font-serif text-4xl italic tracking-[-.03em] text-[#111]">Good morning, Mattia.</h1><p className="mt-2 text-sm text-[#666]">The site, without the noise.</p></header><Metrics analytics={analytics} /><div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]"><VisitorsChart analytics={analytics} /><Card title="Active users"><div className="flex min-h-40 flex-col items-center justify-center"><p className="text-5xl text-[#111]">{number(analytics?.daily[0], "visitors")}</p><p className="mt-2 text-sm text-[#777]">in the selected period</p></div></Card></div><WeeklyTraffic analytics={analytics} /><div className="grid gap-6 md:grid-cols-3"><Card title="Feedback"><p className="text-3xl text-[#111]">{records.length}</p><p className="mt-2 text-sm text-[#777]">waiting for review</p></Card><Card title="Job offers"><p className="text-3xl text-[#111]">{jobs.filter((job) => job.status === "open").length}</p><p className="mt-2 text-sm text-[#777]">currently open</p></Card><Card title="Conversions"><p className="text-3xl text-[#111]">{analytics?.conversions.length || 0}</p><p className="mt-2 text-sm text-[#777]">newsletter and feedback</p></Card></div></div>;
}

function FeedbackView({ records, loading, onCreateTest, onModerate }: Pick<Props, "records" | "loading" | "onCreateTest" | "onModerate">) {
  return <div className="space-y-6"><header className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-[10px] uppercase tracking-[.16em] text-[#777]">Community</p><h1 className="mt-2 font-serif text-4xl italic text-[#111]">Feedback</h1><p className="mt-2 text-sm text-[#666]">Review, publish, or reject submissions.</p></div><button type="button" onClick={onCreateTest} disabled={loading} className="border border-[#222] px-4 py-2.5 text-sm text-[#111] hover:bg-[#111] hover:text-white disabled:opacity-50">Send test feedback</button></header>{records.length ? records.map((record) => <article key={record.id} className="admin-card rounded-[20px] border border-[#e5e5e3] bg-white p-5 sm:p-6"><div className="flex flex-wrap justify-between gap-3 text-xs text-[#777]"><span className="text-[#222]">{record.name || "Anonymous"}{record.email ? ` · ${record.email}` : ""}</span><time>{new Date(record.submitted_at).toLocaleString()}</time></div><p className="mt-5 max-w-3xl whitespace-pre-wrap text-sm leading-6 text-[#333]">{record.message}</p><div className="mt-5 flex flex-wrap gap-4 text-xs"><button type="button" onClick={() => onModerate(record.id, "publish")} disabled={loading} className="border-b border-[#111] pb-1 text-[#111] disabled:opacity-50">Publish</button><button type="button" onClick={() => onModerate(record.id, "reject")} disabled={loading} className="border-b border-[#aaa] pb-1 text-[#666] disabled:opacity-50">Reject</button><span className="text-[#888]">{record.page_url}</span></div></article>) : <div className="admin-card rounded-[20px] border border-[#e5e5e3] bg-white"><Empty>The feedback queue is empty.</Empty></div>}</div>;
}

function JobsView({ jobs: initialJobs, loading, onSaveJobs }: Pick<Props, "jobs" | "loading" | "onSaveJobs">) {
  const [jobs, setJobs] = useState(initialJobs);
  const [selected, setSelected] = useState(0);
  const current = jobs[selected];
  function update(key: keyof AdminJob, input: string | CareerQuestion[]) { setJobs((items) => items.map((job, index) => index === selected ? { ...job, [key]: input } : job)); }
  function addJob() { const next: AdminJob = { slug: `new-role-${jobs.length + 1}`, title: "New role", department: "Engineering", location: "Remote", type: "Full-time", compensation: "", status: "coming-soon", shortPitch: "", description: "", questions: [] }; setJobs((items) => [...items, next]); setSelected(jobs.length); }
  function addQuestion() { update("questions", [...(current.questions || []), { id: `question-${Date.now()}`, label: "New question", type: "textarea", required: true, minimum: 0 }]); }
  function updateQuestion(index: number, key: keyof CareerQuestion, value: string | boolean) { const questions = [...(current.questions || [])]; questions[index] = { ...questions[index], [key]: key === "minimum" ? Math.max(0, Number(value) || 0) : value } as CareerQuestion; update("questions", questions); }
  return <div className="space-y-6"><header className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-[10px] uppercase tracking-[.16em] text-[#777]">Content</p><h1 className="mt-2 font-serif text-4xl italic text-[#111]">Job offers</h1><p className="mt-2 text-sm text-[#666]">Create and manage the public careers pipeline.</p></div><div className="flex gap-4"><button type="button" onClick={addJob} className="border-b border-[#aaa] px-1 py-2 text-sm text-[#555]">Add offer</button><button type="button" onClick={() => onSaveJobs(jobs)} disabled={loading} className="border-b border-[#111] px-1 py-2 text-sm text-[#111] disabled:opacity-50">Save changes</button></div></header><div className="grid gap-6 lg:grid-cols-[230px_1fr]"><Card title="Offers"><div className="divide-y divide-[#ededed]">{jobs.map((job, index) => <button type="button" key={`${job.slug}-${index}`} onClick={() => setSelected(index)} className={`w-full px-1 py-3 text-left text-sm ${selected === index ? "font-medium text-[#111]" : "text-[#777]"}`}><span className="block truncate">{job.title}</span><span className="mt-1 block text-[11px] text-[#999]">{job.status}</span></button>)}</div></Card>{current ? <Card title="Offer details"><div className="grid gap-4 sm:grid-cols-2">{(["title", "slug", "department", "location", "type", "compensation"] as const).map((key) => <label key={key} className="block"><span className="mb-1.5 block text-xs text-[#777]">{key}</span><input value={current[key]} onChange={(event) => update(key, event.target.value)} className="admin-form-control w-full rounded-full border border-[#bbb] bg-transparent px-4 py-2.5 text-sm text-[#111] outline-none focus:border-[#111]" /></label>)}<label className="block"><span className="mb-1.5 block text-xs text-[#777]">status</span><CustomDropdown value={current.status} onChange={(value) => update("status", value)} label="Offer status" options={[{ value: "open", label: "Open" }, { value: "coming-soon", label: "Coming soon" }, { value: "closed", label: "Closed" }]} /></label><label className="block sm:col-span-2"><span className="mb-1.5 block text-xs text-[#777]">short pitch</span><input value={current.shortPitch} onChange={(event) => update("shortPitch", event.target.value)} className="admin-form-control w-full rounded-full border border-[#bbb] bg-transparent px-4 py-2.5 text-sm text-[#111] outline-none focus:border-[#111]" /></label><label className="block sm:col-span-2"><span className="mb-1.5 block text-xs text-[#777]">description</span><textarea rows={8} value={current.description} onChange={(event) => update("description", event.target.value)} className="admin-form-control min-h-32 w-full resize-y rounded-2xl border border-[#bbb] bg-transparent px-4 py-3 text-sm text-[#111] outline-none focus:border-[#111]" /></label><div className="sm:col-span-2"><div className="mb-3 flex items-center justify-between"><span className="text-xs text-[#777]">custom questions</span><button type="button" onClick={addQuestion} className="border-b border-[#111] text-xs text-[#111]">Add question</button></div><div className="space-y-3">{(current.questions || []).map((question, index) => <div key={question.id} className="grid gap-2 rounded-2xl border border-[#ededed] p-3 sm:grid-cols-[1fr_120px_80px_70px]"><input value={question.label} onChange={(event) => updateQuestion(index, "label", event.target.value)} placeholder="Question" className="admin-form-control rounded-full border border-[#bbb] px-3 py-2 text-sm outline-none" /><CustomDropdown value={question.type} onChange={(value) => updateQuestion(index, "type", value)} label="Answer type" options={[{ value: "text", label: "Short text" }, { value: "textarea", label: "Long text" }, { value: "url", label: "URL" }]} /><input type="number" min={0} value={question.minimum} onChange={(event) => updateQuestion(index, "minimum", event.target.value)} aria-label="Minimum characters" className="admin-form-control rounded-full border border-[#bbb] px-3 py-2 text-sm outline-none" /><label className="flex items-center gap-2 text-xs text-[#555]"><input type="checkbox" checked={question.required} onChange={(event) => updateQuestion(index, "required", event.target.checked)} />Required</label></div>)}</div></div></div></Card> : <Empty>Add your first offer.</Empty>}</div></div>;
}

function SettingsView() {
  const [saved, setSaved] = useState(false);
  return <div className="space-y-6"><header><p className="text-[10px] uppercase tracking-[.16em] text-[#777]">Workspace</p><h1 className="mt-2 font-serif text-4xl italic text-[#111]">Settings</h1><p className="mt-2 text-sm text-[#666]">The controls that should not be hidden in code.</p></header><div className="grid gap-6 lg:grid-cols-2"><Card title="Site configuration"><div className="space-y-5"><label className="block"><span className="mb-1.5 block text-xs text-[#777]">Default language</span><CustomDropdown value="en" onChange={() => undefined} label="Default language" options={[{ value: "en", label: "English" }, { value: "it", label: "Italiano" }]} /></label><label className="flex items-center justify-between gap-4 border-b border-[#ededed] py-3"><span className="text-sm text-[#333]">Accept new feedback</span><input type="checkbox" defaultChecked className="h-4 w-4 accent-black" /></label><label className="flex items-center justify-between gap-4 border-b border-[#ededed] py-3"><span className="text-sm text-[#333]">Show coming-soon roles</span><input type="checkbox" defaultChecked className="h-4 w-4 accent-black" /></label><button type="button" onClick={() => setSaved(true)} className="border-b border-[#111] py-2 text-sm text-[#111]">{saved ? "Saved" : "Save settings"}</button></div></Card><Card title="Analytics"><div className="space-y-4 text-sm text-[#555]"><p className="leading-6">Anonymous first-party aggregates are active. GA4 remains consent-gated. No IP address or user agent is exposed here.</p><div className="flex justify-between border-t border-[#ededed] pt-3"><span>Umami</span><span>Connected</span></div><div className="flex justify-between border-t border-[#ededed] pt-3"><span>Supabase views</span><span>Server-only</span></div></div></Card></div></div>;
}

export function AdminWorkspace(props: Props) {
  const [tab, setTab] = useState<Tab>("overview");
  const pending = useMemo(() => props.records.length, [props.records.length]);
  return <main id="admin-feedback-page" className="min-h-[100dvh] bg-[#f4f4f2] p-3 font-sans text-[#111] sm:p-4 lg:p-5"><aside className="fixed inset-y-5 left-5 z-20 hidden w-60 flex-col rounded-[24px] border border-[#e5e5e3] bg-white px-5 py-6 shadow-[0_10px_30px_rgba(0,0,0,0.04)] lg:flex"><div className="flex items-center gap-2.5"><span aria-hidden="true" className="admin-logo-black h-6 w-6" /><span className="text-sm font-medium tracking-[-.01em]">Mattia Ciuni</span></div><nav aria-label="Admin" className="mt-12 space-y-1">{tabs.map((item) => <button key={item.id} type="button" onClick={() => setTab(item.id)} className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm transition-colors ${tab === item.id ? "bg-[#f1f1ef] font-medium text-[#111]" : "text-[#777] hover:bg-[#f7f7f5] hover:text-[#111]"}`}><span>{item.label}</span>{item.id === "feedback" && pending ? <span className="text-xs text-[#777]">{pending}</span> : null}</button>)}</nav><div className="mt-auto border-t border-[#ededeb] pt-4"><p className="text-xs text-[#777]">{props.identity?.name}</p>{!props.localMode ? <button type="button" onClick={props.onLogout} className="mt-4 rounded-full border border-[#e5e5e3] px-3 py-1.5 text-xs text-[#666] hover:border-[#111] hover:text-[#111]">Log out</button> : null}</div></aside><div className="min-h-[calc(100dvh-2.5rem)] rounded-[24px] border border-[#e5e5e3] bg-[#fafaf9] lg:ml-[260px]"><header className="flex min-h-14 items-center justify-between border-b border-[#ededeb] px-5 sm:px-8 lg:px-10"><div className="flex items-center gap-2.5"><span aria-hidden="true" className="admin-logo-black h-6 w-6" /><span className="text-sm font-medium">Mattia Ciuni</span></div>{!props.localMode ? <button type="button" onClick={props.onLogout} className="rounded-full border border-[#e5e5e3] px-3 py-1.5 text-xs text-[#666] hover:border-[#111] hover:text-[#111] lg:hidden">Log out</button> : null}</header><div className="border-b border-[#ededeb] px-5 py-3 lg:hidden"><nav aria-label="Admin mobile" className="flex gap-2 overflow-x-auto text-sm">{tabs.map((item) => <button key={item.id} type="button" onClick={() => setTab(item.id)} className={`shrink-0 rounded-full px-3 py-1.5 ${tab === item.id ? "bg-[#111] text-white" : "text-[#777] hover:bg-[#f1f1ef]"}`}>{item.label}</button>)}</nav></div><div className="mx-auto max-w-[1380px] p-5 sm:p-8 lg:p-12">{props.error ? <p role="alert" className="mb-6 rounded-2xl border border-[#e5e5e3] bg-white px-4 py-3 text-sm text-[#333]">{props.error}</p> : null}{tab === "overview" ? <Overview analytics={props.analytics} records={props.records} jobs={props.jobs} /> : null}{tab === "analytics" ? <div className="space-y-6"><header><p className="text-[10px] uppercase tracking-[.16em] text-[#777]">Measurement</p><h1 className="mt-2 font-serif text-4xl italic text-[#111]">Analytics</h1><p className="mt-2 text-sm text-[#666]">Visitors, flow, acquisition, and conversions.</p></header><AnalyticsView analytics={props.analytics} /></div> : null}{tab === "feedback" ? <FeedbackView records={props.records} loading={props.loading} onCreateTest={props.onCreateTest} onModerate={props.onModerate} /> : null}{tab === "jobs" ? <JobsView jobs={props.jobs} loading={props.loading} onSaveJobs={props.onSaveJobs} /> : null}{tab === "settings" ? <SettingsView /> : null}</div></div></main>;
}
