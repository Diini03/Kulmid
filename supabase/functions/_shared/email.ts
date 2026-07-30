export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

export const escapeHtml = (str: string | null | undefined): string => {
  if (!str) return "";
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
};

const FROM = "Kulmid Events <noreply@kulmid.com>";

export async function sendEmail(to: string, subject: string, html: string) {
  const apiKey = Deno.env.get("RESEND_API_KEY");
  if (!apiKey) throw new Error("RESEND_API_KEY is not configured");

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ from: FROM, to: [to], subject, html }),
  });

  if (!response.ok) {
    const body = await response.text();
    console.error(`Resend failed [${response.status}]: ${body}`);
    throw new Error(`[${response.status}]: ${body}`);
  }
  return await response.json();
}

/** Shared Kulmid email shell — keeps every transactional email on-brand. */
export function emailShell(opts: {
  heading: string;
  intro?: string;
  bodyHtml: string;
  ctaLabel?: string;
  ctaUrl?: string;
  footerNote?: string;
}) {
  const { heading, intro, bodyHtml, ctaLabel, ctaUrl, footerNote } = opts;
  return `<!DOCTYPE html><html><body style="margin:0;padding:0;background:#f4f5f7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Inter,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f5f7;padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e5e7eb;">
        <tr><td style="padding:24px 32px;border-bottom:1px solid #f0f1f3;">
          <span style="font-size:18px;font-weight:700;color:#0f766e;letter-spacing:-0.02em;">Kulmid</span>
        </td></tr>
        <tr><td style="padding:32px;">
          <h1 style="margin:0 0 12px;font-size:20px;line-height:1.35;color:#111827;">${heading}</h1>
          ${intro ? `<p style="margin:0 0 20px;font-size:15px;line-height:1.6;color:#4b5563;">${intro}</p>` : ""}
          ${bodyHtml}
          ${
            ctaLabel && ctaUrl
              ? `<div style="margin:28px 0 4px;"><a href="${ctaUrl}" style="display:inline-block;background:#0f766e;color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:8px;font-size:15px;font-weight:600;">${ctaLabel}</a></div>`
              : ""
          }
        </td></tr>
        <tr><td style="padding:20px 32px;background:#fafafa;border-top:1px solid #f0f1f3;">
          <p style="margin:0;font-size:12px;line-height:1.6;color:#9ca3af;">${footerNote || "You received this email because you registered for an event on Kulmid."}</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

export function detailRow(label: string, value: string) {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:8px;">
    <tr>
      <td style="font-size:13px;color:#6b7280;width:110px;vertical-align:top;padding:4px 0;">${escapeHtml(label)}</td>
      <td style="font-size:14px;color:#111827;font-weight:500;padding:4px 0;">${value}</td>
    </tr>
  </table>`;
}

export function formatEventDate(iso: string) {
  return new Date(iso).toLocaleString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}