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

    // Check if domain has MX records (can receive email)
    try {
      const mxRecords = await Deno.resolveDns(domain, "MX");
      if (mxRecords && mxRecords.length > 0) {
        return new Response(
          JSON.stringify({ valid: true }),
          { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      } else {
        return new Response(
          JSON.stringify({ valid: false, reason: "This email address doesn't exist" }),
          { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }
    } catch (dnsError) {
      // DNS resolution failed — domain doesn't exist
      console.log("DNS resolution failed for domain:", domain, dnsError);
      return new Response(
        JSON.stringify({ valid: false, reason: "This email address doesn't exist" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }
  } catch (error) {
    console.error("Error in validate-email-domain:", error);
    return new Response(
      // Fail-open on unexpected server errors so DNS outages don't block real users
      JSON.stringify({ valid: true, warning: "Validation unavailable" }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});
