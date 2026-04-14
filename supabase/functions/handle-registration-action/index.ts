import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";
import QRCode from "npm:qrcode@1.5.3";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ActionRequest {
  guestId: string;
  action: "approve" | "reject";
  rejectionReason?: string;
}

const escapeHtml = (str: string | null | undefined): string => {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
};

const generateCheckInToken = (): string => {
  return crypto.randomUUID();
};

// Send email using Resend API
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
    // ============ AUTHENTICATION CHECK ============
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      console.error("No authorization header provided");
      return new Response(
        JSON.stringify({ error: "Unauthorized: No authorization header" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    
    const supabaseAuth = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: `Bearer ${token}` } }
    });
    
    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser(token);
    
    if (authError || !user) {
      console.error("Authentication failed:", authError?.message);
      return new Response(
        JSON.stringify({ error: "Unauthorized: Invalid token" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log(`Authenticated user: ${user.id}`);
    // ============ END AUTHENTICATION CHECK ============

    const { guestId, action, rejectionReason }: ActionRequest = await req.json();
    
    if (!guestId || typeof guestId !== 'string') {
      return new Response(
        JSON.stringify({ error: "Invalid guestId" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }
    
    if (!action || !['approve', 'reject'].includes(action)) {
      return new Response(
        JSON.stringify({ error: "Invalid action" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }
    
    console.log(`Processing ${action} for guest:`, guestId);

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: guest, error: guestError } = await supabase
      .from("event_guests")
      .select("*, events!inner(id, title, date, location, created_by)")
      .eq("id", guestId)
      .single();

    if (guestError || !guest) {
      console.error("Guest not found:", guestError?.message);
      return new Response(
        JSON.stringify({ error: "Guest not found" }),
        { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // ============ AUTHORIZATION CHECK ============
    const { data: userRole } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .single();

    const isAdmin = !!userRole;
    const isEventOwner = guest.events.created_by === user.id;

    if (!isAdmin && !isEventOwner) {
      console.error(`User ${user.id} is not authorized to manage registrations for event ${guest.events.id}`);
      return new Response(
        JSON.stringify({ error: "Forbidden: You don't have permission to manage this event's registrations" }),
        { status: 403, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }
    
    console.log(`Authorization passed: isAdmin=${isAdmin}, isEventOwner=${isEventOwner}`);
    // ============ END AUTHORIZATION CHECK ============

    let subject = "";
    let htmlContent = "";

    const safeGuestName = escapeHtml(guest.name);
    const safeEventTitle = escapeHtml(guest.events.title);
    const safeEventLocation = escapeHtml(guest.events.location);
    const safeRejectionReason = escapeHtml(rejectionReason);

    if (action === "approve") {
      const checkInToken = generateCheckInToken();
      const checkInUrl = `https://kulmid.lovable.app/check-in/${checkInToken}`;
      const qrCodeDataUrl = await QRCode.toDataURL(checkInUrl, {
        width: 300,
        margin: 2,
        color: { dark: "#000000", light: "#FFFFFF" },
      });

      const { error: updateError } = await supabase
        .from("event_guests")
        .update({
          status: "registered",
          rsvp_at: new Date().toISOString(),
          check_in_token: checkInToken,
        })
        .eq("id", guestId);

      if (updateError) throw updateError;

      const eventDateObj = new Date(guest.events.date);
      const eventDate = eventDateObj.toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' });
      const eventTime = eventDateObj.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
      const eventUrl = `https://kulmid.lovable.app/events/${guest.events.id}`;

      subject = `✅ Registration confirmed — ${safeEventTitle}`;
      htmlContent = `<!DOCTYPE html>
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
                  <td align="right"><span style="display:inline-block; padding:6px 10px; border-radius:999px; background-color:#0f2f2b; color:#6ee7d8; font-size:12px; line-height:12px; font-weight:600; letter-spacing:0.2px;">Confirmed</span></td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:8px 28px 0 28px;">
              <h1 style="margin:0 0 10px 0; font-size:30px; line-height:36px; font-weight:700; color:#ffffff;">Registration confirmed</h1>
              <p style="margin:0 0 24px 0; font-size:15px; line-height:24px; color:#9aa4b2;">Hi ${safeGuestName}, your spot has been confirmed for the event below.</p>
            </td>
          </tr>
          <tr>
            <td style="padding:0 28px 24px 28px;">
              <div style="font-size:20px; line-height:28px; font-weight:700; color:#ffffff;">${safeEventTitle}</div>
            </td>
          </tr>
          <tr>
            <td style="padding:0 28px 20px 28px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#171b21; border:1px solid #262c35; border-radius:16px;">
                <tr><td style="padding:20px 20px 8px 20px; font-size:15px; line-height:22px; font-weight:600; color:#ffffff;">Event details</td></tr>
                <tr>
                  <td style="padding:0 20px 18px 20px;">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                      <tr><td style="padding:8px 0; font-size:13px; line-height:20px; color:#7f8a99;">Date</td><td align="right" style="padding:8px 0; font-size:14px; line-height:20px; color:#e5e7eb;">${eventDate}</td></tr>
                      <tr><td style="padding:8px 0; font-size:13px; line-height:20px; color:#7f8a99;">Time</td><td align="right" style="padding:8px 0; font-size:14px; line-height:20px; color:#e5e7eb;">${eventTime}</td></tr>
                      <tr><td style="padding:8px 0; font-size:13px; line-height:20px; color:#7f8a99;">Location</td><td align="right" style="padding:8px 0; font-size:14px; line-height:20px; color:#e5e7eb;">${safeEventLocation}</td></tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:0 28px 24px 28px;">
              <p style="margin:0; font-size:15px; line-height:25px; color:#9aa4b2;">Save your QR pass below. You'll need it for a smooth check-in at the event.</p>
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
              <p style="margin:0 0 8px 0; font-size:12px; line-height:20px; color:#6b7280;">You received this email because you registered for an event on Kulmid.</p>
              <p style="margin:0; font-size:12px; line-height:20px; color:#6b7280;">Need help? Contact support at kulmid@gmail.com</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
    } else {
      // Rejection
      const { error: updateError } = await supabase
        .from("event_guests")
        .update({
          status: "rejected",
          notes: rejectionReason || null,
        })
        .eq("id", guestId);

      if (updateError) throw updateError;

      subject = `Registration update — ${safeEventTitle}`;
      htmlContent = `<!DOCTYPE html>
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
                  <td align="right"><span style="display:inline-block; padding:6px 10px; border-radius:999px; background-color:#2f1f1f; color:#f87171; font-size:12px; line-height:12px; font-weight:600; letter-spacing:0.2px;">Not Approved</span></td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:8px 28px 0 28px;">
              <h1 style="margin:0 0 10px 0; font-size:30px; line-height:36px; font-weight:700; color:#ffffff;">Registration not approved</h1>
              <p style="margin:0 0 24px 0; font-size:15px; line-height:24px; color:#9aa4b2;">Hi ${safeGuestName}, unfortunately your registration for <strong style="color:#ffffff;">${safeEventTitle}</strong> was not approved.</p>
            </td>
          </tr>
          ${safeRejectionReason ? `
          <tr>
            <td style="padding:0 28px 24px 28px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#1c1517; border:1px solid #3b2020; border-radius:16px;">
                <tr><td style="padding:16px 20px; font-size:14px; line-height:22px; color:#fca5a5;"><strong style="color:#f87171;">Reason:</strong><br/>${safeRejectionReason}</td></tr>
              </table>
            </td>
          </tr>` : ''}
          <tr>
            <td style="padding:0 28px 32px 28px;">
              <p style="margin:0; font-size:15px; line-height:25px; color:#9aa4b2;">If you have any questions, please contact the event organizer.</p>
            </td>
          </tr>
          <tr><td style="padding:0 28px;"><div style="height:1px; background-color:#1f242b;"></div></td></tr>
          <tr>
            <td style="padding:20px 28px 28px 28px;">
              <p style="margin:0 0 8px 0; font-size:12px; line-height:20px; color:#6b7280;">You received this email because you registered for an event on Kulmid.</p>
              <p style="margin:0; font-size:12px; line-height:20px; color:#6b7280;">Need help? Contact support at kulmid@gmail.com</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
    }

    await sendEmailWithResend(guest.email, subject, htmlContent);

    console.log(`${action} processed successfully for guest:`, guestId);

    return new Response(
      JSON.stringify({ success: true, status: action === "approve" ? "registered" : "rejected" }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in handle-registration-action:", error);
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