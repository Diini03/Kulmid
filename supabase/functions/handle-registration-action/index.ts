import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

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

    let subject = "";
    let htmlContent = "";

    const safeGuestName = escapeHtml(guest.name);
    const safeEventTitle = escapeHtml(guest.events.title);
    const safeEventLocation = escapeHtml(guest.events.location);
    const safeRejectionReason = escapeHtml(rejectionReason);

    if (action === "approve") {
      const checkInToken = generateCheckInToken();
      const checkInUrl = `https://www.kulmid.com/check-in/${checkInToken}`;
      const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&format=png&data=${encodeURIComponent(checkInUrl)}`;

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
      const eventUrl = `https://www.kulmid.com/events/${guest.events.id}`;

      subject = `✅ Registration confirmed — ${safeEventTitle}`;
      htmlContent = `<!DOCTYPE html>
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
                  <td align="right"><span style="display:inline-block; padding:4px 10px; border-radius:999px; background-color:#ecfdf5; color:#059669; font-size:12px; line-height:16px; font-weight:600;">Confirmed</span></td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:8px 24px 0 24px;">
              <h1 style="margin:0 0 8px 0; font-size:24px; line-height:30px; font-weight:700; color:#111827;">Registration confirmed</h1>
              <p style="margin:0 0 16px 0; font-size:14px; line-height:22px; color:#6b7280;">Hi ${safeGuestName}, your spot has been confirmed for the event below.</p>
            </td>
          </tr>
          <tr>
            <td style="padding:0 24px 16px 24px;">
              <div style="font-size:18px; line-height:24px; font-weight:700; color:#111827;">${safeEventTitle}</div>
            </td>
          </tr>
          <tr>
            <td style="padding:0 24px 16px 24px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#f9fafb; border:1px solid #e5e7eb; border-radius:12px;">
                <tr><td style="padding:14px 16px 6px 16px; font-size:14px; line-height:20px; font-weight:600; color:#111827;">Event details</td></tr>
                <tr>
                  <td style="padding:0 16px 14px 16px;">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                      <tr><td style="padding:6px 0; font-size:13px; color:#6b7280;">Date</td><td align="right" style="padding:6px 0; font-size:13px; color:#111827;">${eventDate}</td></tr>
                      <tr><td style="padding:6px 0; font-size:13px; color:#6b7280;">Time</td><td align="right" style="padding:6px 0; font-size:13px; color:#111827;">${eventTime}</td></tr>
                      <tr><td style="padding:6px 0; font-size:13px; color:#6b7280;">Location</td><td align="right" style="padding:6px 0; font-size:13px; color:#111827;">${safeEventLocation}</td></tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:0 24px 16px 24px;">
              <p style="margin:0; font-size:14px; line-height:22px; color:#6b7280;">Save your QR pass below — you'll need it for check-in.</p>
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
              <p style="margin:0 0 4px 0; font-size:11px; line-height:18px; color:#9ca3af;">You received this email because you registered for an event on Kulmid.</p>
              <p style="margin:0; font-size:11px; line-height:18px; color:#9ca3af;">Need help? Contact support at kulmid2025@gmail.com</p>
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
                  <td align="right"><span style="display:inline-block; padding:4px 10px; border-radius:999px; background-color:#fef2f2; color:#dc2626; font-size:12px; line-height:16px; font-weight:600;">Not Approved</span></td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:8px 24px 0 24px;">
              <h1 style="margin:0 0 8px 0; font-size:24px; line-height:30px; font-weight:700; color:#111827;">Registration not approved</h1>
              <p style="margin:0 0 16px 0; font-size:14px; line-height:22px; color:#6b7280;">Hi ${safeGuestName}, unfortunately your registration for <strong style="color:#111827;">${safeEventTitle}</strong> was not approved.</p>
            </td>
          </tr>
          ${safeRejectionReason ? `
          <tr>
            <td style="padding:0 24px 16px 24px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#fef2f2; border:1px solid #fecaca; border-radius:12px;">
                <tr><td style="padding:12px 16px; font-size:13px; line-height:20px; color:#991b1b;"><strong style="color:#dc2626;">Reason:</strong><br/>${safeRejectionReason}</td></tr>
              </table>
            </td>
          </tr>` : ''}
          <tr>
            <td style="padding:0 24px 20px 24px;">
              <p style="margin:0; font-size:14px; line-height:22px; color:#6b7280;">If you have any questions, please contact the event organizer.</p>
            </td>
          </tr>
          <tr><td style="padding:0 24px;"><div style="height:1px; background-color:#e5e7eb;"></div></td></tr>
          <tr>
            <td style="padding:16px 24px 20px 24px;">
              <p style="margin:0 0 4px 0; font-size:11px; line-height:18px; color:#9ca3af;">You received this email because you registered for an event on Kulmid.</p>
              <p style="margin:0; font-size:11px; line-height:18px; color:#9ca3af;">Need help? Contact support at kulmid2025@gmail.com</p>
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
