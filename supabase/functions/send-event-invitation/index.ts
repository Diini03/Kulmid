import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";
import QRCode from "npm:qrcode@1.5.3";

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
    const eventUrl = `https://kulmid.lovable.app/events/${eventId}`;
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
        const checkInUrl = `https://kulmid.lovable.app/check-in/${checkInToken}`;
        const qrCodeDataUrl = await QRCode.toDataURL(checkInUrl, {
          width: 300,
          margin: 2,
          color: { dark: "#000000", light: "#FFFFFF" },
        });

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
<body style="margin:0; padding:0; background-color:#0b0d10; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color:#ffffff;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#0b0d10; margin:0; padding:0; width:100%;">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:600px; margin:0 auto; background-color:#111418; border:1px solid #1f242b; border-radius:20px; overflow:hidden;">
          <tr>
            <td style="padding:24px 28px 12px 28px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td align="left" style="font-size:20px; line-height:28px; font-weight:700; color:#ffffff;">Kulmid</td>
                  <td align="right"><span style="display:inline-block; padding:6px 10px; border-radius:999px; background-color:#0f2f2b; color:#6ee7d8; font-size:12px; line-height:12px; font-weight:600; letter-spacing:0.2px;">Invitation</span></td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:8px 28px 0 28px;">
              <h1 style="margin:0 0 10px 0; font-size:30px; line-height:36px; font-weight:700; color:#ffffff;">You're invited</h1>
              <p style="margin:0 0 24px 0; font-size:15px; line-height:24px; color:#9aa4b2;">Hi ${safeGuestName}, you've been invited to the following event on Kulmid.</p>
            </td>
          </tr>
          <tr>
            <td style="padding:0 28px 24px 28px;">
              <div style="font-size:20px; line-height:28px; font-weight:700; color:#ffffff;">${safeTitle}</div>
            </td>
          </tr>
          <tr>
            <td style="padding:0 28px 24px 28px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#171b21; border:1px solid #262c35; border-radius:16px;">
                <tr><td style="padding:20px 20px 8px 20px; font-size:15px; line-height:22px; font-weight:600; color:#ffffff;">Event details</td></tr>
                <tr>
                  <td style="padding:0 20px 18px 20px;">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                      <tr><td style="padding:8px 0; font-size:13px; line-height:20px; color:#7f8a99;">Date</td><td align="right" style="padding:8px 0; font-size:14px; line-height:20px; color:#e5e7eb;">${formattedDate}</td></tr>
                      <tr><td style="padding:8px 0; font-size:13px; line-height:20px; color:#7f8a99;">Time</td><td align="right" style="padding:8px 0; font-size:14px; line-height:20px; color:#e5e7eb;">${formattedTime}</td></tr>
                      <tr><td style="padding:8px 0; font-size:13px; line-height:20px; color:#7f8a99;">Location</td><td align="right" style="padding:8px 0; font-size:14px; line-height:20px; color:#e5e7eb;">${safeLocation}</td></tr>
                      <tr><td style="padding:8px 0; font-size:13px; line-height:20px; color:#7f8a99;">Organizer</td><td align="right" style="padding:8px 0; font-size:14px; line-height:20px; color:#e5e7eb;">${safeHostName || 'Event Organizer'}</td></tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:0 28px 28px 28px;">
              <p style="margin:0; font-size:15px; line-height:25px; color:#9aa4b2;">${invitationMessage}</p>
            </td>
          </tr>
          <tr>
            <td style="padding:0 28px 24px 28px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#14181d; border:1px solid #262c35; border-radius:18px;">
                <tr><td align="center" style="padding:20px 20px 10px 20px;"><div style="font-size:12px; line-height:18px; letter-spacing:0.8px; text-transform:uppercase; color:#6ee7d8; font-weight:700;">Check-in pass</div></td></tr>
                <tr><td align="center" style="padding:6px 20px 12px 20px;"><img src="${qrCodeDataUrl}" alt="QR Code" width="170" height="170" style="display:block; width:170px; height:170px; border-radius:12px; background:#ffffff; padding:8px;" /></td></tr>
                <tr><td align="center" style="padding:0 20px 22px 20px; font-size:13px; line-height:21px; color:#7f8a99;">Present this code when you arrive.</td></tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:0 28px 32px 28px;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                <tr><td align="center" style="border-radius:12px; background-color:#14b8a6;"><a href="${eventUrl}" target="_blank" style="display:inline-block; padding:14px 22px; font-size:14px; line-height:14px; font-weight:700; color:#08110f; text-decoration:none; border-radius:12px;">View event</a></td></tr>
              </table>
            </td>
          </tr>
          <tr><td style="padding:0 28px;"><div style="height:1px; background-color:#1f242b;"></div></td></tr>
          <tr>
            <td style="padding:20px 28px 28px 28px;">
              <p style="margin:0 0 8px 0; font-size:12px; line-height:20px; color:#6b7280;">You received this email because an event organizer invited you through Kulmid.</p>
              <p style="margin:0; font-size:12px; line-height:20px; color:#6b7280;">Need help? Contact support at kulmid@gmail.com</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

        const emailResponse = await sendEmailWithMailjet(email, emailSubject, htmlContent);

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