import { corsHeaders } from '@supabase/supabase-js/cors'
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts'

const ContactSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email().max(255),
  message: z.string().min(10).max(2000),
})

const GATEWAY_URL = 'https://connector-gateway.lovable.dev/resend'
const TO_EMAIL = 'kulmid2025@gmail.com'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const body = await req.json()
    const parsed = ContactSchema.safeParse(body)

    if (!parsed.success) {
      return new Response(
        JSON.stringify({ error: parsed.error.flatten().fieldErrors }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { name, email, message } = parsed.data

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY')
    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')

    if (!LOVABLE_API_KEY || !RESEND_API_KEY) {
      console.error('Missing API keys')
      return new Response(
        JSON.stringify({ error: 'Server configuration error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const htmlContent = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:560px;margin:32px auto;background:#ffffff;border-radius:12px;border:1px solid #e4e4e7;overflow:hidden;">
    <div style="background:#14b8a6;padding:20px 24px;">
      <h1 style="margin:0;color:#ffffff;font-size:18px;font-weight:600;">New Contact Message</h1>
    </div>
    <div style="padding:24px;">
      <table style="width:100%;border-collapse:collapse;">
        <tr>
          <td style="padding:8px 0;color:#71717a;font-size:13px;width:80px;vertical-align:top;">From</td>
          <td style="padding:8px 0;color:#111827;font-size:14px;font-weight:500;">${name}</td>
        </tr>
        <tr>
          <td style="padding:8px 0;color:#71717a;font-size:13px;vertical-align:top;">Email</td>
          <td style="padding:8px 0;"><a href="mailto:${email}" style="color:#14b8a6;font-size:14px;text-decoration:none;">${email}</a></td>
        </tr>
      </table>
      <div style="margin:16px 0;border-top:1px solid #e4e4e7;"></div>
      <p style="margin:0 0 8px;color:#71717a;font-size:13px;">Message</p>
      <p style="margin:0;color:#111827;font-size:14px;line-height:1.6;white-space:pre-wrap;">${message}</p>
    </div>
    <div style="padding:16px 24px;background:#fafafa;border-top:1px solid #e4e4e7;">
      <p style="margin:0;color:#a1a1aa;font-size:12px;">Sent via Kulmid Contact Form</p>
    </div>
  </div>
</body>
</html>`

    const response = await fetch(`${GATEWAY_URL}/emails`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'X-Connection-Api-Key': RESEND_API_KEY,
      },
      body: JSON.stringify({
        from: 'Kulmid Contact <onboarding@resend.dev>',
        to: [TO_EMAIL],
        reply_to: email,
        subject: `Contact from ${name}`,
        html: htmlContent,
      }),
    })

    const result = await response.json()

    if (!response.ok) {
      console.error('Resend error:', result)
      return new Response(
        JSON.stringify({ error: 'Failed to send message' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    console.error('Contact function error:', err)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
