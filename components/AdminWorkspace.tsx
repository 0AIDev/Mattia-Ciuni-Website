"use client";

import { useCallback, useMemo, useState, type ComponentType } from "react";
import { AdminContentEditor } from "@/components/AdminContentEditor";
import { DeployStatusLine } from "@/components/AdminDeployStatus";
import { AdminMediaLibrary } from "@/components/AdminMediaLibrary";
import { AdminSeoView } from "@/components/AdminSeoView";
import {
  BriefcaseIcon,
  ChartIcon,
  FileIcon,
  HomeIcon,
  ImageIcon,
  InboxIcon,
  LogOutIcon,
  MenuIcon,
  RefreshIcon,
  SearchIcon,
  SlidersIcon,
  TypeIcon,
  XIcon,
} from "@/components/admin/icons";
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
import { IconButton, Notice } from "@/components/admin/ui";
import type { AdminContentItem, CmsKind } from "@/lib/cms-types";

/**
 * Il guscio del pannello: navigazione e basta.
 *
 * Nove sezioni, una barra laterale fissa, un blocco centrale che scorre. Il
 * motivo e' che il lavoro reale e' sempre lo stesso e cambia contesto, non
 * schermata: passare da "l'articolo" a "le sue keyword" o "la sua immagine" non
 * dovrebbe costringere a uscire da una sezione e rientrare in un'altra.
 *
 * La barra non scorre con il contenuto: le sezioni sono nove e restano nove, il
 * contenuto di una sezione puo' essere lungo quanto vuole. Se scorressero
 * insieme, per cambiare sezione si tornerebbe in cima ogni volta.
 *
 * `focusContent` e' il pezzo che rende vero il primo ragionamento: la sezione
 * SEO puo' chiedere che un item venga aperto nell'editor, e l'editor si trova
 * nella sezione dei contenuti, non dentro quella che lo ha invocato.
 */

type Tab = "overview" | "content" | "site" | "media" | "seo" | "careers" | "inbox" | "analytics" | "settings";

type NavItem = { id: Tab; label: string; icon: ComponentType<{ className?: string }> };

const groups: Array<{ label: string; items: NavItem[] }> = [
  {
    label: "Site",
    items: [
      { id: "overview", label: "Overview", icon: HomeIcon },
      { id: "inbox", label: "Inbox", icon: InboxIcon },
      { id: "analytics", label: "Analytics", icon: ChartIcon },
    ],
  },
  {
    label: "Content",
    items: [
      { id: "content", label: "Content", icon: FileIcon },
      { id: "site", label: "Site copy", icon: TypeIcon },
      { id: "media", label: "Media", icon: ImageIcon },
      { id: "seo", label: "SEO", icon: SearchIcon },
    ],
  },
  {
    label: "Hiring",
    items: [{ id: "careers", label: "Careers", icon: BriefcaseIcon }],
  },
  {
    label: "Workspace",
    items: [{ id: "settings", label: "Settings", icon: SlidersIcon }],
  },
];

const titles: Record<Tab, string> = Object.fromEntries(
  groups.flatMap((group) => group.items.map((item) => [item.id, item.label])),
) as Record<Tab, string>;

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
  onRefresh: () => void;
  onLogout: () => void;
  onCreateTest: () => void;
  onModerate: (id: string, action: "publish" | "reject") => void;
  onSaveJobs: (jobs: AdminJob[]) => void;
  onSaveContent: (item: AdminContentItem) => Promise<AdminContentItem | null>;
  onPublishContent: (id: string) => Promise<boolean>;
  onRestoreContent: (kind: CmsKind, slug: string) => Promise<AdminContentItem | null>;
  onCreateNda: (fullName: string, email: string) => Promise<string | null>;
  /** L'istante dell'ultimo publish, finche' il deploy non e' arrivato online. */
  pendingSince?: string | null;
  onDeployLive?: () => void;
  onRebuildSite?: () => Promise<void>;
};

