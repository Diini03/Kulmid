import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";
import { Resend } from "npm:resend@2.0.0";
import QRCode from "npm:qrcode@1.5.3";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
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

const generateCheckInToken = (guestId: string, eventId: string): string => {
  return `${guestId}-${eventId}-${crypto.randomUUID()}`;
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
    
    // Create a client with the user's JWT to verify their identity
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
    
    // Input validation
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

    // Use service role for database operations
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get guest and event details
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
    // Verify the authenticated user owns this event OR is an admin
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

    // Escape user-provided content for HTML
    const safeGuestName = escapeHtml(guest.name);
    const safeEventTitle = escapeHtml(guest.events.title);
    const safeEventLocation = escapeHtml(guest.events.location);
    const safeRejectionReason = escapeHtml(rejectionReason);

    if (action === "approve") {
      // Generate check-in token and QR code
      const checkInToken = generateCheckInToken(guestId, guest.events.id);
      const checkInUrl = `${supabaseUrl}/functions/v1/verify-check-in?token=${checkInToken}`;
      const qrCodeDataUrl = await QRCode.toDataURL(checkInUrl, {
        width: 300,
        margin: 2,
        color: {
          dark: "#000000",
          light: "#FFFFFF",
        },
      });

      // Update status with token
      const { error: updateError } = await supabase
        .from("event_guests")
        .update({
          status: "registered",
          rsvp_at: new Date().toISOString(),
          check_in_token: checkInToken,
        })
        .eq("id", guestId);

      if (updateError) throw updateError;

      const eventDate = new Date(guest.events.date).toLocaleString();

      subject = `✅ You're confirmed for ${safeEventTitle}`;
      htmlContent = `
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
                  
                  <tr>
                    <td style="background: linear-gradient(135deg, #06b6d4 0%, #0891b2 100%); padding: 30px 40px; text-align: center;">
                      <img src="${supabaseUrl}/storage/v1/object/public/event-images/kulmid-logo-text.png" alt="Kulmid" style="height: 40px; margin-bottom: 10px;">
                    </td>
                  </tr>

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
                              <span style="font-weight: 600;">📍 Location:</span> ${safeEventLocation}
                            </td>
                          </tr>
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

                  <tr>
                    <td style="padding: 0 40px 40px; text-align: center;">
                      <a href="${supabaseUrl}" style="display: inline-block; background-color: #06b6d4; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 15px; margin: 0 8px 12px;">
                        View Event Details
                      </a>
                    </td>
                  </tr>

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

      const eventDate = new Date(guest.events.date).toLocaleString();

      subject = `❌ Registration Not Approved - ${safeEventTitle}`;
      htmlContent = `
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
                  
                  <tr>
                    <td style="background: linear-gradient(135deg, #06b6d4 0%, #0891b2 100%); padding: 30px 40px; text-align: center;">
                      <img src="${supabaseUrl}/storage/v1/object/public/event-images/kulmid-logo-text.png" alt="Kulmid" style="height: 40px;">
                    </td>
                  </tr>

                  <tr>
                    <td style="padding: 40px 40px 20px; text-align: center;">
                      <div style="display: inline-block; background-color: #fee2e2; color: #991b1b; padding: 8px 16px; border-radius: 20px; font-size: 14px; font-weight: 600; margin-bottom: 20px;">
                        ❌ Not Approved
                      </div>
                      <h1 style="margin: 0 0 10px; font-size: 28px; font-weight: 700; color: #111827;">
                        Registration Not Approved
                      </h1>
                      <p style="margin: 0; font-size: 18px; color: #6b7280;">
                        ${safeEventTitle}
                      </p>
                    </td>
                  </tr>

                  <tr>
                    <td style="padding: 0 40px 30px;">
                      <p style="margin: 0 0 20px; font-size: 15px; color: #374151; line-height: 1.6;">
                        Hi ${safeGuestName},
                      </p>
                      <p style="margin: 0 0 20px; font-size: 15px; color: #374151; line-height: 1.6;">
                        Unfortunately, your registration for this event was not approved.
                      </p>
                      ${safeRejectionReason ? `
                      <div style="background-color: #fef2f2; border-left: 4px solid #ef4444; border-radius: 6px; padding: 16px; margin-bottom: 20px;">
                        <p style="margin: 0; font-size: 14px; color: #991b1b;">
                          <strong>Reason:</strong><br>
                          <span style="color: #dc2626;">${safeRejectionReason}</span>
                        </p>
                      </div>
                      ` : ''}
                      <p style="margin: 0; font-size: 15px; color: #374151; line-height: 1.6;">
                        If you have any questions, please contact the event organizer.
                      </p>
                    </td>
                  </tr>

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
    }

    await resend.emails.send({
      from: "Kulmid Events <onboarding@resend.dev>",
      to: [guest.email],
      subject,
      html: htmlContent,
    });

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
