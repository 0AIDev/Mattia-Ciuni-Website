"use client";

import { useCallback, useMemo, useState } from "react";
import { AdminContentEditor } from "@/components/AdminContentEditor";
import { AdminMediaLibrary } from "@/components/AdminMediaLibrary";
import { AdminSeoView } from "@/components/AdminSeoView";
import {
  AnalyticsView,
  ApplicantsView,
  FeedbackView,
  JobsView,
  Overview,
  SettingsView,
  type AdminJob,
  type AnalyticsData,
  type ApplicantRecord,
  type ConfigStatus,
  type FeedbackRecord,
} from "@/components/AdminSections";
import { Notice } from "@/components/admin/ui";
import type { AdminContentItem, CmsKind } from "@/lib/cms-types";

/**
 * Il guscio del pannello: navigazione e basta.
 *
 * Otto sezioni, una barra laterale, nessuna sottopagina. Il motivo e' che il
 * lavoro reale e' sempre lo stesso, e cambia contesto, non schermata: passare da
 * "l'articolo" a "le sue keyword" o "la sua immagine" non dovrebbe costringere a
 * uscire da una sezione e rientrare in un'altra.
 *
 * `focusContent` e' il pezzo che rende vero quel ragionamento: la sezione SEO puo'
 * chiedere che un item venga aperto nell'editor, e l'editor si trova a sinistra
 * della navigazione, non dentro la sezione che lo ha invocato.
 */

type Tab = "overview" | "content" | "site" | "media" | "seo" | "careers" | "inbox" | "analytics" | "settings";

const tabs: Array<{ id: Tab; label: string; short: string }> = [
  { id: "overview", label: "Overview", short: "Home" },
  { id: "content", label: "Content", short: "Content" },
  { id: "site", label: "Site copy", short: "Copy" },
  { id: "media", label: "Media", short: "Media" },
  { id: "seo", label: "SEO", short: "SEO" },
  { id: "careers", label: "Careers", short: "Careers" },
  { id: "inbox", label: "Inbox", short: "Inbox" },
  { id: "analytics", label: "Analytics", short: "Analytics" },
  { id: "settings", label: "Settings", short: "Settings" },
];

type Props = {
  records: FeedbackRecord[];
  analytics: AnalyticsData | null;
  jobs: AdminJob[];
  applicants: ApplicantRecord[];
  content: AdminContentItem[];
  config: ConfigStatus | null;
  identity: { name: string; role: string; title: string } | null;
  loading: boolean;
  error: string;
  onLogout: () => void;
  onCreateTest: () => void;
  onModerate: (id: string, action: "publish" | "reject") => void;
  onSaveJobs: (jobs: AdminJob[]) => void;
  onSaveContent: (item: AdminContentItem) => Promise<AdminContentItem | null>;
  onPublishContent: (id: string) => Promise<boolean>;
  onRestoreContent: (kind: CmsKind, slug: string) => Promise<boolean>;
  onCreateNda: (fullName: string, email: string) => Promise<string | null>;
};

