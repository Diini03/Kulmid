import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

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

const escapeHtml = (text: string): string => {
  const htmlEntities: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  };
  return text.replace(/[&<>"']/g, (char) => htmlEntities[char] || char);
};

const generateCheckInToken = (): string => {
  return crypto.randomUUID();
};

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
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const supabaseAuth = createClient(
      supabaseUrl,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabaseAuth.auth.getUser();
    
    if (userError || !user) {
      console.error("Auth error:", userError);
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const userId = user.id;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { eventId, emails, customTitle, customMessage }: InvitationRequest = await req.json();

    console.log(`Sending invitations for event ${eventId} to ${emails.length} recipients`);

    const { data: event, error: eventError } = await supabase
      .from("events")
      .select("*")
      .eq("id", eventId)
      .eq("created_by", userId)
      .single();

    if (eventError || !event) {
      throw new Error("Event not found or unauthorized");
    }

    const eventDateObj = new Date(event.date);
    const formattedDate = eventDateObj.toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' });
    const formattedTime = eventDateObj.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    const eventUrl = `https://www.kulmid.com/events/${eventId}`;
    const safeCustomMessage = customMessage ? escapeHtml(customMessage) : null;
    const safeTitle = escapeHtml(event.title);
    const safeLocation = escapeHtml(event.location);
    const safeHostName = event.host_name ? escapeHtml(event.host_name) : null;
    
    const results = [];
    
    for (const email of emails) {
      try {
        const { data: guestData, error: guestError } = await supabase
          .from("event_guests")
          .upsert({
            event_id: eventId,
            email: email,
            name: email.split("@")[0],
            status: "registered",
            registration_type: "invitation",
            rsvp_at: new Date().toISOString(),
          }, {
            onConflict: "event_id,email",
            ignoreDuplicates: false,
          })
          .select()
          .single();

        if (guestError) {
          console.error("Guest upsert error:", guestError);
          throw guestError;
        }

        const checkInToken = generateCheckInToken();
        const checkInUrl = `https://www.kulmid.com/check-in/${checkInToken}`;
        const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&format=png&data=${encodeURIComponent(checkInUrl)}`;

        await supabase
          .from("event_guests")
          .update({ check_in_token: checkInToken })
          .eq("id", guestData.id);

        const safeGuestName = escapeHtml(email.split("@")[0]);
        const invitationMessage = safeCustomMessage || `You've been personally invited to join this event. We'd love to see you there!`;

        const emailSubject = customTitle || `You're invited — ${safeTitle}`;
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
                  <td align="right"><span style="display:inline-block; padding:4px 10px; border-radius:999px; background-color:#f0fdfa; color:#0d9488; font-size:12px; line-height:16px; font-weight:600;">Invitation</span></td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:8px 24px 0 24px;">
              <h1 style="margin:0 0 8px 0; font-size:24px; line-height:30px; font-weight:700; color:#111827;">You're invited</h1>
              <p style="margin:0 0 16px 0; font-size:14px; line-height:22px; color:#6b7280;">Hi ${safeGuestName}, you've been invited to the following event on Kulmid.</p>
            </td>
          </tr>
          <tr>
            <td style="padding:0 24px 16px 24px;">
              <div style="font-size:18px; line-height:24px; font-weight:700; color:#111827;">${safeTitle}</div>
            </td>
          </tr>
          <tr>
            <td style="padding:0 24px 16px 24px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#f9fafb; border:1px solid #e5e7eb; border-radius:12px;">
                <tr><td style="padding:14px 16px 6px 16px; font-size:14px; line-height:20px; font-weight:600; color:#111827;">Event details</td></tr>
                <tr>
                  <td style="padding:0 16px 14px 16px;">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                      <tr><td style="padding:6px 0; font-size:13px; color:#6b7280;">Date</td><td align="right" style="padding:6px 0; font-size:13px; color:#111827;">${formattedDate}</td></tr>
                      <tr><td style="padding:6px 0; font-size:13px; color:#6b7280;">Time</td><td align="right" style="padding:6px 0; font-size:13px; color:#111827;">${formattedTime}</td></tr>
                      <tr><td style="padding:6px 0; font-size:13px; color:#6b7280;">Location</td><td align="right" style="padding:6px 0; font-size:13px; color:#111827;">${safeLocation}</td></tr>
                      <tr><td style="padding:6px 0; font-size:13px; color:#6b7280;">Organizer</td><td align="right" style="padding:6px 0; font-size:13px; color:#111827;">${safeHostName || 'Event Organizer'}</td></tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:0 24px 16px 24px;">
              <p style="margin:0; font-size:14px; line-height:22px; color:#6b7280;">${invitationMessage}</p>
            </td>
          </tr>
          <tr>
            <td style="padding:0 24px 16px 24px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#f0fdfa; border:1px solid #ccfbf1; border-radius:14px;">
                <tr><td align="center" style="padding:16px 16px 8px 16px;"><div style="font-size:11px; line-height:16px; letter-spacing:0.8px; text-transform:uppercase; color:#0d9488; font-weight:700;">Check-in pass</div></td></tr>
                <tr><td align="center" style="padding:4px 16px 8px 16px;"><img src="${qrImageUrl}" alt="QR Code" width="160" height="160" style="display:block; width:160px; height:160px; border-radius:10px; border:1px solid #e5e7eb;" /></td></tr>
                <tr><td align="center" style="padding:0 16px 16px 16px; font-size:12px; line-height:18px; color:#6b7280;">Present this code when you arrive.</td></tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:0 24px 20px 24px;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                <tr><td align="center" style="border-radius:10px; background-color:#14b8a6;"><a href="${eventUrl}" target="_blank" style="display:inline-block; padding:12px 20px; font-size:14px; line-height:14px; font-weight:600; color:#ffffff; text-decoration:none; border-radius:10px;">View event</a></td></tr>
              </table>
            </td>
          </tr>
          <tr><td style="padding:0 24px;"><div style="height:1px; background-color:#e5e7eb;"></div></td></tr>
          <tr>
            <td style="padding:16px 24px 20px 24px;">
              <p style="margin:0 0 4px 0; font-size:11px; line-height:18px; color:#9ca3af;">You received this email because an event organizer invited you through Kulmid.</p>
              <p style="margin:0; font-size:11px; line-height:18px; color:#9ca3af;">Need help? Contact support at kulmid2025@gmail.com</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

        const emailResponse = await sendEmailWithResend(email, emailSubject, htmlContent);

        console.log("Email sent to:", email, emailResponse);

        await supabase.from("event_invitations").insert({
          event_id: eventId,
          email: email,
          custom_title: customTitle,
          custom_message: customMessage,
          created_by: userId,
          status: "sent",
        });

        const { data: invitedUser } = await supabase.auth.admin.getUserByEmail(email);
        
        if (invitedUser?.user) {
          const { error: notificationError } = await supabase
            .from("notifications")
            .insert({
              user_id: invitedUser.user.id,
              type: "invitation",
              title: `You're invited to ${safeTitle}`,
              message: `${safeHostName || "An organizer"} invited you to their event`,
              event_id: eventId,
              actor_name: event.host_name || null,
              actor_email: event.host_email || null,
            });

          if (notificationError) {
            console.error("Error creating notification for invited user:", notificationError);
          }
        }

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
