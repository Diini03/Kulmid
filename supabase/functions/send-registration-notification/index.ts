import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// HTML escape function to prevent XSS in emails
const escapeHtml = (str: string | null | undefined): string => {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
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

// Send email using Mailjet API
const sendEmailWithMailjet = async (to: string, subject: string, htmlContent: string) => {
  const apiKey = Deno.env.get("MAILJET_API_KEY")!;
  const secretKey = Deno.env.get("MAILJET_SECRET_KEY")!;

  const response = await fetch("https://api.mailjet.com/v3.1/send", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": "Basic " + btoa(`${apiKey}:${secretKey}`),
    },
    body: JSON.stringify({
      Messages: [{
        From: { Email: "asadcade401@gmail.com", Name: "Kulmid Events" },
        To: [{ Email: to }],
        Subject: subject,
        HTMLPart: htmlContent,
      }],
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    console.error("Mailjet API error:", error);
    throw new Error(`Failed to send email: ${JSON.stringify(error)}`);
  }

  return await response.json();
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify authentication
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      console.error("No authorization header provided");
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Create authenticated client to verify user
    const supabaseAuth = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser();
    if (authError || !user) {
      console.error("Authentication failed:", authError?.message);
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const { eventId, guestData }: NotificationRequest = await req.json();

    // Input validation
    if (!eventId || typeof eventId !== 'string') {
      return new Response(
        JSON.stringify({ error: "Invalid eventId" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    if (!guestData || !guestData.name || !guestData.email) {
      return new Response(
        JSON.stringify({ error: "Invalid guest data" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log("Sending notification for event:", eventId, "by user:", user.id);

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get event details and verify user is authorized
    const { data: event, error: eventError } = await supabase
      .from("events")
      .select("title, host_email, created_by")
      .eq("id", eventId)
      .single();

    if (eventError || !event) {
      console.error("Event not found:", eventError?.message);
      return new Response(
        JSON.stringify({ error: "Event not found" }),
        { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Verify caller is the event owner or an admin
    const { data: isAdmin } = await supabase.rpc('has_role', { _user_id: user.id, _role: 'admin' });
    
    if (event.created_by !== user.id && !isAdmin) {
      console.error("User not authorized to send notifications for this event");
      return new Response(
        JSON.stringify({ error: "Forbidden" }),
        { status: 403, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
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
      return new Response(
        JSON.stringify({ error: "Organizer email not found" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Escape all user-provided content
    const safeName = escapeHtml(guestData.name);
    const safeEmail = escapeHtml(guestData.email);
    const safePhone = escapeHtml(guestData.phone_number);
    const safeOrganization = escapeHtml(guestData.organization);
    const safeJobTitle = escapeHtml(guestData.job_title);
    const safeDegree = escapeHtml(guestData.degree);
    const safeWhyInterested = escapeHtml(guestData.why_interested);
    const safeWhatToGain = escapeHtml(guestData.what_to_gain);
    const safeHeardFrom = escapeHtml(guestData.heard_from);
    const safeQuestions = escapeHtml(guestData.questions);
    const safeEventTitle = escapeHtml(event.title);

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #3b82f6;">📬 New Registration for ${safeEventTitle}</h1>
        
        <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h2 style="margin-top: 0;">Attendee Information</h2>
          <p><strong>Name:</strong> ${safeName}</p>
          <p><strong>Email:</strong> ${safeEmail}</p>
          <p><strong>Phone:</strong> ${safePhone}</p>
          ${safeOrganization ? `<p><strong>Organization:</strong> ${safeOrganization}</p>` : ""}
          ${safeJobTitle ? `<p><strong>Job Title:</strong> ${safeJobTitle}</p>` : ""}
          ${safeDegree ? `<p><strong>Education:</strong> ${safeDegree}</p>` : ""}
        </div>

        <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0;">Why They're Interested</h3>
          <p>${safeWhyInterested}</p>
          ${safeWhatToGain ? `
            <h3>What They Hope to Gain</h3>
            <p>${safeWhatToGain}</p>
          ` : ""}
          ${safeHeardFrom ? `<p><strong>Heard From:</strong> ${safeHeardFrom}</p>` : ""}
          ${safeQuestions ? `
            <h3>Questions for You</h3>
            <p>${safeQuestions}</p>
          ` : ""}
        </div>

        <div style="margin: 30px 0;">
          <p>Log in to your dashboard to approve or manage this registration.</p>
        </div>

        <p style="margin-top: 30px; color: #6b7280;">Kulmid Notifications</p>
      </div>
    `;

    const emailResponse = await sendEmailWithMailjet(
      organizerEmail,
      `📬 New Registration: ${safeName} for ${safeEventTitle}`,
      htmlContent
    );

    console.log("Notification email sent:", emailResponse);

    // Create in-app notification for the event owner
    const { error: notificationError } = await supabase
      .from("notifications")
      .insert({
        user_id: event.created_by,
        type: "registration",
        title: `${safeName} registered for your event`,
        message: `New registration for "${event.title}"`,
        event_id: eventId,
        actor_name: guestData.name,
        actor_email: guestData.email,
      });

    if (notificationError) {
      console.error("Error creating notification:", notificationError);
    }

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in send-registration-notification:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
