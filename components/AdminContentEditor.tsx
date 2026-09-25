"use client";

import { useEffect, useMemo, useState } from "react";
import type { AdminContentItem, CmsKind, CmsStatus } from "@/lib/cms-types";
import { CMS_KINDS } from "@/lib/cms-types";
import { Button, Card, Field, Notice, Pill, SectionHeader, TextArea, TextInput, Select } from "@/components/admin/ui";

/**
 * L'editor di contenuti.
 *
 * Un solo editor per tutti i kind, con i campi che cambiano in base al kind
 * scelto. La alternativa, un form per tipo, sarebbe andata alla deriva: il
 * giorno in cui l'editor dei redirect accetta una riga in piu' e quello delle
 * pagine no, i due smettono di somigliare e il pannello torna a essere
 * illeggibile.
 *
 * I campi non sono "tutti i campi possibili" ma quelli che il registry e il
 * renderer di quel kind leggono davvero: un campo che nessuno legge e' una
 * promessa che il pannello non puo' mantenere.
 */

const KIND_LABELS: Record<CmsKind, string> = {
  post: "Article",
  note: "Note",
  feedback: "Feedback",
  page: "Page",
  site_copy: "Site copy",
  job: "Job offer",
  voice_note: "Voice note",
  video: "Video",
  redirect: "Redirect",
  taxonomy: "Taxonomy",
  media_meta: "Media metadata",
  settings: "Site settings",
};

const KIND_HINTS: Partial<Record<CmsKind, string>> = {
  page: "Published pages get a real route at /<lang>/p/<slug>/ for each language listed in Locales. English only if the list is empty.",
  voice_note: "Audio src is the /media/ path from the Media tab. The page lists the notes by date.",
  video: "Video src is the /media/ path from the Media tab.",
  redirect: "Cloudflare Pages reads these from _redirects. Past 100 rules the extra ones are ignored without any warning.",
  site_copy: "A language copy override, for example en, careers-en or ui-en.",
  settings: "Site identity, contact and social profiles. An empty field falls back to the value in code.",
  taxonomy: "A named list of terms, used to keep categories and tags consistent across content.",
};

const LOCALES = ["en", "it", "fr", "es", "de"] as const;

function newItem(kind: CmsKind = "post"): AdminContentItem {
  return {
    id: crypto.randomUUID(),
    kind,
    slug: kind === "settings" ? "site" : `new-${kind}`,
    status: "draft",
    title: "",
    description: "",
    body_markdown: "",
    data: { category: "", tags: [], keywords: [] },
    version: 0,
  };
}

function keywordsOf(data: AdminContentItem["data"]): string {
  return Array.isArray(data.keywords) ? data.keywords.join(", ") : "";
}

function tagsOf(data: AdminContentItem["data"]): string {
  return Array.isArray(data.tags) ? data.tags.join(", ") : "";
}

function dataTextOf(data: AdminContentItem["data"]): string {
  const { content: _content, ...editable } = data;
  return JSON.stringify(editable, null, 2);
}

