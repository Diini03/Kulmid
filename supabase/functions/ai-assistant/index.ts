import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const MAX_HISTORY = 20;
const MAX_MSG_CHARS = 2000;

const json = (body: unknown, status: number) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

const KNOWLEDGE = `
KULMID FACTS (source of truth — never invent features beyond these):
- Kulmid (https://kulmid.com) is a bilingual (English/Somali) event platform for organizers in Somalia and beyond.
- Publishing: events go live instantly when published. Admins may FEATURE an event on the Discover page. Drafts stay private.
- Create an event: Create page (/create) → title, date/time, location or online link, category (or "Other"/"No category"), cover image, description (an AI button can write it) → Publish.
- Manage events: My Events (/events) → open an event → tabs Overview, Guests, Registration, Insights, Settings.
- Registration form: Registration tab — Google-Forms-style questions (short text, paragraph, multiple choice, checkboxes, dropdown, yes/no), required toggle.
- Capacity: Unlimited or a set limit; public page shows a progress bar and spots left. Optional waitlist auto-promotes people when a spot frees up.
- Registration window: optional open/close date & time; organizers can force Open/Closed/Cancelled.
- Approvals: auto-approve or manual approval; Overview shows pending registrations with "Approve all".
- Guests receive a confirmation email with a QR code; check-in via the scanner in the event. QR codes stop working after the event ends.
- Guests can cancel via the link in their email. Reminder emails go 24h and 1h before. After the event, guests get a feedback request (1–5 stars); organizers see results in Insights.
- Insights: KPIs, charts per question, smart breakdowns (gender, student/graduate, etc.), CSV/Excel export.
- Organizers can bulk-email guests, duplicate an event (Settings → Duplicate), share via link or WhatsApp.
- Profiles: public page at /u/username; admins can grant a Verified organizer checkmark.
- Paid ticketing is not live yet — priced events show "payment coming soon". Do not promise payments.
- Useful pages: Discover (/discover), Calendar (/calendar), Guides (/guides), Help (/help), Pricing (/pricing), Contact (/contact), Settings (/settings), Sign in (/signin), Sign up (/signup).
- Guides: /guides/create-your-first-event, /guides/build-your-registration-form, /guides/approve-guests-and-check-in, /guides/read-your-insights, /guides/use-the-ai-assistant.
- If unsure or the user has an account problem, suggest the Contact page (/contact). Never make up emails, phone numbers or prices.`;

const buildSystemPrompt = (page: string, lang: string, events: string) => `You are Kulmid AI, the friendly help assistant for the Kulmid event platform.

LANGUAGE: Reply in the language of the user's latest message (English or natural Somali, not word-for-word translation). If unclear, use the site language: ${lang === "so" ? "Somali" : "English"}.

STYLE: Short and practical — at most ~120 words unless asked for more. Use numbered steps for how-to answers. Link pages with markdown relative links like [Create an event](/create) so users can click them. Light emoji use.

SCOPE: Only Kulmid topics (finding events, creating/managing events, registration, check-in, accounts). Politely decline unrelated requests and steer back to Kulmid.

The user is currently on page: ${page || "/"}. Tailor the answer to that page when relevant.
${KNOWLEDGE}

UPCOMING PUBLIC EVENTS (live data; recommend only from this list and link them; if empty say there are no upcoming events and suggest /discover later):
${events || "(none)"}`;

async function loadUpcomingEvents(): Promise<string> {
  try {
    const url = Deno.env.get("SUPABASE_URL");
    const key = Deno.env.get("SUPABASE_ANON_KEY");
    if (!url || !key) return "";
    const sb = createClient(url, key);
    const { data } = await sb
      .from("events")
      .select("title, date, location, category, slug, id, price")
      .in("status", ["published", "featured", "approved", "upcoming", "ongoing"])
      .gte("date", new Date().toISOString())
      .order("date", { ascending: true })
      .limit(15);
    return (data || [])
      .map((e: any) =>
        `- ${e.title} | ${new Date(e.date).toUTCString()} | ${e.location} | ${e.category} | ${Number(e.price) > 0 ? "paid" : "free"} | link: /event/${e.slug || e.id}`)
      .join("\n");
  } catch {
    return "";
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json().catch(() => ({}));
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) return json({ error: "Assistant is not configured." }, 500);

    const raw = Array.isArray(body.messages) ? body.messages : [];
    const messages = raw
      .filter((m: any) => (m?.role === "user" || m?.role === "assistant") && typeof m.content === "string" && m.content.trim())
      .slice(-MAX_HISTORY)
      .map((m: any) => ({ role: m.role, content: m.content.slice(0, MAX_MSG_CHARS) }));
    if (!messages.length || messages[messages.length - 1].role !== "user") {
      return json({ error: "Please type a question." }, 400);
    }

    const page = typeof body.page === "string" ? body.page.slice(0, 120) : "/";
    const lang = body.language === "so" ? "so" : "en";
    const events = await loadUpcomingEvents();

    const upstream = await fetch("https://ai.gateway.lovable.dev/v1/responses", {
      method: "POST",
      headers: {
        "Lovable-API-Key": LOVABLE_API_KEY,
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
        "X-Lovable-AIG-SDK": "fetch",
      },
      body: JSON.stringify({
        model: "openai/gpt-6-astra",
        instructions: buildSystemPrompt(page, lang, events),
        input: messages.map((m: any) => ({ role: m.role, content: m.content })),
        reasoning: { effort: "low" },
        store: false,
        stream: true,
      }),
    });

    if (!upstream.ok || !upstream.body) {
      const text = await upstream.text().catch(() => "");
      console.error("AI gateway error:", upstream.status, text);
      if (upstream.status === 429) return json({ error: "Too many questions right now. Please try again in a moment." }, 429);
      if (upstream.status === 402) return json({ error: "The assistant is temporarily unavailable. Please contact support." }, 402);
      if (upstream.status === 403) return json({ error: "The assistant can't answer this request." }, 403);
      return json({ error: "Assistant temporarily unavailable." }, 500);
    }

    // Translate Responses SSE -> simple chat-style SSE the widget already understands.
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();
    const reader = upstream.body.getReader();
    const stream = new ReadableStream({
      async start(controller) {
        let buffer = "";
        const emit = (text: string) =>
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ choices: [{ delta: { content: text } }] })}\n\n`));
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split("\n");
            buffer = lines.pop() || "";
            for (const l of lines) {
              const line = l.trim();
              if (!line.startsWith("data:")) continue;
              const data = line.slice(5).trim();
              if (!data || data === "[DONE]") continue;
              try {
                const evt = JSON.parse(data);
                if (evt.type === "response.output_text.delta" && evt.delta) emit(evt.delta);
                else if (evt.type === "error" || evt.type === "response.failed") {
                  emit("\n\n_Sorry, something went wrong. Please try again._");
                }
              } catch { /* partial */ }
            }
          }
        } catch (e) {
          console.error("stream error", e);
        } finally {
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
        }
      },
      cancel() { reader.cancel().catch(() => {}); },
    });

    return new Response(stream, { headers: { ...corsHeaders, "Content-Type": "text/event-stream" } });
  } catch (error) {
    console.error("Chat error:", error);
    return json({ error: "Assistant temporarily unavailable." }, 500);
  }
});
