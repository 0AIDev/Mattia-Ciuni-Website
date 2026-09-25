import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getJob, publicJobs } from "@/lib/careers/jobs-public";
import { LOCALES, isLocale } from "@/lib/i18n";

export const dynamicParams = false;
export function generateStaticParams() { return LOCALES.flatMap((locale) => publicJobs().map((job) => ({ locale, slug: job.slug }))); }
export async function generateMetadata({ params }: { params: Promise<{ locale: string; slug: string }> }): Promise<Metadata> { const { locale: raw, slug } = await params; if (!isLocale(raw)) return {}; const job = getJob(slug); return job ? { title: `Apply: ${job.title}`, robots: { index: false, follow: false } } : {}; }

export default async function LocalizedApplyPage({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale: raw, slug } = await params;
  if (!isLocale(raw)) notFound();
  const job = getJob(slug);
  if (!job) notFound();
  if (job.status !== "open") redirect(`/careers/${job.slug}/`);
  // Applications are deliberately canonical English pages. Never render the
  // localized careers shell or modal here, even when a visitor arrives via
  // /de/, /it/, /fr/ or /es/.
  redirect(`/careers/${job.slug}/apply/`);
}
