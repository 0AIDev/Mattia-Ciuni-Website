import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import CareerDetailPage from "@/app/careers/[slug]/page";
import { CareersApplicationModal } from "@/components/CareersApplicationModal";
import { getJob, publicJobs } from "@/lib/careers/jobs";

export const dynamicParams = false;
export function generateStaticParams() { return publicJobs().map((job) => ({ slug: job.slug })); }
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> { const job = getJob((await params).slug); return job ? { title: `Apply: ${job.title}`, robots: { index: false, follow: false } } : {}; }

export default async function ApplyPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const job = getJob(slug);
  if (!job) notFound();
  if (job.status !== "open") redirect(`/careers/${job.slug}/`);
  return <><CareerDetailPage params={Promise.resolve({ slug })} /><CareersApplicationModal job={job} basePath="/careers" /></>;
}
