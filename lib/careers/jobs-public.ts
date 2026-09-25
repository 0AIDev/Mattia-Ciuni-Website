import { loadCmsCollection, mergeCmsCollection } from "@/lib/cms-content";
import { jobs as baseJobs, type CareerJob } from "./jobs";

const cmsJobs = loadCmsCollection<CareerJob>("jobs");

export const jobs: CareerJob[] = mergeCmsCollection(baseJobs, cmsJobs);

export function getJob(slug: string): CareerJob | undefined {
  return jobs.find((job) => job.slug === slug);
}

export function openJobs(): CareerJob[] {
  return jobs.filter((job) => job.status === "open");
}

export function comingSoonJobs(): CareerJob[] {
  return jobs.filter((job) => job.status === "coming-soon");
}

export function publicJobs(): CareerJob[] {
  return jobs.filter((job) => job.status === "open" || job.status === "coming-soon");
}

export function shouldShowRoleSearch(jobCount: number): boolean {
  return jobCount >= 3;
}
