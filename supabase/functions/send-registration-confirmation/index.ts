import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";
import QRCode from "npm:qrcode@1.5.3";

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

const generateCheckInToken = (guestId: string, eventId: string): string => {
  return `${guestId}-${eventId}-${crypto.randomUUID()}`;
};

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
      const checkInToken = generateCheckInToken(guestId, guest.event_id);
      
      // Store token in database
      await supabase
        .from("event_guests")
        .update({ check_in_token: checkInToken })
        .eq("id", guestId);

      // Generate QR code
      checkInUrl = `https://txjglujklpxsfhedwwkl.supabase.co/functions/v1/verify-check-in?token=${checkInToken}`;
      qrCodeDataUrl = await QRCode.toDataURL(checkInUrl, {
        width: 300,
        margin: 2,
        color: {
          dark: "#000000",
          light: "#FFFFFF",
        },
      });
    }

    const subject = isApproved 
      ? `✅ You're confirmed for ${safeEventTitle}` 
      : `⏳ Registration Received - ${safeEventTitle}`;

    const htmlContent = isApproved
      ? `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
          <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #f5f5f5; padding: 40px 20px;">
            <tr>
              <td align="center">
                <table cellpadding="0" cellspacing="0" border="0" width="600" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                  
                  <!-- Header with Logo -->
                  <tr>
                    <td style="background: linear-gradient(135deg, #06b6d4 0%, #0891b2 100%); padding: 30px 40px; text-align: center;">
                      <img src="https://txjglujklpxsfhedwwkl.supabase.co/storage/v1/object/public/event-images/kulmid-logo-text.png" alt="Kulmid" style="height: 40px; margin-bottom: 10px;">
                    </td>
                  </tr>

                  <!-- Success Badge -->
                  <tr>
                    <td style="padding: 40px 40px 20px; text-align: center;">
                      <div style="display: inline-block; background-color: #dcfce7; color: #166534; padding: 8px 16px; border-radius: 20px; font-size: 14px; font-weight: 600; margin-bottom: 20px;">
                        ✓ Confirmed
                      </div>
                      <h1 style="margin: 0 0 10px; font-size: 28px; font-weight: 700; color: #111827; line-height: 1.3;">
                        You've got a spot!
                      </h1>
                      <p style="margin: 0; font-size: 18px; color: #6b7280;">
                        ${safeEventTitle}
                      </p>
                    </td>
                  </tr>

                  <!-- Event Details -->
                  <tr>
                    <td style="padding: 0 40px 30px;">
                      <div style="background-color: #f9fafb; border-radius: 8px; padding: 20px; margin-bottom: 30px;">
                        <table cellpadding="0" cellspacing="0" border="0" width="100%">
                          <tr>
                            <td style="padding: 8px 0; font-size: 15px; color: #374151;">
                              <span style="font-weight: 600;">📅 Date:</span> ${safeEventDate}
                            </td>
                          </tr>
                          <tr>
                            <td style="padding: 8px 0; font-size: 15px; color: #374151;">
                              <span style="font-weight: 600;">📍 Location:</span> ${safeEventLocation}
                            </td>
                          </tr>
                          <tr>
                            <td style="padding: 8px 0; font-size: 15px; color: #374151;">
                              <span style="font-weight: 600;">👤 Guest:</span> ${safeName}
                            </td>
                          </tr>
                          <tr>
                            <td style="padding: 8px 0; font-size: 15px; color: #374151;">
                              <span style="font-weight: 600;">🎟️ Ticket:</span> 1× Standard
                            </td>
                          </tr>
                        </table>
                      </div>
                    </td>
                  </tr>

                  <!-- QR Code -->
                  <tr>
                    <td style="padding: 0 40px 30px; text-align: center;">
                      <p style="margin: 0 0 15px; font-size: 16px; font-weight: 600; color: #111827;">Your Check-In Code</p>
                      <div style="background-color: #ffffff; border: 2px solid #e5e7eb; border-radius: 12px; padding: 20px; display: inline-block;">
                        <img src="${qrCodeDataUrl}" alt="Check-in QR Code" style="display: block; width: 250px; height: 250px;">
                      </div>
                      <p style="margin: 15px 0 0; font-size: 13px; color: #6b7280;">
                        Show this QR code at the event entrance
                      </p>
                    </td>
                  </tr>

                  ${accountCreated ? `
                  <!-- Account Created Notice -->
                  <tr>
                    <td style="padding: 0 40px 30px;">
                      <div style="background-color: #eff6ff; border-left: 4px solid #3b82f6; border-radius: 6px; padding: 16px;">
                        <p style="margin: 0; font-size: 14px; color: #1e40af;">
                          <strong>📧 Account Created</strong><br>
                          <span style="color: #3b82f6;">We've created an account for you! Check your inbox for a link to set your password and access your event dashboard.</span>
                        </p>
                      </div>
                    </td>
                  </tr>
                  ` : ''}

                  <!-- CTA Buttons -->
                  <tr>
                    <td style="padding: 0 40px 40px; text-align: center;">
                      <a href="https://txjglujklpxsfhedwwkl.supabase.co" style="display: inline-block; background-color: #06b6d4; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 15px; margin: 0 8px 12px;">
                        View Event Details
                      </a>
                    </td>
                  </tr>

                  <!-- Footer -->
                  <tr>
                    <td style="background-color: #f9fafb; padding: 30px 40px; text-align: center; border-top: 1px solid #e5e7eb;">
                      <p style="margin: 0 0 10px; font-size: 13px; color: #6b7280;">
                        Powered by <strong style="color: #06b6d4;">Kulmid</strong>
                      </p>
                      <p style="margin: 0; font-size: 12px; color: #9ca3af;">
                        You're receiving this because you registered for this event.
                      </p>
                    </td>
                  </tr>

                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `
      : `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
          <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #f5f5f5; padding: 40px 20px;">
            <tr>
              <td align="center">
                <table cellpadding="0" cellspacing="0" border="0" width="600" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                  
                  <!-- Header -->
                  <tr>
                    <td style="background: linear-gradient(135deg, #06b6d4 0%, #0891b2 100%); padding: 30px 40px; text-align: center;">
                      <img src="https://txjglujklpxsfhedwwkl.supabase.co/storage/v1/object/public/event-images/kulmid-logo-text.png" alt="Kulmid" style="height: 40px;">
                    </td>
                  </tr>

                  <!-- Pending Badge -->
                  <tr>
                    <td style="padding: 40px 40px 20px; text-align: center;">
                      <div style="display: inline-block; background-color: #fef3c7; color: #92400e; padding: 8px 16px; border-radius: 20px; font-size: 14px; font-weight: 600; margin-bottom: 20px;">
                        ⏳ Pending Review
                      </div>
                      <h1 style="margin: 0 0 10px; font-size: 28px; font-weight: 700; color: #111827;">
                        Registration Received
                      </h1>
                      <p style="margin: 0; font-size: 18px; color: #6b7280;">
                        ${safeEventTitle}
                      </p>
                    </td>
                  </tr>

                  <!-- Message -->
                  <tr>
                    <td style="padding: 0 40px 30px;">
                      <p style="margin: 0 0 20px; font-size: 15px; color: #374151; line-height: 1.6;">
                        Hi ${safeName},
                      </p>
                      <p style="margin: 0 0 20px; font-size: 15px; color: #374151; line-height: 1.6;">
                        Thank you for registering! Your registration is currently pending approval by the event organizer. You'll receive another email with your ticket and QR code once confirmed.
                      </p>
                      <div style="background-color: #f9fafb; border-radius: 8px; padding: 20px;">
                        <table cellpadding="0" cellspacing="0" border="0" width="100%">
                          <tr>
                            <td style="padding: 8px 0; font-size: 15px; color: #374151;">
                              <span style="font-weight: 600;">📅 Date:</span> ${safeEventDate}
                            </td>
                          </tr>
                          <tr>
                            <td style="padding: 8px 0; font-size: 15px; color: #374151;">
                              <span style="font-weight: 600;">📍 Location:</span> ${safeEventLocation}
                            </td>
                          </tr>
                        </table>
                      </div>
                    </td>
                  </tr>

                  ${accountCreated ? `
                  <tr>
                    <td style="padding: 0 40px 30px;">
                      <div style="background-color: #eff6ff; border-left: 4px solid #3b82f6; border-radius: 6px; padding: 16px;">
                        <p style="margin: 0; font-size: 14px; color: #1e40af;">
                          <strong>📧 Account Created</strong><br>
                          <span style="color: #3b82f6;">We've created an account for you! Check your inbox for a link to set your password.</span>
                        </p>
                      </div>
                    </td>
                  </tr>
                  ` : ''}

                  <!-- Footer -->
                  <tr>
                    <td style="background-color: #f9fafb; padding: 30px 40px; text-align: center; border-top: 1px solid #e5e7eb;">
                      <p style="margin: 0 0 10px; font-size: 13px; color: #6b7280;">
                        Powered by <strong style="color: #06b6d4;">Kulmid</strong>
                      </p>
                      <p style="margin: 0; font-size: 12px; color: #9ca3af;">
                        You're receiving this because you registered for this event.
                      </p>
                    </td>
                  </tr>

                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `;

    const emailResponse = await sendEmailWithMailjet(email, subject, htmlContent);

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