export function AdminWorkspace(props: Props) {
  const [tab, setTab] = useState<Tab>("overview");
  const [navOpen, setNavOpen] = useState(false);
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

  function openSection(id: Tab) {
    setTab(id);
    setNavOpen(false);
  }

  function openInEditor(item: AdminContentItem) {
    setFocus(item);
    setTab("content");
  }

  const config = props.config;
  const offline = config ? [!config.github, !config.deploy_hook, !config.supabase, config.tables === false, !config.storage].filter(Boolean).length : 0;

  return (
    <main id="admin-feedback-page" className="flex h-[100dvh] overflow-hidden bg-admin-bg font-sans text-admin-ink">
      {navOpen ? <div className="fixed inset-0 z-20 bg-black/15 md:hidden" onClick={() => setNavOpen(false)} aria-hidden="true" /> : null}

      <aside
        className={`${navOpen ? "flex" : "hidden"} fixed inset-y-0 left-0 z-30 w-[236px] shrink-0 flex-col border-r border-admin-line bg-admin-bg px-2 py-3 md:static md:flex md:border-r-0`}
      >
        <div className="flex items-center gap-2 px-1.5">
          <span aria-hidden="true" className="admin-logo-black h-4 w-4" />
          <span className="min-w-0 flex-1 truncate text-[13px] font-medium text-admin-ink">Mattia Ciuni</span>
          <span className="md:hidden">
            <IconButton title="Close navigation" onClick={() => setNavOpen(false)}>
              <XIcon />
            </IconButton>
          </span>
        </div>

        <nav aria-label="Admin" className="mt-4 min-h-0 flex-1 overflow-y-auto">
          {groups.map((group) => (
            <div key={group.label} className="mb-1">
              <p className="px-1.5 py-2 text-[11px] text-admin-faint">{group.label}</p>
              {group.items.map((item) => {
                const Icon = item.icon;
                const badge = badges(item.id);
                const active = tab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => openSection(item.id)}
                    aria-current={active ? "page" : undefined}
                    className={`mb-0.5 flex h-7 w-full items-center gap-2 rounded-md px-1.5 text-left text-[13px] transition-colors ${active ? "bg-admin-active text-admin-ink" : "text-admin-muted hover:bg-admin-soft hover:text-admin-ink"}`}
                  >
                    <Icon className={`h-4 w-4 shrink-0 ${active ? "text-admin-muted" : "text-admin-faint"}`} />
                    <span className="min-w-0 flex-1 truncate">{item.label}</span>
                    {badge ? <span className="admin-tabular shrink-0 text-[11px] text-admin-faint">{badge}</span> : null}
                  </button>
                );
              })}
            </div>
          ))}
        </nav>

        <DeployStatusLine pendingSince={props.pendingSince} onLive={props.onDeployLive} className="mt-2 px-1.5 pt-3" />

        <div className="mt-2 flex items-center gap-2 border-t border-admin-line px-1.5 pt-3">
          <span aria-hidden="true" className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-admin-active text-[11px] text-admin-muted">
            {(props.identity?.name || "M").slice(0, 1).toUpperCase()}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[12px] text-admin-ink">{props.identity?.name || "Not signed in"}</span>
            <span className="block truncate text-[11px] text-admin-faint">{props.identity?.title || props.identity?.role || "Admin"}</span>
          </span>
          <IconButton title="Log out" onClick={props.onLogout}>
            <LogOutIcon />
          </IconButton>
        </div>
      </aside>

      <div className="flex min-h-0 min-w-0 flex-1 p-2 md:pl-0">
        <section className="flex min-h-0 w-full flex-col overflow-hidden rounded-lg border border-admin-line bg-admin-panel">
          <header className="flex h-11 shrink-0 items-center justify-between gap-3 border-b border-admin-line px-3">
            <div className="flex min-w-0 items-center gap-2">
              <span className="md:hidden">
                <IconButton title="Open navigation" onClick={() => setNavOpen(true)}>
                  <MenuIcon />
                </IconButton>
              </span>
              <span className="hidden truncate text-[13px] text-admin-muted sm:block">Mattia Ciuni</span>
              <span aria-hidden="true" className="hidden text-[13px] text-admin-line sm:block">/</span>
              <span className="truncate text-[13px] font-medium text-admin-ink">{titles[tab]}</span>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              {offline && tab !== "settings" ? (
                <button type="button" onClick={() => openSection("settings")} className="hidden text-[12px] text-admin-faint transition-colors hover:text-admin-ink sm:block">
                  {offline} not configured
                </button>
              ) : null}
              {props.loading ? <span className="text-[12px] text-admin-faint">Loading</span> : null}
              {props.pendingSince ? <span className="text-[12px] text-admin-muted">Deploying</span> : null}
              <IconButton title="Reload data" onClick={props.onRefresh} disabled={props.loading}>
                <RefreshIcon />
              </IconButton>
            </div>
          </header>

          <div className="min-h-0 flex-1 overflow-y-auto">
            <div className="mx-auto w-full max-w-[1160px] px-4 py-5 sm:px-6 sm:py-6">
              {props.error ? <div className="mb-5"><Notice tone="bad">{props.error}</Notice></div> : null}

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
                  pendingSince={props.pendingSince}
                  onDeployLive={props.onDeployLive}
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
                  pendingSince={props.pendingSince}
                  onDeployLive={props.onDeployLive}
                />
              ) : null}
              {tab === "media" ? <AdminMediaLibrary onError={reportError} /> : null}
              {tab === "seo" ? <AdminSeoView items={props.content} loading={props.loading} onEdit={openInEditor} onSave={props.onSaveContent} /> : null}
              {tab === "careers" ? <JobsView jobs={props.jobs} loading={props.loading} onSaveJobs={props.onSaveJobs} pendingSince={props.pendingSince} /> : null}
              {tab === "inbox" ? (
                <div className="space-y-6">
                  <ApplicantsView applicants={props.applicants} jobs={props.jobs} loading={props.loading} />
                  <FeedbackView records={props.records} loading={props.loading} onCreateTest={props.onCreateTest} onModerate={props.onModerate} />
                </div>
              ) : null}
              {tab === "analytics" ? <AnalyticsView analytics={props.analytics} /> : null}
              {tab === "settings" ? <SettingsView onCreateNda={props.onCreateNda} config={props.config} onPublishContent={props.onPublishContent} publishing={props.loading} onRebuildSite={props.onRebuildSite ?? (async () => {})} rebuilding={props.loading} pendingSince={props.pendingSince} /> : null}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
