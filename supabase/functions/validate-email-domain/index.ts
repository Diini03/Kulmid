import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email } = await req.json();

    if (!email || typeof email !== "string") {
      return new Response(
        JSON.stringify({ valid: false, reason: "Email is required" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const parts = email.split("@");
    if (parts.length !== 2 || !parts[1]) {
      return new Response(
        JSON.stringify({ valid: false, reason: "Invalid email format" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const domain = parts[1].toLowerCase();

    // Reject known disposable / temporary email providers
    const disposableDomains = new Set([
      "mailinator.com","tempmail.com","10minutemail.com","guerrillamail.com",
      "yopmail.com","trashmail.com","throwawaymail.com","getnada.com",
      "temp-mail.org","fakeinbox.com","sharklasers.com","maildrop.cc",
      "dispostable.com","mintemail.com","mailnesia.com","spambox.us",
    ]);
    if (disposableDomains.has(domain)) {
      return new Response(
        JSON.stringify({ valid: false, reason: "Please use a permanent email address" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // 1) Domain-level MX check (cheap, catches typos and fake domains)
    try {
      const mxRecords = await Deno.resolveDns(domain, "MX");
      if (!mxRecords || mxRecords.length === 0) {
        return new Response(
          JSON.stringify({ valid: false, reason: "This email address doesn't exist" }),
          { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }
    } catch (dnsError) {
      console.log("DNS resolution failed for domain:", domain, dnsError);
      return new Response(
        JSON.stringify({ valid: false, reason: "This email address doesn't exist" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // 2) Mailbox-level verification via AbstractAPI (no email is sent)
    const abstractKey = Deno.env.get("ABSTRACT_EMAIL_API_KEY");
    if (abstractKey) {
      try {
        const url = `https://emailvalidation.abstractapi.com/v1/?api_key=${abstractKey}&email=${encodeURIComponent(email)}`;
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 6000);
        const res = await fetch(url, { signal: controller.signal });
        clearTimeout(timeout);

        if (res.ok) {
          const data = await res.json();
          const deliverability = String(data?.deliverability ?? "").toUpperCase();
          const smtpValid = data?.is_smtp_valid?.value === true;
          const isValidFormat = data?.is_valid_format?.value === true;
          const isDisposable = data?.is_disposable_email?.value === true;

          if (isDisposable) {
            return new Response(
              JSON.stringify({ valid: false, reason: "Please use a permanent email address" }),
              { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
            );
          }

          if (!isValidFormat) {
            return new Response(
              JSON.stringify({ valid: false, reason: "Invalid email format" }),
              { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
            );
          }

          // Block only confirmed undeliverable mailboxes. Accept DELIVERABLE and
          // RISKY (catch-all domains where SMTP can't prove non-existence).
          if (deliverability === "UNDELIVERABLE" || smtpValid === false) {
            return new Response(
              JSON.stringify({ valid: false, reason: "This email address doesn't exist" }),
              { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
            );
          }

          return new Response(
            JSON.stringify({ valid: true, quality: data?.quality_score ?? null }),
            { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
          );
        }

        console.log("AbstractAPI non-OK status:", res.status);
      } catch (apiError) {
        // Fail-open if the verifier is down or slow — don't block real users
        console.log("AbstractAPI verification error:", apiError);
      }
    } else {
      console.log("ABSTRACT_EMAIL_API_KEY not configured — skipping mailbox check");
    }

    // Fallback: MX passed, mailbox check unavailable
    return new Response(
      JSON.stringify({ valid: true, warning: "Mailbox verification unavailable" }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error) {
    console.error("Error in validate-email-domain:", error);
    return new Response(
      // Fail-open on unexpected server errors so DNS outages don't block real users
      JSON.stringify({ valid: true, warning: "Validation unavailable" }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});
