import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";
import QRCode from "npm:qrcode@1.5.3";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
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

const generateCheckInToken = (guestId: string, eventId: string): string => {
  return `${guestId}-${eventId}-${crypto.randomUUID()}`;
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, name, eventTitle, eventDate, eventLocation, status, accountCreated, guestId }: ConfirmationEmailRequest = await req.json();

    console.log("Sending registration confirmation to:", email, "Status:", status, "Guest ID:", guestId);

    const isApproved = status === "registered";
    
    let qrCodeDataUrl = "";
    let checkInUrl = "";

    // Generate QR code for approved registrations
    if (isApproved) {
      const supabase = createClient(supabaseUrl, supabaseServiceKey);
      
      // Get event_id from guest
      const { data: guest } = await supabase
        .from("event_guests")
        .select("event_id")
        .eq("id", guestId)
        .single();

      if (guest) {
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
    }

    const subject = isApproved 
      ? `✅ You're confirmed for ${eventTitle}` 
      : `⏳ Registration Received - ${eventTitle}`;

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
                        ${eventTitle}
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
                              <span style="font-weight: 600;">📅 Date:</span> ${eventDate}
                            </td>
                          </tr>
                          <tr>
                            <td style="padding: 8px 0; font-size: 15px; color: #374151;">
                              <span style="font-weight: 600;">📍 Location:</span> ${eventLocation}
                            </td>
                          </tr>
                          <tr>
                            <td style="padding: 8px 0; font-size: 15px; color: #374151;">
                              <span style="font-weight: 600;">👤 Guest:</span> ${name}
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
                        ${eventTitle}
                      </p>
                    </td>
                  </tr>

                  <!-- Message -->
                  <tr>
                    <td style="padding: 0 40px 30px;">
                      <p style="margin: 0 0 20px; font-size: 15px; color: #374151; line-height: 1.6;">
                        Hi ${name},
                      </p>
                      <p style="margin: 0 0 20px; font-size: 15px; color: #374151; line-height: 1.6;">
                        Thank you for registering! Your registration is currently pending approval by the event organizer. You'll receive another email with your ticket and QR code once confirmed.
                      </p>
                      <div style="background-color: #f9fafb; border-radius: 8px; padding: 20px;">
                        <table cellpadding="0" cellspacing="0" border="0" width="100%">
                          <tr>
                            <td style="padding: 8px 0; font-size: 15px; color: #374151;">
                              <span style="font-weight: 600;">📅 Date:</span> ${eventDate}
                            </td>
                          </tr>
                          <tr>
                            <td style="padding: 8px 0; font-size: 15px; color: #374151;">
                              <span style="font-weight: 600;">📍 Location:</span> ${eventLocation}
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
                    </td>
                  </tr>

                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `;

    const emailResponse = await resend.emails.send({
      from: "Kulmid Events <onboarding@resend.dev>",
      to: [email],
      subject,
      html: htmlContent,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify(emailResponse), {
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
