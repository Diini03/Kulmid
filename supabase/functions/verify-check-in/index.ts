import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CheckInRequest {
  token: string;
  organizerId: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Get token from query params or body
    const url = new URL(req.url);
    const token = url.searchParams.get("token") || (await req.json().catch(() => ({}))).token;
    const { organizerId } = await req.json().catch(() => ({ organizerId: null }));

    if (!token) {
      return new Response(
        JSON.stringify({ error: "Token is required" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log("Verifying check-in token:", token);

    // Find guest by token
    const { data: guest, error: guestError } = await supabase
      .from("event_guests")
      .select(`
        *,
        events!inner(
          id,
          title,
          date,
          location,
          created_by
        )
      `)
      .eq("check_in_token", token)
      .single();

    if (guestError || !guest) {
      console.error("Guest not found:", guestError);
      return new Response(
        JSON.stringify({ error: "Invalid or expired token" }),
        { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Verify guest is approved
    if (guest.status !== "registered" && guest.status !== "invited") {
      return new Response(
        JSON.stringify({ error: "Registration not approved" }),
        { status: 403, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // If organizerId provided, verify they own this event
    if (organizerId && guest.events.created_by !== organizerId) {
      return new Response(
        JSON.stringify({ error: "Unauthorized: You don't own this event" }),
        { status: 403, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Check if already checked in
    if (guest.checked_in) {
      return new Response(
        JSON.stringify({
          success: true,
          alreadyCheckedIn: true,
          message: `${guest.name} was already checked in`,
          checkedInAt: guest.checked_in_at,
          guest: {
            name: guest.name,
            email: guest.email,
            phone_number: guest.phone_number,
            organization: guest.organization,
          },
          event: {
            title: guest.events.title,
            date: guest.events.date,
            location: guest.events.location,
          }
        }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Perform check-in
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
        JSON.stringify({ error: "Failed to check in guest" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log("Successfully checked in guest:", guest.name);

    return new Response(
      JSON.stringify({
        success: true,
        alreadyCheckedIn: false,
        message: `Successfully checked in ${guest.name}`,
        guest: {
          name: guest.name,
          email: guest.email,
          phone_number: guest.phone_number,
          organization: guest.organization,
        },
        event: {
          title: guest.events.title,
          date: guest.events.date,
          location: guest.events.location,
        }
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );

  } catch (error: any) {
    console.error("Error in verify-check-in:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
