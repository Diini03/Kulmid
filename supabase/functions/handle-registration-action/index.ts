import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ActionRequest {
  guestId: string;
  action: "approve" | "reject";
  rejectionReason?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { guestId, action, rejectionReason }: ActionRequest = await req.json();
    
    console.log(`Processing ${action} for guest:`, guestId);

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get guest details
    const { data: guest, error: guestError } = await supabase
      .from("event_guests")
      .select("*, events(title)")
      .eq("id", guestId)
      .single();

    if (guestError || !guest) {
      throw new Error("Guest not found");
    }

    // Update status
    const newStatus = action === "approve" ? "registered" : "rejected";
    const { error: updateError } = await supabase
      .from("event_guests")
      .update({
        status: newStatus,
        rsvp_at: action === "approve" ? new Date().toISOString() : null,
        notes: rejectionReason || null,
      })
      .eq("id", guestId);

    if (updateError) throw updateError;

    // Send email to guest
    const subject = action === "approve"
      ? `✅ Registration Approved - ${guest.events.title}`
      : `Registration Update - ${guest.events.title}`;

    const htmlContent = action === "approve"
      ? `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #10b981;">✅ Registration Approved!</h1>
          <p>Hi ${guest.name},</p>
          <p>Great news! Your registration for <strong>${guest.events.title}</strong> has been approved by the organizer.</p>
          <p>We look forward to seeing you at the event!</p>
          <p style="margin-top: 30px;">Best regards,<br>EventEase Team</p>
        </div>
      `
      : `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #ef4444;">Registration Update</h1>
          <p>Hi ${guest.name},</p>
          <p>We regret to inform you that your registration for <strong>${guest.events.title}</strong> could not be approved at this time.</p>
          ${rejectionReason ? `<p><strong>Reason:</strong> ${rejectionReason}</p>` : ""}
          <p>If you have any questions, please contact the event organizer directly.</p>
          <p style="margin-top: 30px;">Best regards,<br>EventEase Team</p>
        </div>
      `;

    await resend.emails.send({
      from: "EventEase <onboarding@resend.dev>",
      to: [guest.email],
      subject,
      html: htmlContent,
    });

    console.log(`${action} processed successfully for guest:`, guestId);

    return new Response(
      JSON.stringify({ success: true, status: newStatus }),
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
