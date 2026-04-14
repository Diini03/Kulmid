import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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

const sendEmailWithResend = async (to: string, subject: string, htmlContent: string) => {
  const apiKey = Deno.env.get("RESEND_API_KEY")!;

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      from: "Kulmid Events <noreply@kulmid.com>",
      to: [to],
      subject,
      html: htmlContent,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    console.error("Resend API error:", error);
    throw new Error(`Failed to send email: ${JSON.stringify(error)}`);
  }

  return await response.json();
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      console.error("No authorization header provided");
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

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

    const { data: isAdmin } = await supabase.rpc('has_role', { _user_id: user.id, _role: 'admin' });
    
    if (event.created_by !== user.id && !isAdmin) {
      console.error("User not authorized to send notifications for this event");
      return new Response(
        JSON.stringify({ error: "Forbidden" }),
        { status: 403, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

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

    const detailRow = (label: string, value: string) => value ? `
      <tr><td style="padding:4px 0; font-size:13px; color:#6b7280;">${label}</td><td style="padding:4px 0 4px 12px; font-size:13px; color:#111827;">${value}</td></tr>` : '';

    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /></head>
<body style="margin:0; padding:0; background-color:#f4f4f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color:#111827;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#f4f4f5;">
    <tr>
      <td align="center" style="padding:24px 16px;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:560px; margin:0 auto; background-color:#ffffff; border:1px solid #e5e7eb; border-radius:16px; overflow:hidden;">
          <tr>
            <td style="padding:20px 24px 10px 24px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td align="left" style="font-size:18px; line-height:24px; font-weight:700; color:#111827;">Kulmid</td>
                  <td align="right"><span style="display:inline-block; padding:4px 10px; border-radius:999px; background-color:#eff6ff; color:#2563eb; font-size:12px; line-height:16px; font-weight:600;">New Registration</span></td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:8px 24px 0 24px;">
              <h1 style="margin:0 0 8px 0; font-size:24px; line-height:30px; font-weight:700; color:#111827;">New registration</h1>
              <p style="margin:0 0 16px 0; font-size:14px; line-height:22px; color:#6b7280;">${safeName} registered for <strong style="color:#111827;">${safeEventTitle}</strong>.</p>
            </td>
          </tr>
          <tr>
            <td style="padding:0 24px 16px 24px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#f9fafb; border:1px solid #e5e7eb; border-radius:12px;">
                <tr><td colspan="2" style="padding:14px 16px 6px 16px; font-size:14px; line-height:20px; font-weight:600; color:#111827;">Attendee information</td></tr>
                <tr>
                  <td colspan="2" style="padding:0 16px 14px 16px;">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                      ${detailRow('Name', safeName)}
                      ${detailRow('Email', safeEmail)}
                      ${detailRow('Phone', safePhone)}
                      ${detailRow('Organization', safeOrganization)}
                      ${detailRow('Job Title', safeJobTitle)}
                      ${detailRow('Education', safeDegree)}
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          ${safeWhyInterested || safeWhatToGain || safeHeardFrom || safeQuestions ? `
          <tr>
            <td style="padding:0 24px 16px 24px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#f9fafb; border:1px solid #e5e7eb; border-radius:12px;">
                <tr><td style="padding:14px 16px 6px 16px; font-size:14px; line-height:20px; font-weight:600; color:#111827;">Their responses</td></tr>
                <tr>
                  <td style="padding:0 16px 14px 16px;">
                    ${safeWhyInterested ? `<p style="margin:0 0 8px 0; font-size:13px; line-height:20px; color:#6b7280;"><strong style="color:#374151;">Why interested:</strong> ${safeWhyInterested}</p>` : ''}
                    ${safeWhatToGain ? `<p style="margin:0 0 8px 0; font-size:13px; line-height:20px; color:#6b7280;"><strong style="color:#374151;">What to gain:</strong> ${safeWhatToGain}</p>` : ''}
                    ${safeHeardFrom ? `<p style="margin:0 0 8px 0; font-size:13px; line-height:20px; color:#6b7280;"><strong style="color:#374151;">Heard from:</strong> ${safeHeardFrom}</p>` : ''}
                    ${safeQuestions ? `<p style="margin:0; font-size:13px; line-height:20px; color:#6b7280;"><strong style="color:#374151;">Questions:</strong> ${safeQuestions}</p>` : ''}
                  </td>
                </tr>
              </table>
            </td>
          </tr>` : ''}
          <tr>
            <td style="padding:0 24px 20px 24px;">
              <p style="margin:0; font-size:13px; line-height:20px; color:#6b7280;">Log in to your dashboard to approve or manage this registration.</p>
            </td>
          </tr>
          <tr><td style="padding:0 24px;"><div style="height:1px; background-color:#e5e7eb;"></div></td></tr>
          <tr>
            <td style="padding:16px 24px 20px 24px;">
              <p style="margin:0; font-size:11px; line-height:18px; color:#9ca3af;">Kulmid Notifications</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

    const emailResponse = await sendEmailWithResend(
      organizerEmail,
      `📬 New Registration: ${safeName} for ${safeEventTitle}`,
      htmlContent
    );

    console.log("Notification email sent:", emailResponse);

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
