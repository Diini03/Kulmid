import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const APP_URL = (Deno.env.get("APP_BASE_URL") || "https://kulmidsystembydiini.lovable.app").replace(/\/$/, "");

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const STATIC_PATHS: Array<{ path: string; priority: string; changefreq: string }> = [
  { path: "/", priority: "1.0", changefreq: "daily" },
  { path: "/discover", priority: "0.9", changefreq: "daily" },
  { path: "/about", priority: "0.6", changefreq: "monthly" },
  { path: "/contact", priority: "0.5", changefreq: "monthly" },
  { path: "/help", priority: "0.5", changefreq: "monthly" },
  { path: "/guides", priority: "0.7", changefreq: "weekly" },
  { path: "/pricing", priority: "0.6", changefreq: "monthly" },
  { path: "/privacy", priority: "0.3", changefreq: "yearly" },
  { path: "/terms", priority: "0.3", changefreq: "yearly" },
];

/** Public sitemap built from live events plus the static marketing pages. */
serve(async () => {
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  const { data: events } = await supabase
    .from("events")
    .select("id, slug, updated_at, date")
    .in("status", ["published", "featured", "approved", "upcoming", "ongoing"])
    .order("date", { ascending: false })
    .limit(5000);

  const { data: guides } = await supabase.from("categories").select("slug").eq("is_active", true);

  const urls: string[] = [];

  for (const s of STATIC_PATHS) {
    urls.push(
      `<url><loc>${esc(APP_URL + s.path)}</loc><changefreq>${s.changefreq}</changefreq><priority>${s.priority}</priority></url>`
    );
  }

  for (const c of guides || []) {
    if (!c.slug) continue;
    urls.push(
      `<url><loc>${esc(`${APP_URL}/discover?category=${encodeURIComponent(c.slug)}`)}</loc><changefreq>daily</changefreq><priority>0.6</priority></url>`
    );
  }

  for (const e of events || []) {
    const loc = `${APP_URL}/event/${e.slug || e.id}`;
    const lastmod = e.updated_at ? new Date(e.updated_at).toISOString() : undefined;
    urls.push(
      `<url><loc>${esc(loc)}</loc>${lastmod ? `<lastmod>${lastmod}</lastmod>` : ""}<changefreq>weekly</changefreq><priority>0.8</priority></url>`
    );
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join("\n")}
</urlset>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=1800, s-maxage=3600",
    },
  });
});
