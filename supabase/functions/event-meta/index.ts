import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const APP_URL = Deno.env.get("APP_BASE_URL") || "https://kulmidsystembydiini.lovable.app";
const FALLBACK_OG = `${APP_URL}/og-default.jpg`;

const esc = (s: string | null | undefined) =>
  (s || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

const truncate = (s: string, n: number) => (s.length > n ? `${s.slice(0, n - 1).trimEnd()}…` : s);

/**
 * Serves crawler-friendly HTML with Open Graph tags for a single event.
 * Vercel rewrites social-media crawlers here so shared links render a rich card,
 * while real browsers still get the SPA.
 */
serve(async (req) => {
  const url = new URL(req.url);
  const id = url.searchParams.get("id")?.trim();

  if (!id) return new Response("Missing event id", { status: 400 });

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  const { data: event } = await supabase
    .from("events")
    .select("id, slug, title, description, date, location, image_url, host_name, category, price")
    .or(`id.eq.${id},slug.eq.${id}`)
    .maybeSingle();

  if (!event) {
    return new Response("<!DOCTYPE html><html><head><title>Event not found · Kulmid</title></head><body>Event not found</body></html>", {
      status: 404,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  }

  const canonical = `${APP_URL}/event/${event.slug || event.id}`;
  const when = new Date(event.date).toLocaleString("en-US", {
    weekday: "short", month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit",
  });
  const title = truncate(`${event.title} · Kulmid`, 60);
  const description = truncate(
    (event.description?.replace(/\s+/g, " ").trim() || `${when} · ${event.location}. Register on Kulmid.`),
    155
  );
  const image = event.image_url || FALLBACK_OG;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Event",
    name: event.title,
    startDate: event.date,
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    location: { "@type": "Place", name: event.location, address: event.location },
    image: [image],
    description,
    url: canonical,
    organizer: { "@type": "Organization", name: event.host_name || "Kulmid" },
    offers: {
      "@type": "Offer",
      price: String(event.price ?? 0),
      priceCurrency: "USD",
      url: canonical,
      availability: "https://schema.org/InStock",
    },
  };

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${esc(title)}</title>
  <meta name="description" content="${esc(description)}" />
  <link rel="canonical" href="${esc(canonical)}" />
  <meta property="og:type" content="website" />
  <meta property="og:site_name" content="Kulmid" />
  <meta property="og:title" content="${esc(event.title)}" />
  <meta property="og:description" content="${esc(description)}" />
  <meta property="og:image" content="${esc(image)}" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta property="og:url" content="${esc(canonical)}" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${esc(event.title)}" />
  <meta name="twitter:description" content="${esc(description)}" />
  <meta name="twitter:image" content="${esc(image)}" />
  <script type="application/ld+json">${JSON.stringify(jsonLd)}</script>
  <meta http-equiv="refresh" content="0; url=${esc(canonical)}" />
</head>
<body>
  <h1>${esc(event.title)}</h1>
  <p>${esc(when)} — ${esc(event.location)}</p>
  <p>${esc(description)}</p>
  <a href="${esc(canonical)}">View this event on Kulmid</a>
</body>
</html>`;

  return new Response(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "public, max-age=300, s-maxage=600",
    },
  });
});