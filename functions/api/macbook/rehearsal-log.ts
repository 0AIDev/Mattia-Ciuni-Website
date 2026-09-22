// Public trust endpoint: GET /api/macbook/rehearsal-log
// This endpoint is intentionally read-only. Before ten completed rehearsal rows
// exist it returns an honest not-ready response, never fabricated proof.
// @ts-expect-error Pages bundles extensionless function imports; Node's offline loader needs `.ts`.
import { supabaseConfigured, supabaseRequest } from "../../lib/supabase.ts";

interface Env {
  SUPABASE_URL?: string;
  SUPABASE_SERVICE_ROLE_KEY?: string;
  MACBOOK_CONTEST_ID?: string;
}

interface Context {
  request: Request;
  env: Env;
}

type RehearsalRow = {
  run_label: string;
  account_test_hash: string;
  executed_at: string;
  result: "passed" | "failed";
  valid_evidence_count: number;
  authorization_id: string | null;
  ledger_receipt_id: string | null;
};

function json(body: Record<string, unknown>, status = 200, headers: HeadersInit = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "public, max-age=60, s-maxage=60",
      "X-Content-Type-Options": "nosniff",
      ...headers,
    },
  });
}

function maskedHash(value: string): string {
  return value.slice(0, 16);
}

export const onRequestGet = async ({ env }: Context): Promise<Response> => {
  if (!supabaseConfigured(env) || !env.MACBOOK_CONTEST_ID) {
    return json({ status: "not_ready", rehearsal_complete: false, results: [] }, 200);
  }

  try {
    const resource = [
      "macbook_rehearsals",
      "?select=run_label,account_test_hash,executed_at,result,valid_evidence_count,authorization_id,ledger_receipt_id",
      `&contest_id=eq.${encodeURIComponent(env.MACBOOK_CONTEST_ID)}`,
      "&order=executed_at.asc",
      "&limit=10",
    ].join("");
    const { response, data } = await supabaseRequest<RehearsalRow[]>(env, resource);
    if (!response.ok || !Array.isArray(data)) {
      return json({ status: "not_ready", rehearsal_complete: false, results: [] }, 200);
    }

    const results = data.map((row) => ({
      run_label: row.run_label,
      account_test_hash: maskedHash(row.account_test_hash),
      executed_at: row.executed_at,
      result: row.result,
      valid_evidence_count: row.valid_evidence_count,
      has_authorization_id: Boolean(row.authorization_id),
      has_ledger_receipt: Boolean(row.ledger_receipt_id),
    }));
    const complete = results.length === 10;
    return json({ status: complete ? "ready" : "not_ready", rehearsal_complete: complete, results });
  } catch {
    // Public trust endpoints fail closed without revealing storage or provider details.
    return json({ status: "not_ready", rehearsal_complete: false, results: [] }, 200);
  }
};
