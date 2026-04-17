// @ts-nocheck
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface Payload {
  type?: "registration" | "checkin"; // default: registration
  name: string;
  email: string;
  event: string;
  registrationId: string;
  phone?: string;
  organization?: string;
  qrDataUrl?: string;
  customFields?: Record<string, string>;
  checkedInAt?: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = (await req.json()) as Payload;
    const { type = "registration", name, email, event, registrationId, phone, organization, qrDataUrl, customFields, checkedInAt } = body;

    if (!email || !name || !event || !registrationId) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const SMTP_USER = Deno.env.get("SMTP_USER");
    const SMTP_PASS = Deno.env.get("SMTP_PASS");
    if (!SMTP_USER || !SMTP_PASS) {
      return new Response(JSON.stringify({ error: "SMTP credentials not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const client = new SMTPClient({
      connection: {
        hostname: "smtp.gmail.com",
        port: 465,
        tls: true,
        auth: { username: SMTP_USER, password: SMTP_PASS },
      },
    });

    const customFieldsHtml = customFields
      ? Object.entries(customFields)
          .map(([k, v]) => `<tr><td style="padding:6px 12px;color:#64748b">${k}</td><td style="padding:6px 12px;color:#0f172a;font-weight:600">${v}</td></tr>`)
          .join("")
      : "";

    // Embed QR as inline data URL — avoids CID attachment MIME issues
    const qrImgTag = qrDataUrl
      ? `<div style="text-align:center;padding:16px;background:#ffffff;border:2px dashed #16a34a;border-radius:8px;">
          <p style="margin:0 0 12px;color:#475569;font-weight:600;">Your Check-in QR Code</p>
          <img src="${qrDataUrl}" alt="QR Code" style="width:220px;height:220px;display:block;margin:0 auto;" />
          <p style="margin:10px 0 0;color:#94a3b8;font-size:11px;">Show this at the event entrance</p>
        </div>`
      : "";

    let subject: string;
    let html: string;

    if (type === "checkin") {
      const checkInTime = checkedInAt
        ? new Date(checkedInAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })
        : new Date().toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });

      subject = `🎉 You're Checked In — ${event} | SRIJAN 4.0`;
      html = `
<!DOCTYPE html>
<html><body style="margin:0;padding:0;background:#f8fafc;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:40px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.08);">

        <!-- Header -->
        <tr><td style="background:linear-gradient(135deg,#16a34a,#15803d);padding:36px 32px;text-align:center;color:#ffffff;">
          <div style="font-size:48px;margin-bottom:12px;">🎉</div>
          <h1 style="margin:0;font-size:28px;letter-spacing:1px;">You're Checked In!</h1>
          <p style="margin:8px 0 0;opacity:0.9;font-size:15px;">SRIJAN 4.0 · Quantum University</p>
        </td></tr>

        <!-- Body -->
        <tr><td style="padding:36px 32px;">
          <h2 style="color:#0f172a;margin:0 0 8px;font-size:20px;">Welcome, ${name}! 👋</h2>
          <p style="color:#475569;line-height:1.7;margin:0 0 28px;font-size:15px;">
            You have been successfully checked in to <strong style="color:#16a34a;">${event}</strong>.
            Thank you for being part of SRIJAN 4.0 — we're thrilled to have you here!
          </p>

          <!-- Check-in details card -->
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;margin-bottom:28px;">
            <tr><td style="padding:20px 24px;">
              <p style="margin:0 0 14px;font-weight:700;color:#15803d;font-size:13px;text-transform:uppercase;letter-spacing:0.5px;">Check-in Details</p>
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding:5px 0;color:#64748b;font-size:13px;width:140px;">Name</td>
                  <td style="padding:5px 0;color:#0f172a;font-weight:600;font-size:13px;">${name}</td>
                </tr>
                <tr>
                  <td style="padding:5px 0;color:#64748b;font-size:13px;">Event</td>
                  <td style="padding:5px 0;color:#16a34a;font-weight:700;font-size:13px;">${event}</td>
                </tr>
                <tr>
                  <td style="padding:5px 0;color:#64748b;font-size:13px;">Registration ID</td>
                  <td style="padding:5px 0;color:#0f172a;font-weight:600;font-size:13px;font-family:monospace;">${registrationId}</td>
                </tr>
                <tr>
                  <td style="padding:5px 0;color:#64748b;font-size:13px;">Checked In At</td>
                  <td style="padding:5px 0;color:#0f172a;font-weight:600;font-size:13px;">${checkInTime}</td>
                </tr>
                ${phone ? `<tr><td style="padding:5px 0;color:#64748b;font-size:13px;">Phone</td><td style="padding:5px 0;color:#0f172a;font-weight:600;font-size:13px;">${phone}</td></tr>` : ""}
                ${organization ? `<tr><td style="padding:5px 0;color:#64748b;font-size:13px;">Organization</td><td style="padding:5px 0;color:#0f172a;font-weight:600;font-size:13px;">${organization}</td></tr>` : ""}
              </table>
            </td></tr>
          </table>

          <!-- Thank you message -->
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#fefce8;border:1px solid #fde68a;border-radius:10px;margin-bottom:28px;">
            <tr><td style="padding:18px 24px;">
              <p style="margin:0;color:#92400e;font-size:14px;line-height:1.7;">
                ✨ <strong>Thank you for joining us!</strong> We hope you have an incredible experience at SRIJAN 4.0.
                Explore the sessions, connect with fellow innovators, and make the most of every moment.
              </p>
            </td></tr>
          </table>

          <p style="color:#64748b;font-size:13px;margin:0;line-height:1.6;text-align:center;">
            📍 <strong>Quantum University, Roorkee, Uttarakhand</strong><br/>
            📅 April 23–25, 2026
          </p>
        </td></tr>

        <!-- Footer -->
        <tr><td style="background:#0f172a;padding:20px;text-align:center;color:#94a3b8;font-size:12px;">
          © SRIJAN 4.0 · E-Cell Genesis, Quantum University<br/>
          <span style="color:#64748b;">ecell.genesis@quantumuniversity.edu.in</span>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;

    } else {
      // Registration confirmation email (existing)
      subject = `✅ Registration Confirmed - ${event} | SRIJAN 4.0`;
      html = `
<!DOCTYPE html>
<html><body style="margin:0;padding:0;background:#f8fafc;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:40px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.08);">
        <tr><td style="background:linear-gradient(135deg,#16a34a,#15803d);padding:32px;text-align:center;color:#ffffff;">
          <h1 style="margin:0;font-size:28px;letter-spacing:1px;">SRIJAN 4.0</h1>
          <p style="margin:8px 0 0;opacity:0.9;">Registration Confirmed</p>
        </td></tr>
        <tr><td style="padding:32px;">
          <h2 style="color:#0f172a;margin:0 0 8px;">Hi ${name},</h2>
          <p style="color:#475569;line-height:1.6;margin:0 0 24px;">
            Thank you for registering for <strong>${event}</strong>. We're excited to have you join us!
            Please show the QR code below at the event entrance for check-in.
          </p>
          <table width="100%" style="background:#f1f5f9;border-radius:8px;padding:16px;margin-bottom:24px;">
            <tr><td style="padding:6px 12px;color:#64748b">Registration ID</td><td style="padding:6px 12px;color:#0f172a;font-weight:600">${registrationId}</td></tr>
            <tr><td style="padding:6px 12px;color:#64748b">Event</td><td style="padding:6px 12px;color:#0f172a;font-weight:600">${event}</td></tr>
            <tr><td style="padding:6px 12px;color:#64748b">Name</td><td style="padding:6px 12px;color:#0f172a;font-weight:600">${name}</td></tr>
            <tr><td style="padding:6px 12px;color:#64748b">Email</td><td style="padding:6px 12px;color:#0f172a;font-weight:600">${email}</td></tr>
            ${phone ? `<tr><td style="padding:6px 12px;color:#64748b">Phone</td><td style="padding:6px 12px;color:#0f172a;font-weight:600">${phone}</td></tr>` : ""}
            ${organization ? `<tr><td style="padding:6px 12px;color:#64748b">Organization</td><td style="padding:6px 12px;color:#0f172a;font-weight:600">${organization}</td></tr>` : ""}
            ${customFieldsHtml}
          </table>
          ${qrImgTag}
          <p style="color:#64748b;font-size:13px;margin:24px 0 0;line-height:1.6;text-align:center;">
            See you at <strong>Quantum University, Roorkee</strong> · April 23–25, 2026
          </p>
        </td></tr>
        <tr><td style="background:#0f172a;padding:20px;text-align:center;color:#94a3b8;font-size:12px;">
          © SRIJAN 4.0 · E-Cell Genesis, Quantum University
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
    }

    await client.send({
      from: `SRIJAN 4.0 <${SMTP_USER}>`,
      to: email,
      subject,
      html,
    });

    await client.close();

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("send-registration-email error:", err);
    return new Response(JSON.stringify({ error: String(err?.message || err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