export function AdminContentEditor({
  items,
  loading,
  focus,
  onFocusHandled,
  onSave,
  onPublish,
  onRestore,
}: {
  items: AdminContentItem[];
  loading: boolean;
  /** Item da aprire subito, usato quando un'altra sezione rimanda all'editor. */
  focus?: AdminContentItem | null;
  onFocusHandled?: () => void;
  onSave: (item: AdminContentItem) => Promise<AdminContentItem | null>;
  onPublish: (id: string) => Promise<boolean>;
  onRestore?: (kind: CmsKind, slug: string) => Promise<boolean>;
}) {
  const [filter, setFilter] = useState<CmsKind | "all">("all");
  const [selectedId, setSelectedId] = useState<string>("");
  const focusId = focus?.id;
  const [draft, setDraft] = useState<AdminContentItem>(() => newItem());
  const [dataText, setDataText] = useState("{}");
  const [dataError, setDataError] = useState("");
  const [notice, setNotice] = useState<{ text: string; tone: "good" | "bad" | "neutral" } | null>(null);

  const visible = useMemo(() => (filter === "all" ? items : items.filter((item) => item.kind === filter)), [items, filter]);
  const counts = useMemo(() => {
    const map = new Map<CmsKind, number>();
    for (const item of items) map.set(item.kind, (map.get(item.kind) || 0) + 1);
    return map;
  }, [items]);

  // La selezione segue il filtro: senza questo, filtrando per "Redirect" la lista
  // mostra le redirect ma l'editor resta aperto su un articolo, e il pulsante
  // Publish pubblicherebbe il contenuto sbagliato senza che nulla lo segnali.
  useEffect(() => {
    if (!focusId) return;
    const target = items.find((item) => item.id === focusId);
    onFocusHandled?.();
    if (!target) return;
    setFilter(target.kind);
    setSelectedId(target.id);
    setDraft(structuredClone(target));
    setDataText(dataTextOf(target.data));
    setDataError("");
    setNotice(null);
  }, [focusId, items, onFocusHandled]);

  useEffect(() => {
    if (focusId) return;
    if (!visible.length) return;
    if (selectedId && visible.some((item) => item.id === selectedId)) return;
    const first = visible[0];
    setSelectedId(first.id);
    setDraft(structuredClone(first));
    setDataText(dataTextOf(first.data));
    setDataError("");
  }, [visible, selectedId, focusId]);

  function choose(item: AdminContentItem) {
    setSelectedId(item.id);
    setDraft(structuredClone(item));
    setDataText(dataTextOf(item.data));
    setDataError("");
    setNotice(null);
  }

  function startNew(kind: CmsKind) {
    const item = newItem(kind);
    setSelectedId(item.id);
    setDraft(item);
    setDataText(dataTextOf(item.data));
    setDataError("");
    setNotice(null);
  }

  function update<K extends keyof AdminContentItem>(key: K, value: AdminContentItem[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  function updateData(patch: Record<string, unknown>) {
    setDraft((current) => {
      const data = { ...current.data, ...patch };
      setDataText(dataTextOf(data));
      setDataError("");
      return { ...current, data };
    });
  }

  function updateList(key: "keywords" | "tags" | "locales", value: string) {
    const list = value.split(",").map((entry) => entry.trim()).filter(Boolean);
    setDraft((current) => ({ ...current, data: { ...current.data, [key]: list } }));
  }

  function updateDataJson(value: string) {
    setDataText(value);
    try {
      const parsed = JSON.parse(value) as AdminContentItem["data"];
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error("invalid");
      setDraft((current) => ({ ...current, data: parsed }));
      setDataError("");
    } catch {
      setDataError("Data must be a valid JSON object.");
    }
  }

  async function save() {
    setNotice(null);
    const saved = await onSave({ ...draft, status: "draft" });
    if (saved) {
      setDraft(saved);
      setDataText(dataTextOf(saved.data));
      setSelectedId(saved.id);
      setNotice({ text: "Draft saved.", tone: "good" });
    } else {
      setNotice({ text: "The draft could not be saved.", tone: "bad" });
    }
  }

  async function publish() {
    setNotice(null);
    const saved = await onSave({ ...draft, status: "draft" });
    if (!saved) {
      setNotice({ text: "The draft could not be saved.", tone: "bad" });
      return;
    }
    const published = await onPublish(saved.id);
    setNotice(
      published
        ? { text: "Published. The commit is on Git and the deploy has been requested; the site changes after the build.", tone: "good" }
        : { text: "The draft is saved, but the publish did not complete. Check GitHub in Settings.", tone: "bad" },
    );
  }

  const kind = draft.kind;
  const locales = Array.isArray(draft.data.locales) ? (draft.data.locales as string[]) : [];

  return (
    <div className="space-y-4">
      <SectionHeader
        eyebrow="Publishing"
        title="Content"
        description="Everything the site publishes, in one library. Draft first, publish when it holds."
        actions={<Button tone="primary" onClick={() => startNew(kind)}>New {KIND_LABELS[kind].toLowerCase()}</Button>}
      />

      <div className="-mx-1 flex flex-wrap items-center gap-1 px-1">
        <button type="button" onClick={() => setFilter("all")} className={tabClass(filter === "all")}>
          All <span className="admin-tabular text-admin-faint">{items.length}</span>
        </button>
        {CMS_KINDS.filter((entry) => counts.get(entry)).map((entry) => (
          <button key={entry} type="button" onClick={() => setFilter(entry)} className={tabClass(filter === entry)}>
            {KIND_LABELS[entry]} <span className="admin-tabular text-admin-faint">{counts.get(entry)}</span>
          </button>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-[252px_1fr]">
        <section className="overflow-hidden rounded-lg border border-admin-line bg-admin-panel">
          <header className="flex min-h-10 items-center border-b border-admin-line px-3.5 py-2">
            <h2 className="text-[13px] font-medium text-admin-ink">{filter === "all" ? "Library" : KIND_LABELS[filter]}</h2>
            <span className="admin-tabular ml-auto text-[11px] text-admin-faint">{visible.length}</span>
          </header>
          {visible.length ? (
            <div className="max-h-[62vh] overflow-y-auto p-1">
              {visible.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => choose(item)}
                  className={`mb-0.5 flex w-full flex-col rounded-md px-2 py-1.5 text-left transition-colors ${selectedId === item.id ? "bg-admin-active" : "hover:bg-admin-soft"}`}
                >
                  <span className={`block truncate text-[13px] ${selectedId === item.id ? "text-admin-ink" : "text-admin-ink/90"}`}>{item.title || item.slug}</span>
                  <span className="mt-0.5 flex items-center gap-2 text-[11px] text-admin-faint">
                    <span className="truncate">{KIND_LABELS[item.kind]}</span>
                    {item.status === "published" ? <Pill tone="good">live</Pill> : null}
                  </span>
                </button>
              ))}
            </div>
          ) : (
            <p className="px-3.5 py-10 text-center text-[13px] text-admin-faint">Nothing here yet.</p>
          )}
        </section>

        <Card
          title="Editor"
          action={
            <div className="flex items-center gap-3">
              <span className="admin-tabular text-[11px] text-admin-faint">{draft.version ? `Version ${draft.version}` : "Unsaved draft"}</span>
              <Pill tone={draft.status === "published" ? "good" : "neutral"}>{draft.status}</Pill>
            </div>
          }
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Type" hint={KIND_HINTS[kind]}>
              <Select
                value={kind}
                label="Content type"
                onChange={(value) => update("kind", value as CmsKind)}
                options={CMS_KINDS.map((entry) => ({ value: entry, label: KIND_LABELS[entry] }))}
              />
            </Field>
            <Field label="Slug" hint="Lowercase, numbers and dashes. It becomes the file name on Git.">
              <TextInput value={draft.slug} onChange={(value) => update("slug", value)} />
            </Field>
            <Field label="Title">
              <TextInput value={draft.title} onChange={(value) => update("title", value)} />
            </Field>
            <Field label="Date" hint="Used for ordering on the home and in the archives.">
              <TextInput type="date" value={String(draft.data.date || "")} onChange={(value) => updateData({ date: value })} />
            </Field>
          </div>

          <div className="mt-3 grid gap-3">
            <Field label="Description" hint="The one line that appears in the SERP, the cards and the feed. Around 155 characters.">
              <TextArea rows={3} value={draft.description} onChange={(value) => update("description", value)} />
            </Field>
          </div>

          {(kind === "post" || kind === "note" || kind === "feedback" || kind === "page") && (
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              <Field label="Category"><TextInput value={String(draft.data.category || "")} onChange={(value) => updateData({ category: value })} /></Field>
              <Field label="Tags" hint="Comma separated."><TextInput value={tagsOf(draft.data)} onChange={(value) => updateList("tags", value)} /></Field>
              <Field label="Keywords" hint="Comma separated."><TextInput value={keywordsOf(draft.data)} onChange={(value) => updateList("keywords", value)} /></Field>
            </div>
          )}

          {kind === "page" && (
            <div className="mt-3">
              <Field label="Languages" hint="A page is generated only for the languages listed here. Empty means English only.">
                <div className="flex flex-wrap gap-1.5">
                  {LOCALES.map((locale) => {
                    const on = locales.includes(locale);
                    return (
                      <button
                        key={locale}
                        type="button"
                        onClick={() => updateList("locales", (on ? locales.filter((entry) => entry !== locale) : [...locales, locale]).join(", "))}
                        className={`h-7 rounded-md border px-2 text-[12px] transition-colors ${on ? "border-transparent bg-admin-ink text-white" : "border-admin-line text-admin-muted hover:bg-admin-soft hover:text-admin-ink"}`}
                      >
                        {locale}
                      </button>
                    );
                  })}
                </div>
              </Field>
            </div>
          )}

          {kind === "voice_note" && (
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <Field label="Audio src" hint="From the Media tab, for example /media/content/raj.mp3."><TextInput value={String(draft.data.audioSrc || "")} onChange={(value) => updateData({ audioSrc: value })} /></Field>
              <Field label="Duration" hint="Optional, for example 4:32."><TextInput value={String(draft.data.duration || "")} onChange={(value) => updateData({ duration: value })} /></Field>
            </div>
          )}

          {kind === "video" && (
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <Field label="Video src" hint="From the Media tab."><TextInput value={String(draft.data.videoSrc || "")} onChange={(value) => updateData({ videoSrc: value })} /></Field>
              <Field label="Poster image" hint="Optional, from the Media tab."><TextInput value={String(draft.data.poster || "")} onChange={(value) => updateData({ poster: value })} /></Field>
            </div>
          )}

          {kind === "redirect" && (
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              <Field label="From" hint="The old path, with a leading slash."><TextInput value={String(draft.data.from || "")} onChange={(value) => updateData({ from: value })} placeholder="/old-path/" /></Field>
              <Field label="To" hint="A path or a full https URL."><TextInput value={String(draft.data.to || "")} onChange={(value) => updateData({ to: value })} placeholder="/new-path/" /></Field>
              <Field label="Status">
                <Select value={String(draft.data.status || 301)} label="Redirect status" onChange={(value) => updateData({ status: Number(value) })} options={[{ value: "301", label: "301 permanent" }, { value: "302", label: "302 temporary" }]} />
              </Field>
            </div>
          )}

          {kind === "settings" && (
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <Field label="Name"><TextInput value={String(draft.data.name || "")} onChange={(value) => updateData({ name: value })} /></Field>
              <Field label="Role" hint="The line under the name on the home."><TextInput value={String(draft.data.role || "")} onChange={(value) => updateData({ role: value })} /></Field>
              <Field label="Email" hint="Feeds the contact link and the NDA page."><TextInput value={String(draft.data.email || "")} onChange={(value) => updateData({ email: value })} /></Field>
              <Field label="Payle URL"><TextInput value={String(draft.data.payleUrl || "")} onChange={(value) => updateData({ payleUrl: value })} /></Field>
              <div className="sm:col-span-2">
                <Field label="SEO description" hint="Around 155 characters. An empty field falls back to the one in code.">
                  <TextArea rows={2} value={String(draft.data.description || "")} onChange={(value) => updateData({ description: value })} />
                </Field>
              </div>
            </div>
          )}

          {kind !== "settings" && kind !== "redirect" && kind !== "site_copy" && kind !== "taxonomy" && (
            <div className="mt-3">
              <Field label="Body, Markdown" hint="## for a section, > for a quote, - for a list, ``` for code, @@audio|src|title for a player.">
                <TextArea rows={16} mono value={draft.body_markdown} onChange={(value) => update("body_markdown", value)} />
              </Field>
            </div>
          )}

          <div className="mt-3">
            <Field label="Structured data, JSON" hint="Anything the specific fields above do not cover. Published as-is.">
              <TextArea rows={10} mono value={dataText} onChange={updateDataJson} />
            </Field>
            {dataError ? <p className="mt-1.5 text-[12px] text-admin-muted">{dataError}</p> : null}
          </div>

          {notice ? <div className="mt-3"><Notice tone={notice.tone}>{notice.text}</Notice></div> : null}

          <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-admin-line pt-3.5">
            <Button onClick={() => void save()} disabled={loading || !draft.title || !draft.slug}>Save draft</Button>
            <Button tone="primary" onClick={() => void publish()} disabled={loading || !draft.title || !draft.slug}>Publish to Git</Button>
            {onRestore && draft.status === "published" ? (
              <Button disabled={loading} onClick={() => void onRestore(kind, draft.slug)} title="Revert this file to the last published commit">
                Revert published version
              </Button>
            ) : null}
          </div>
        </Card>
      </div>
    </div>
  );
}

function tabClass(active: boolean) {
  return `inline-flex h-7 items-center gap-1.5 rounded-full border px-2.5 text-[13px] transition-colors ${
    active
      ? "border-admin-line bg-admin-active text-admin-ink"
      : "border-transparent text-admin-muted hover:bg-admin-soft hover:text-admin-ink"
  }`;
}
