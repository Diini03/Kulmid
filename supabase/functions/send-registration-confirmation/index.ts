import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ConfirmationEmailRequest {
  email: string;
  name: string;
  eventTitle: string;
  eventDate: string;
  eventLocation: string;
  status: "registered" | "pending";
  accountCreated?: boolean;
  guestId: string;
}

// HTML escape function to prevent injection
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
    // Authentication check - verify JWT token
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.error("Missing or invalid authorization header");
      return new Response(
        JSON.stringify({ error: "Unauthorized - missing authentication" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const supabaseAuth = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!);
    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser(token);

    if (authError || !user) {
      console.error("Authentication failed:", authError?.message);
      return new Response(
        JSON.stringify({ error: "Unauthorized - invalid token" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log("Authenticated user:", user.id);

    // Parse and validate request body
    const body = await req.json();
    const { email, name, eventTitle, eventDate, eventLocation, status, accountCreated, guestId } = body as ConfirmationEmailRequest;

    // Input validation
    if (!email || !name || !eventTitle || !eventDate || !eventLocation || !status || !guestId) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return new Response(
        JSON.stringify({ error: "Invalid email format" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Validate status
    if (status !== "registered" && status !== "pending") {
      return new Response(
        JSON.stringify({ error: "Invalid status value" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Use service role for database operations
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get guest and verify authorization
    const { data: guest, error: guestError } = await supabase
      .from("event_guests")
      .select("id, event_id, email")
      .eq("id", guestId)
      .single();

    if (guestError || !guest) {
      console.error("Guest not found:", guestError?.message);
      return new Response(
        JSON.stringify({ error: "Guest not found" }),
        { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Get event and verify user is the event owner or admin
    const { data: event, error: eventError } = await supabase
      .from("events")
      .select("id, created_by")
      .eq("id", guest.event_id)
      .single();

    if (eventError || !event) {
      console.error("Event not found:", eventError?.message);
      return new Response(
        JSON.stringify({ error: "Event not found" }),
        { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Check if user is event owner or admin
    const { data: isAdmin } = await supabase.rpc('has_role', { 
      _user_id: user.id, 
      _role: 'admin' 
    });

    const isEventOwner = event.created_by === user.id;

    if (!isEventOwner && !isAdmin) {
      console.error("User not authorized to send confirmation for this event");
      return new Response(
        JSON.stringify({ error: "Unauthorized - not event owner or admin" }),
        { status: 403, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log("Sending registration confirmation to:", email, "Status:", status, "Guest ID:", guestId);

    // Escape user-provided content for HTML
    const safeName = escapeHtml(name);
    const safeEventTitle = escapeHtml(eventTitle);
    const safeEventDate = escapeHtml(eventDate);
    const safeEventLocation = escapeHtml(eventLocation);

    const isApproved = status === "registered";
    
    let qrCodeDataUrl = "";
    let checkInUrl = "";

    // Generate QR code for approved registrations
    if (isApproved) {
      const checkInToken = generateCheckInToken();
      
      // Store token in database
      await supabase
        .from("event_guests")
        .update({ check_in_token: checkInToken })
        .eq("id", guestId);

      checkInUrl = `https://www.kulmid.com/check-in/${checkInToken}`;
      const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&format=png&data=${encodeURIComponent(checkInUrl)}`;
    }

    // Get event for organizer info
    const { data: eventFull } = await supabase
      .from("events")
      .select("host_name")
      .eq("id", guest.event_id)
      .single();

    const eventDateObj = new Date(eventDate);
    const formattedDate = isNaN(eventDateObj.getTime()) ? safeEventDate : eventDateObj.toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' });
    const formattedTime = isNaN(eventDateObj.getTime()) ? '' : eventDateObj.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    const eventUrl = `https://www.kulmid.com/events/${guest.event_id}`;

    const subject = isApproved 
      ? `✅ Registration confirmed — ${safeEventTitle}` 
      : `⏳ Registration received — ${safeEventTitle}`;

    const htmlContent = isApproved
      ? `<!DOCTYPE html>
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
              <p style="margin:0 0 24px 0; font-size:15px; line-height:24px; color:#9aa4b2;">Hi ${safeName}, your spot has been confirmed for the event below.</p>
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
                      <tr><td style="padding:8px 0; font-size:13px; line-height:20px; color:#7f8a99;">Date</td><td align="right" style="padding:8px 0; font-size:14px; line-height:20px; color:#e5e7eb;">${formattedDate}</td></tr>
                      <tr><td style="padding:8px 0; font-size:13px; line-height:20px; color:#7f8a99;">Time</td><td align="right" style="padding:8px 0; font-size:14px; line-height:20px; color:#e5e7eb;">${formattedTime}</td></tr>
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
          ${accountCreated ? `
          <tr>
            <td style="padding:0 28px 24px 28px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#0f1f2f; border:1px solid #1e3a5f; border-radius:16px;">
                <tr><td style="padding:16px 20px; font-size:14px; line-height:22px; color:#93c5fd;"><strong style="color:#60a5fa;">📧 Account Created</strong><br/>We've created an account for you! Check your inbox for a link to set your password and access your event dashboard.</td></tr>
              </table>
            </td>
          </tr>` : ''}
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
</html>`
      : `<!DOCTYPE html>
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
                  <td align="right"><span style="display:inline-block; padding:6px 10px; border-radius:999px; background-color:#2f2a0f; color:#fbbf24; font-size:12px; line-height:12px; font-weight:600; letter-spacing:0.2px;">Pending</span></td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:8px 28px 0 28px;">
              <h1 style="margin:0 0 10px 0; font-size:30px; line-height:36px; font-weight:700; color:#ffffff;">Registration received</h1>
              <p style="margin:0 0 24px 0; font-size:15px; line-height:24px; color:#9aa4b2;">Hi ${safeName}, thank you for registering! Your registration is pending approval by the event organizer.</p>
            </td>
          </tr>
          <tr>
            <td style="padding:0 28px 24px 28px;">
              <div style="font-size:20px; line-height:28px; font-weight:700; color:#ffffff;">${safeEventTitle}</div>
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
                      <tr><td style="padding:8px 0; font-size:13px; line-height:20px; color:#7f8a99;">Location</td><td align="right" style="padding:8px 0; font-size:14px; line-height:20px; color:#e5e7eb;">${safeEventLocation}</td></tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:0 28px 32px 28px;">
              <p style="margin:0; font-size:15px; line-height:25px; color:#9aa4b2;">You'll receive another email with your ticket and QR code once confirmed.</p>
            </td>
          </tr>
          ${accountCreated ? `
          <tr>
            <td style="padding:0 28px 24px 28px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#0f1f2f; border:1px solid #1e3a5f; border-radius:16px;">
                <tr><td style="padding:16px 20px; font-size:14px; line-height:22px; color:#93c5fd;"><strong style="color:#60a5fa;">📧 Account Created</strong><br/>We've created an account for you! Check your inbox for a link to set your password.</td></tr>
              </table>
            </td>
          </tr>` : ''}
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

    const emailResponse = await sendEmailWithResend(email, subject, htmlContent);

    console.log("Confirmation email sent:", emailResponse);

    return new Response(JSON.stringify({ success: true, emailResponse }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in send-registration-confirmation:", error);
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
