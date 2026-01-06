import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";
import QRCode from "npm:qrcode@1.5.3";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
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

// HTML escape function to prevent HTML injection in email templates
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

const generateCheckInToken = (guestId: string, eventId: string): string => {
  return `${guestId}-${eventId}-${crypto.randomUUID()}`;
};

// Send email using Resend API
const sendEmailWithResend = async (to: string, subject: string, htmlContent: string) => {
  const { data, error } = await resend.emails.send({
    from: "Kulmid Events <noreply@hiberindustry.com>",
    to: [to],
    subject: subject,
    html: htmlContent,
  });

  if (error) {
    console.error("Resend API error:", error);
    throw new Error(`Failed to send email: ${error.message}`);
  }

  return data;
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Get user from auth header
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      throw new Error("Unauthorized");
    }

    const { eventId, emails, customTitle, customMessage }: InvitationRequest = await req.json();

    console.log(`Sending invitations for event ${eventId} to ${emails.length} recipients`);

    // Fetch event details
    const { data: event, error: eventError } = await supabase
      .from("events")
      .select("*")
      .eq("id", eventId)
      .eq("created_by", user.id)
      .single();

    if (eventError || !event) {
      throw new Error("Event not found or unauthorized");
    }

    const eventDate = new Date(event.date).toLocaleString();
    // Escape user-provided and database content to prevent HTML injection
    const safeCustomMessage = customMessage ? escapeHtml(customMessage) : null;
    const safeDescription = event.description ? escapeHtml(event.description) : null;
    const safeTitle = escapeHtml(event.title);
    const safeLocation = escapeHtml(event.location);
    const safeHostName = event.host_name ? escapeHtml(event.host_name) : null;
    
    const results = [];
    
    for (const email of emails) {
      try {
        // Add to guest list or update if exists
        // Set status to "registered" immediately for invitations (auto-approved)
        const { data: guestData, error: guestError } = await supabase
          .from("event_guests")
          .upsert({
            event_id: eventId,
            email: email,
            name: email.split("@")[0], // Use email prefix as default name
            status: "registered", // Invitations are auto-approved
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

        // Generate QR code
        const checkInToken = generateCheckInToken(guestData.id, eventId);
        const checkInUrl = `${supabaseUrl}/functions/v1/verify-check-in?token=${checkInToken}`;
        const qrCodeDataUrl = await QRCode.toDataURL(checkInUrl, {
          width: 300,
          margin: 2,
          color: {
            dark: "#000000",
            light: "#FFFFFF",
          },
        });

        // Update guest with check-in token
        await supabase
          .from("event_guests")
          .update({ check_in_token: checkInToken })
          .eq("id", guestData.id);

        const safeGuestName = escapeHtml(email.split("@")[0]);

        const emailSubject = customTitle || `✅ You're confirmed for ${safeTitle}`;
        const htmlContent = `
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
                        <img src="${supabaseUrl}/storage/v1/object/public/event-images/kulmid-logo-text.png" alt="Kulmid" style="height: 40px; margin-bottom: 10px;">
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
                          ${safeTitle}
                        </p>
                      </td>
                    </tr>

                    ${safeCustomMessage ? `
                    <!-- Custom Message -->
                    <tr>
                      <td style="padding: 0 40px 20px;">
                        <div style="background-color: #f0f9ff; border-left: 4px solid #0ea5e9; border-radius: 6px; padding: 20px;">
                          <p style="margin: 0; font-size: 15px; color: #0c4a6e; line-height: 1.6; white-space: pre-wrap;">${safeCustomMessage}</p>
                        </div>
                      </td>
                    </tr>
                    ` : ''}

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
                                <span style="font-weight: 600;">📍 Location:</span> ${safeLocation}
                              </td>
                            </tr>
                            ${safeDescription ? `
                            <tr>
                              <td style="padding: 8px 0; font-size: 15px; color: #374151;">
                                <span style="font-weight: 600;">📝 About:</span> ${safeDescription}
                              </td>
                            </tr>
                            ` : ''}
                            <tr>
                              <td style="padding: 8px 0; font-size: 15px; color: #374151;">
                                <span style="font-weight: 600;">👤 Guest:</span> ${safeGuestName}
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

                    <!-- CTA Buttons -->
                    <tr>
                      <td style="padding: 0 40px 40px; text-align: center;">
                        <a href="${supabaseUrl}" style="display: inline-block; background-color: #06b6d4; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 15px; margin: 0 8px 12px;">
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
                          You received this invitation from ${safeHostName || 'the event organizer'}.
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

        // Send styled email with Resend
        const emailResponse = await sendEmailWithResend(email, emailSubject, htmlContent);

        console.log("Email sent to:", email, emailResponse);

        // Record invitation in database
        await supabase.from("event_invitations").insert({
          event_id: eventId,
          email: email,
          custom_title: customTitle,
          custom_message: customMessage,
          created_by: user.id,
          status: "sent",
        });

        // Create in-app notification for the invited user if they have an account
        // Look up user by email
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
