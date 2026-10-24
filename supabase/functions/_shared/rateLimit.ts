import { createClient } from "npm:@supabase/supabase-js@2";

/** Client IP from proxy headers (first hop). */
export const clientIp = (req: Request) =>
  (req.headers.get("x-forwarded-for")?.split(",")[0] || req.headers.get("cf-connecting-ip") || "unknown").trim().slice(0, 64);

/** Returns true when allowed. Fails open if the limiter itself is unavailable. */
export async function allowRequest(bucket: string, identifier: string, max: number, windowSeconds: number) {
  const url = Deno.env.get("SUPABASE_URL");
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !key) return true;
  try {
    const sb = createClient(url, key, { auth: { persistSession: false } });
    const { data, error } = await sb.rpc("check_rate_limit", {
      _bucket: bucket, _identifier: identifier, _max_count: max, _window_seconds: windowSeconds,
    });
    return error ? true : data !== false;
  } catch {
    return true;
  }
}

/** Feedback links stay open this many days after the event ends. */
export const FEEDBACK_WINDOW_DAYS = 30;

export const linkState = (start: string, end: string | null, now = Date.now()) => {
  const startMs = new Date(start).getTime();
  const endMs = new Date(end || start).getTime();
  return {
    canCancel: now < startMs,
    feedbackOpen: now >= endMs && now <= endMs + FEEDBACK_WINDOW_DAYS * 86400_000,
  };
};
