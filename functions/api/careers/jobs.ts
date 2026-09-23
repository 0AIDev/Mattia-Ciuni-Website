// @ts-expect-error Pages bundles extensionless function imports; Node's offline loader needs `.ts`.
import { openJobs } from "../../../lib/careers/jobs.ts";
// @ts-expect-error Pages bundles extensionless function imports; Node's offline loader needs `.ts`.
import { supabaseKv } from "../../lib/supabase-kv.ts";

type Store = { get(key: string): Promise<string | null> };
type Env = { FEEDBACK?: Store; SUPABASE_URL?: string; SUPABASE_SERVICE_ROLE_KEY?: string };

const JOBS_KEY = "content:jobs";

async function configuredJobs(env: Env) {
  const store = env.FEEDBACK || supabaseKv(env);
  if (!store) return null;
  const raw = await store.get(JOBS_KEY);
  if (!raw) return null;
  try {
    const jobs = JSON.parse(raw) as Array<Record<string, unknown>>;
    return Array.isArray(jobs) ? jobs.filter((job) => job.status === "open") : null;
  } catch {
    return null;
  }
}

export const onRequestGet = async ({ env }: { env: Env }): Promise<Response> => {
  const jobs = (await configuredJobs(env)) || openJobs();
  return new Response(JSON.stringify({ jobs }), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "public, max-age=300, s-maxage=300",
      "X-Content-Type-Options": "nosniff",
    },
  });
};
