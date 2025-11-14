import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface InvitationRequest {
  eventId: string;
  emails: string[];
  customTitle?: string;
  customMessage?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Get user from auth header
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      throw new Error("Unauthorized");
    }

    const { eventId, emails, customTitle, customMessage }: InvitationRequest = await req.json();

    console.log(`Sending invitations for event ${eventId} to ${emails.length} recipients`);

    // Fetch event details
    const { data: event, error: eventError } = await supabase
      .from("events")
      .select("*")
      .eq("id", eventId)
      .eq("created_by", user.id)
      .single();

    if (eventError || !event) {
      throw new Error("Event not found or unauthorized");
    }

    const results = [];
    
    for (const email of emails) {
      try {
        // Send email via Resend
        const emailResponse = await resend.emails.send({
          from: "EventEase <onboarding@resend.dev>",
          to: [email],
          subject: customTitle || `You're invited to ${event.title}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h1 style="color: #333;">${event.title}</h1>
              ${customMessage ? `<p style="color: #666; margin: 20px 0;">${customMessage}</p>` : ''}
              
              <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <p style="margin: 10px 0;"><strong>Date:</strong> ${new Date(event.date).toLocaleDateString()}</p>
                <p style="margin: 10px 0;"><strong>Location:</strong> ${event.location || event.meeting_link || 'Online'}</p>
                ${event.description ? `<p style="margin: 10px 0;"><strong>About:</strong> ${event.description}</p>` : ''}
              </div>
              
              <p style="color: #666;">We look forward to seeing you there!</p>
              
              <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #999; font-size: 12px;">
                <p>Sent via EventEase</p>
              </div>
            </div>
          `,
        });

        console.log("Email sent to:", email, emailResponse);

        // Record invitation in database
        await supabase.from("event_invitations").insert({
          event_id: eventId,
          email: email,
          custom_title: customTitle,
          custom_message: customMessage,
          created_by: user.id,
          status: "sent",
        });

        // Add to guest list if not already there
        await supabase.from("event_guests").upsert({
          event_id: eventId,
          email: email,
          status: "invited",
        }, {
          onConflict: "event_id,email",
        });

        results.push({ email, success: true });
      } catch (error: any) {
        console.error(`Error sending to ${email}:`, error);
        results.push({ email, success: false, error: error.message });
      }
    }

    return new Response(JSON.stringify({ results }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in send-event-invitation:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