export function AdminWorkspace(props: Props) {
  const [tab, setTab] = useState<Tab>("overview");
  const [focus, setFocus] = useState<AdminContentItem | null>(null);
  const [error, setError] = useState("");

  const reportError = useCallback((message: string) => setError(message), []);

  const pending = props.records.length;
  const applicantCount = props.applicants.length;
  const draftCount = useMemo(() => props.content.filter((item) => item.status === "draft").length, [props.content]);

  function badges(id: Tab) {
    if (id === "inbox" && pending) return pending;
    if (id === "careers" && applicantCount) return applicantCount;
    if (id === "content" && draftCount) return draftCount;
    return null;
  }

  function openInEditor(item: AdminContentItem) {
    setFocus(item);
    setTab("content");
  }

  return (
    <main id="admin-feedback-page" className="min-h-[100dvh] bg-[#f4f4f2] p-3 font-sans text-[#111] sm:p-4 lg:p-5">
      <aside className="fixed inset-y-5 left-5 z-20 hidden w-60 flex-col rounded-[24px] border border-[#e5e5e3] bg-white px-5 py-6 shadow-[0_10px_30px_rgba(0,0,0,0.04)] lg:flex">
        <div className="flex items-center gap-2.5">
          <span aria-hidden="true" className="admin-logo-black h-6 w-6" />
          <span className="text-sm font-medium tracking-[-.01em]">Mattia Ciuni</span>
        </div>
        <nav aria-label="Admin" className="mt-12 space-y-1">
          {tabs.map((item) => {
            const badge = badges(item.id);
            return (
              <button key={item.id} type="button" onClick={() => setTab(item.id)} aria-current={tab === item.id ? "page" : undefined} className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm transition-colors ${tab === item.id ? "bg-[#f1f1ef] font-medium text-[#111]" : "text-[#777] hover:bg-[#f7f7f5] hover:text-[#111]"}`}>
                <span>{item.label}</span>
                {badge ? <span className="text-xs text-[#999]">{badge}</span> : null}
              </button>
            );
          })}
        </nav>
        <div className="mt-auto border-t border-[#ededeb] pt-4">
          <p className="text-xs text-[#777]">{props.identity?.name}</p>
          <button type="button" onClick={props.onLogout} className="mt-4 rounded-full border border-[#e5e5e3] px-3 py-1.5 text-xs text-[#666] hover:border-[#111] hover:text-[#111]">Log out</button>
        </div>
      </aside>

      <div className="min-h-[calc(100dvh-2.5rem)] rounded-[24px] border border-[#e5e5e3] bg-[#fafaf9] lg:ml-[260px]">
        <header className="flex min-h-14 items-center justify-between border-b border-[#ededeb] px-5 sm:px-8 lg:px-10">
          <div className="flex items-center gap-2.5">
            <span aria-hidden="true" className="admin-logo-black h-6 w-6" />
            <span className="text-sm font-medium">Mattia Ciuni</span>
          </div>
          <button type="button" onClick={props.onLogout} className="rounded-full border border-[#e5e5e3] px-3 py-1.5 text-xs text-[#666] hover:border-[#111] hover:text-[#111] lg:hidden">Log out</button>
        </header>

        <div className="border-b border-[#ededeb] px-5 py-3 lg:hidden">
          <nav aria-label="Admin mobile" className="flex gap-2 overflow-x-auto text-sm">
            {tabs.map((item) => (
              <button key={item.id} type="button" onClick={() => setTab(item.id)} className={`shrink-0 rounded-full px-3 py-1.5 ${tab === item.id ? "bg-[#111] text-white" : "text-[#777] hover:bg-[#f1f1ef]"}`}>
                {item.short}
              </button>
            ))}
          </nav>
        </div>

        <div className="mx-auto max-w-[1380px] p-5 sm:p-8 lg:p-12">
          {props.error ? <div className="mb-6"><Notice tone="bad">{props.error}</Notice></div> : null}

          {tab === "overview" ? <Overview analytics={props.analytics} records={props.records} jobs={props.jobs} applicants={props.applicants} items={props.content} /> : null}
          {tab === "content" ? (
            <AdminContentEditor
              items={props.content}
              loading={props.loading}
              focus={focus}
              onFocusHandled={() => setFocus(null)}
              onSave={props.onSaveContent}
              onPublish={props.onPublishContent}
              onRestore={props.onRestoreContent}
            />
          ) : null}
          {tab === "site" ? (
            <AdminContentEditor
              items={props.content.filter((item) => item.kind === "site_copy" || item.kind === "settings" || item.kind === "taxonomy")}
              loading={props.loading}
              focus={focus}
              onFocusHandled={() => setFocus(null)}
              onSave={props.onSaveContent}
              onPublish={props.onPublishContent}
              onRestore={props.onRestoreContent}
            />
          ) : null}
          {tab === "media" ? <AdminMediaLibrary onError={reportError} /> : null}
          {tab === "seo" ? <AdminSeoView items={props.content} loading={props.loading} onEdit={openInEditor} onSave={props.onSaveContent} /> : null}
          {tab === "careers" ? <JobsView jobs={props.jobs} loading={props.loading} onSaveJobs={props.onSaveJobs} /> : null}
          {tab === "inbox" ? (
            <div className="space-y-6">
              <ApplicantsView applicants={props.applicants} jobs={props.jobs} loading={props.loading} />
              <FeedbackView records={props.records} loading={props.loading} onCreateTest={props.onCreateTest} onModerate={props.onModerate} />
            </div>
          ) : null}
          {tab === "analytics" ? <AnalyticsView analytics={props.analytics} /> : null}
          {tab === "settings" ? <SettingsView onCreateNda={props.onCreateNda} config={props.config} onPublishContent={props.onPublishContent} publishing={props.loading} /> : null}
        </div>
      </div>
    </main>
  );
}
