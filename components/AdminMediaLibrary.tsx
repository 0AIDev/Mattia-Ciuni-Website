"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Button, Card, Empty, Field, InlineButton, Notice, Pill, SectionHeader, TextArea, TextInput } from "@/components/admin/ui";
import { formatBytes, MEDIA_MAX_BYTES, type MediaItem } from "@/lib/media";

/**
 * Libreria media.
 *
 * I file finiscono in R2 e si servono da `/media/<key>`: il bucket resta
 * privato, e questo e' il punto. Un bucket pubblico avrebbe pubblicato anche i
 * file appena caricati prima che il pannello chieda di pubblicarli, che qui non
 * e' il flusso giusto per un sito personale.
 *
 * L'upload non passa da un `<form>` tradizionale perche' serve mostrare il
 * progresso e non perdere tutto se la connessione cade: qui si invia a pezzi con
 * `fetch`, e ogni file ha il suo stato.
 */

type UploadState = { name: string; progress: number; state: "uploading" | "done" | "error"; message?: string };

const API = "/api/admin/media";

export function AdminMediaLibrary({ onError }: { onError: (message: string) => void }) {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [storage, setStorage] = useState<"configured" | "unconfigured">("unconfigured");
  const [uploads, setUploads] = useState<UploadState[]>([]);
  const [busy, setBusy] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [alt, setAlt] = useState("");
  const [caption, setCaption] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    try {
      const response = await fetch(API, { cache: "no-store" });
      if (!response.ok) {
        setItems([]);
        return;
      }
      const data = (await response.json()) as { items?: MediaItem[]; storage?: "configured" | "unconfigured" };
      setItems(data.items || []);
      setStorage(data.storage || "configured");
    } catch {
      onError("The media library is unavailable.");
    }
  }, [onError]);

  useEffect(() => {
    void load();
  }, [load]);

  function updateUploads(name: string, patch: Partial<UploadState>) {
    setUploads((current) => current.map((entry) => (entry.name === name ? { ...entry, ...patch } : entry)));
  }

  async function uploadOne(file: File): Promise<void> {
    if (file.size > MEDIA_MAX_BYTES) {
      setUploads((current) => [...current, { name: file.name, progress: 0, state: "error", message: `Over the ${formatBytes(MEDIA_MAX_BYTES)} limit` }]);
      return;
    }
    setUploads((current) => [...current, { name: file.name, progress: 0, state: "uploading" }]);
    try {
      // FileReader e' l'API che funziona identica su ogni browser e permette di
      // sapere quando la base64 e' pronta: `fetch` con un File non funziona, e
      // `arrayBuffer` + btoa fallisce su file grandi per lo stack di 32KB.
      const data = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onerror = () => reject(new Error("read failed"));
        reader.onprogress = (event) => {
          if (event.lengthComputable) updateUploads(file.name, { progress: Math.round((event.loaded / event.total) * 60) });
        };
        reader.onload = () => resolve(String(reader.result || ""));
        reader.readAsDataURL(file);
      });
      const payload = data.slice(data.indexOf(",") + 1);
      const response = await fetch(API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "upload", name: file.name, content_type: file.type, data: payload }),
      });
      updateUploads(file.name, { progress: 100 });
      if (!response.ok) {
        const body = await response.json().catch(() => ({})) as { code?: string };
        const message = body.code === "unsupported_type"
          ? "That file type is not allowed"
          : body.code === "file_too_large"
            ? `Over the ${formatBytes(MEDIA_MAX_BYTES)} limit`
            : "Upload failed";
        updateUploads(file.name, { state: "error", message });
        return;
      }
      updateUploads(file.name, { state: "done" });
      await load();
    } catch {
      updateUploads(file.name, { state: "error", message: "Upload failed" });
    }
  }

  async function uploadMany(files: FileList | File[]) {
    setBusy(true);
    for (const file of Array.from(files)) await uploadOne(file);
    setBusy(false);
    if (inputRef.current) inputRef.current.value = "";
  }

  async function saveMeta(key: string) {
    const response = await fetch(API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "update", key, alt, caption }),
    });
    if (!response.ok) {
      onError("The media details could not be saved.");
      return;
    }
    setEditing(null);
    await load();
  }

  async function remove(item: MediaItem) {
    if (!window.confirm(`Delete ${item.name}? Files already published will stop loading.`)) return;
    const response = await fetch(API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "delete", key: item.key }),
    });
    if (!response.ok) {
      onError("The file could not be deleted.");
      return;
    }
    await load();
  }

  return (
    <div className="space-y-4">
      <SectionHeader
        eyebrow="Assets"
        title="Media"
        description="Images, audio and documents. Files are private in R2 and served from this site, so a media URL works without any extra configuration."
      />

      {storage === "unconfigured" ? (
        <Notice tone="bad">The R2 binding is not configured. Add a <code className="font-mono">MEDIA</code> binding to the Pages project and reload.</Notice>
      ) : null}

      <Card title="Upload">
        <div
          onDragOver={(event) => { event.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(event) => { event.preventDefault(); setDragOver(false); if (event.dataTransfer.files.length) void uploadMany(event.dataTransfer.files); }}
          className={`rounded-lg border border-dashed px-6 py-8 text-center transition-colors ${dragOver ? "border-admin-faint bg-admin-soft" : "border-admin-line"}`}
        >
          <p className="text-[13px] text-admin-muted">Drop files here, or</p>
          <div className="mt-3 flex justify-center">
            <Button onClick={() => inputRef.current?.click()} disabled={busy || storage === "unconfigured"}>Choose files</Button>
          </div>
          <input ref={inputRef} type="file" multiple className="hidden" onChange={(event) => event.target.files && void uploadMany(event.target.files)} />
          <p className="mx-auto mt-3 max-w-xl text-[11px] leading-4 text-admin-faint">Images, MP3, M4A, WAV, WebM, MP4 and PDF. Up to {formatBytes(MEDIA_MAX_BYTES)} each. SVG and HTML are refused on purpose: served from this domain, they would be script injection.</p>
        </div>
        {uploads.length ? (
          <ul className="mt-3 border-t border-admin-line">
            {uploads.map((entry) => (
              <li key={entry.name} className="flex items-center justify-between gap-3 border-b border-admin-line py-2 last:border-0">
                <span className="min-w-0 truncate text-[12px] text-admin-ink">{entry.name}</span>
                <span className="flex shrink-0 items-center gap-3">
                  {entry.state === "uploading" ? <span className="admin-tabular text-[12px] text-admin-faint">{entry.progress}%</span> : null}
                  {entry.state === "done" ? <Pill tone="good">done</Pill> : null}
                  {entry.state === "error" ? <Pill tone="bad">{entry.message}</Pill> : null}
                </span>
              </li>
            ))}
          </ul>
        ) : null}
      </Card>

      <Card title={`Library · ${items.length}`}>
        {items.length ? (
          <ul className="divide-y divide-admin-line">
            {items.map((item) => (
              <li key={item.key} className="py-3 first:pt-0 last:pb-0">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] text-admin-ink">{item.name}</p>
                    <p className="mt-0.5 break-all font-mono text-[11px] text-admin-faint">{item.url || `/media/${item.key}`}</p>
                    <p className="mt-1 flex flex-wrap items-center gap-3 text-[11px] text-admin-faint">
                      <Pill>{item.kind}</Pill>
                      <span className="admin-tabular">{formatBytes(item.size)}</span>
                      {item.uploadedAt ? <span className="admin-tabular">{new Date(item.uploadedAt).toLocaleDateString()}</span> : null}
                    </p>
                    {item.alt ? <p className="mt-1.5 text-[12px] text-admin-muted">Alt: {item.alt}</p> : item.kind === "image" ? <p className="mt-1.5 text-[12px] text-admin-muted">No alt text yet.</p> : null}
                  </div>
                  <div className="flex shrink-0 flex-wrap items-center gap-3">
                    <InlineButton onClick={() => { navigator.clipboard.writeText(item.url || `/media/${item.key}`); }}>Copy URL</InlineButton>
                    <InlineButton onClick={() => { setEditing(editing === item.key ? null : item.key); setAlt(item.alt || ""); setCaption(item.caption || ""); }}>{editing === item.key ? "Close" : "Details"}</InlineButton>
                    <InlineButton onClick={() => void remove(item)}>Delete</InlineButton>
                  </div>
                </div>
                {editing === item.key ? (
                  <div className="mt-3 grid gap-3 rounded-md border border-admin-line bg-admin-bg p-3 sm:grid-cols-2">
                    <Field label="Alt text"><TextInput value={alt} onChange={setAlt} placeholder="What the image shows" /></Field>
                    <Field label="Caption"><TextArea rows={2} value={caption} onChange={setCaption} /></Field>
                    <div className="sm:col-span-2">
                      <Button tone="primary" onClick={() => void saveMeta(item.key)}>Save details</Button>
                    </div>
                  </div>
                ) : null}
              </li>
            ))}
          </ul>
        ) : (
          <Empty>No media yet.</Empty>
        )}
      </Card>
    </div>
  );
}
