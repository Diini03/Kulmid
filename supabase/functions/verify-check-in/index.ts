import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface CheckInRequest {
  token: string;
  eventId: string;
  organizerId?: string;
  action: "verify" | "confirm";
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const body: CheckInRequest = await req.json();
    const { token, eventId, organizerId, action = "verify" } = body;

    if (!token) {
      return new Response(
        JSON.stringify({ error: "Token is required" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    if (!eventId) {
      return new Response(
        JSON.stringify({ error: "Event ID is required" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log(`[verify-check-in] action=${action}, token=${token}, eventId=${eventId}`);

    // Load event to check expiry — QR codes stop working after the event ends (+24h grace).
    const { data: event, error: eventError } = await supabase
      .from("events")
      .select("date, end_date, status")
      .eq("id", eventId)
      .single();

    if (eventError || !event) {
      return new Response(
        JSON.stringify({ status: "invalid", error: "Event not found" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const eventEnd = event.end_date
      ? new Date(event.end_date as string)
      : new Date(new Date(event.date as string).getTime() + 24 * 60 * 60 * 1000);
    const isExpired = new Date() > eventEnd || event.status === "past" || event.status === "rejected";

    if (isExpired) {
      return new Response(
        JSON.stringify({
          status: "expired",
          error: "Check-in is closed — this event has ended.",
        }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Find guest by token
    const { data: guest, error: guestError } = await supabase
      .from("event_guests")
      .select("*")
      .eq("check_in_token", token)
      .single();

    if (guestError || !guest) {
      console.error("Guest not found:", guestError);
      return new Response(
        JSON.stringify({ status: "invalid", error: "Invalid or unknown QR code" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Verify token belongs to this event
    if (guest.event_id !== eventId) {
      return new Response(
        JSON.stringify({ status: "invalid", error: "This QR code belongs to a different event" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Verify guest is approved
    if (guest.status !== "registered" && guest.status !== "invited") {
      return new Response(
        JSON.stringify({ status: "invalid", error: "Registration not approved" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Check if already checked in
    if (guest.checked_in) {
      return new Response(
        JSON.stringify({
          status: "already_checked_in",
          guest: {
            id: guest.id,
            name: guest.name,
            email: guest.email,
            organization: guest.organization,
          },
          checked_in_at: guest.checked_in_at,
        }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // ACTION: verify — just return guest info, don't check in
    if (action === "verify") {
      return new Response(
        JSON.stringify({
          status: "valid",
          guest: {
            id: guest.id,
            name: guest.name,
            email: guest.email,
            organization: guest.organization,
            registration_status: guest.status,
          },
        }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // ACTION: confirm — perform check-in
    const { error: updateError } = await supabase
      .from("event_guests")
      .update({
        checked_in: true,
        checked_in_at: new Date().toISOString(),
        checked_in_by: organizerId || null,
      })
      .eq("id", guest.id);

    if (updateError) {
      console.error("Failed to check in guest:", updateError);
      return new Response(
        JSON.stringify({ status: "error", error: "Failed to check in guest" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log("Successfully checked in guest:", guest.name);

    return new Response(
      JSON.stringify({
        status: "confirmed",
        guest: {
          id: guest.id,
          name: guest.name,
          email: guest.email,
          organization: guest.organization,
        },
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );

  } catch (error: any) {
    console.error("Error in verify-check-in:", error);
    return new Response(
      JSON.stringify({ status: "error", error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
