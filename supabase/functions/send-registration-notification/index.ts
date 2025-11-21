import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NotificationRequest {
  eventId: string;
  guestData: {
    name: string;
    email: string;
    phone_number: string;
    organization?: string;
    job_title?: string;
    degree?: string;
    why_interested: string;
    what_to_gain?: string;
    heard_from?: string;
    questions?: string;
  };
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { eventId, guestData }: NotificationRequest = await req.json();
    
    console.log("Sending notification for event:", eventId);

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get event details and organizer info
    const { data: event, error: eventError } = await supabase
      .from("events")
      .select("title, host_email, created_by")
      .eq("id", eventId)
      .single();

    if (eventError || !event) {
      throw new Error("Event not found");
    }

    // Get organizer email from profiles if host_email not set
    let organizerEmail = event.host_email;
    if (!organizerEmail) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("user_id")
        .eq("user_id", event.created_by)
        .single();

      if (profile) {
        const { data: authUser } = await supabase.auth.admin.getUserById(event.created_by);
        organizerEmail = authUser?.user?.email;
      }
    }

    if (!organizerEmail) {
      console.error("No organizer email found");
      throw new Error("Organizer email not found");
    }

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #3b82f6;">📬 New Registration for ${event.title}</h1>
        
        <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h2 style="margin-top: 0;">Attendee Information</h2>
          <p><strong>Name:</strong> ${guestData.name}</p>
          <p><strong>Email:</strong> ${guestData.email}</p>
          <p><strong>Phone:</strong> ${guestData.phone_number}</p>
          ${guestData.organization ? `<p><strong>Organization:</strong> ${guestData.organization}</p>` : ""}
          ${guestData.job_title ? `<p><strong>Job Title:</strong> ${guestData.job_title}</p>` : ""}
          ${guestData.degree ? `<p><strong>Education:</strong> ${guestData.degree}</p>` : ""}
        </div>

        <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0;">Why They're Interested</h3>
          <p>${guestData.why_interested}</p>
          ${guestData.what_to_gain ? `
            <h3>What They Hope to Gain</h3>
            <p>${guestData.what_to_gain}</p>
          ` : ""}
          ${guestData.heard_from ? `<p><strong>Heard From:</strong> ${guestData.heard_from}</p>` : ""}
          ${guestData.questions ? `
            <h3>Questions for You</h3>
            <p>${guestData.questions}</p>
          ` : ""}
        </div>

        <div style="margin: 30px 0;">
          <p>Log in to your dashboard to approve or manage this registration.</p>
        </div>

        <p style="margin-top: 30px; color: #6b7280;">EventEase Notifications</p>
      </div>
    `;

    const emailResponse = await resend.emails.send({
      from: "EventEase <onboarding@resend.dev>",
      to: [organizerEmail],
      subject: `📬 New Registration: ${guestData.name} for ${event.title}`,
      html: htmlContent,
    });

    console.log("Notification email sent:", emailResponse);

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in send-registration-notification:", error);
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
