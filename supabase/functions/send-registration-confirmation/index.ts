import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ConfirmationEmailRequest {
  email: string;
  name: string;
  eventTitle: string;
  status: "registered" | "pending";
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, name, eventTitle, status }: ConfirmationEmailRequest = await req.json();

    console.log("Sending registration confirmation to:", email, "Status:", status);

    const isApproved = status === "registered";
    const subject = isApproved 
      ? `✅ Registration Confirmed - ${eventTitle}` 
      : `⏳ Registration Received - ${eventTitle}`;

    const htmlContent = isApproved
      ? `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #10b981;">✅ Registration Confirmed!</h1>
          <p>Hi ${name},</p>
          <p>Great news! Your registration for <strong>${eventTitle}</strong> has been confirmed.</p>
          <p>You're all set to attend. We look forward to seeing you there!</p>
          <p style="margin-top: 30px;">Best regards,<br>EventEase Team</p>
        </div>
      `
      : `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #f59e0b;">⏳ Registration Received</h1>
          <p>Hi ${name},</p>
          <p>Thank you for registering for <strong>${eventTitle}</strong>.</p>
          <p>Your registration is currently pending approval by the event organizer. You'll receive another email once your registration is confirmed.</p>
          <p style="margin-top: 30px;">Best regards,<br>EventEase Team</p>
        </div>
      `;

    const emailResponse = await resend.emails.send({
      from: "EventEase <onboarding@resend.dev>",
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
