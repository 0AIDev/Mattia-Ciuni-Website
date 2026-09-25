"use client";

import { useMemo, useState } from "react";
import { Button, Card, Empty, Field, InlineButton, Notice, Pill, SectionHeader, Table, TextInput } from "@/components/admin/ui";
import type { AdminContentItem, CmsKind } from "@/lib/cms-types";

/**
 * SEO e redirect.
 *
 * Le regole di redirect sono un kind del CMS e si editano dall'editor come
 * qualsiasi altro contenuto: questa sezione le elenca e porta al tipo giusto,
 * perche' un redirect e' una riga sola e non merita l'editor di un articolo.
 * Qui compaiono anche i dati che gli agenti leggono davvero, cosi' quello che
 * finisce in `llms.txt` e nelle card non e' una copia scollegata di quello che
 * il sito mostra.
 */

const LOCALES = ["en", "it", "fr", "es", "de"] as const;

export function AdminSeoView({
  items,
  onEdit,
  onSave,
  loading,
}: {
  items: AdminContentItem[];
  onEdit: (item: AdminContentItem) => void;
  onSave: (item: AdminContentItem) => Promise<AdminContentItem | null>;
  loading: boolean;
}) {
  const redirects = useMemo(() => items.filter((item) => item.kind === "redirect"), [items]);
  const pages = useMemo(() => items.filter((item) => item.kind === "page"), [items]);
  const [testing, setTesting] = useState<Record<string, string>>({});

  const missingAlt = useMemo(
    () => items.filter((item) => item.kind === "post" || item.kind === "note").filter((item) => !String(item.data.ogImage || "")),
    [items],
  );

  const missingDescription = useMemo(
    () => items.filter((item) => item.kind !== "settings" && item.kind !== "taxonomy").filter((item) => !item.description || item.description.length < 40),
    [items],
  );

  return (
    <div className="space-y-4">
      <SectionHeader
        eyebrow="Discovery"
        title="SEO"
        description="Redirects, per-language pages and the metadata that search engines and agents read. Everything here is what the build actually emits."
        actions={
          <Button onClick={() => onEdit({
            id: crypto.randomUUID(),
            kind: "redirect" as CmsKind,
            slug: "new-redirect",
            status: "draft",
            title: "New redirect",
            description: "",
            body_markdown: "",
            data: { from: "/old-path/", to: "/new-path/", status: 301, enabled: true },
            version: 0,
          })}>
            New redirect
          </Button>
        }
      />

      <div className="grid gap-4 xl:grid-cols-2">
        <Card title={`Redirects · ${redirects.length}`}>
          {redirects.length ? (
            <Table
              headers={["From", "To", "Status", ""]}
              rows={redirects.map((item) => [
                <span className="font-mono text-[12px]">{String(item.data.from || "—")}</span>,
                <span className="break-all font-mono text-[12px]">{String(item.data.to || "—")}</span>,
                <Pill>{Number(item.data.status || 301)}</Pill>,
                <InlineButton onClick={() => onEdit(item)}>Edit</InlineButton>,
              ])}
            />
          ) : (
            <Empty>No redirects. Paths that move keep their address, that is the point.</Empty>
          )}
          <p className="mt-3 border-t border-admin-line pt-3 text-[11px] leading-4 text-admin-faint">Cloudflare Pages reads <code className="font-mono">_redirects</code> at deploy. Past 100 rules the extras are ignored without a warning, and the build fails first.</p>
        </Card>

        <Card title={`Pages · ${pages.length}`}>
          {pages.length ? (
            <Table
              headers={["Page", "Languages", "Sitemap", ""]}
              rows={pages.map((item) => {
                const locales = Array.isArray(item.data.locales) ? (item.data.locales as string[]) : ["en"];
                return [
                  <span className="truncate">{item.title || item.slug}</span>,
                  <span className="font-mono text-[12px]">{locales.join(", ")}</span>,
                  item.data.noindex ? <Pill tone="warn">no</Pill> : <Pill tone="good">yes</Pill>,
                  <InlineButton onClick={() => onEdit(item)}>Edit</InlineButton>,
                ];
              })}
            />
          ) : (
            <Empty>No pages created here yet. A page gets its own route in every language you list.</Empty>
          )}
          <p className="mt-3 border-t border-admin-line pt-3 text-[11px] leading-4 text-admin-faint">A page without <code className="font-mono">noindex</code> goes into the sitemap, the llms.txt cards and the news sitemap at the next deploy.</p>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card title="Metadata to review">
          {missingDescription.length || missingAlt.length ? (
            <div className="space-y-3">
              {missingDescription.length ? (
                <div>
                  <p className="text-[12px] text-admin-muted">Thin or missing description, {missingDescription.length} items. Search engines and agents write their own snippet when there is none.</p>
                  <ul className="mt-1.5 space-y-0.5 text-[12px] text-admin-faint">
                    {missingDescription.slice(0, 6).map((item) => <li key={item.id} className="truncate">{item.title || item.slug}</li>)}
                  </ul>
                </div>
              ) : null}
              {missingAlt.length ? (
                <div>
                  <p className="text-[12px] text-admin-muted">No share image, {missingAlt.length} items. Without one the social card falls back to the site image.</p>
                  <ul className="mt-1.5 space-y-0.5 text-[12px] text-admin-faint">
                    {missingAlt.slice(0, 6).map((item) => <li key={item.id} className="truncate">{item.title || item.slug}</li>)}
                  </ul>
                </div>
              ) : null}
            </div>
          ) : (
            <p className="text-[13px] text-admin-muted">Every published item has a description and a share image.</p>
          )}
        </Card>

        <Card title="Per-language checks">
          <div className="space-y-3">
            <Field label="Test a path" hint="Checks what the exported site actually serves, not what the panel believes.">
              <div className="flex gap-2">
                <TextInput value={testing.path || ""} onChange={(value) => setTesting((current) => ({ ...current, path: value }))} placeholder="/thoughts/money-layer-for-ai-agents/" />
                <Button onClick={() => setTesting((current) => ({ ...current, result: window.location.origin + (current.path || "") }))}>Resolve</Button>
              </div>
            </Field>
            {testing.result ? <Notice>{testing.result}</Notice> : null}
            <div className="border-t border-admin-line pt-3 text-[11px] leading-4 text-admin-faint">
              <p>Languages declared: {LOCALES.join(", ")}.</p>
              <p className="mt-1">The hreflang map is emitted per page for the languages that page exists in, with <code className="font-mono">x-default</code> on the English URL.</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
