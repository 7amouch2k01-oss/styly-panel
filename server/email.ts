import nodemailer from "nodemailer";

export async function sendVerificationEmail(email: string, code: string) {
  const from = process.env.SMTP_FROM || "Styly <onboarding@resend.dev>";
  const subject = "Verify your Styly Account";
  const html = `
    <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 12px; background-color: #ffffff;">
      <div style="text-align: center; margin-bottom: 20px;">
        <h2 style="color: #FF5E3A; margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px;">Styly</h2>
        <p style="color: #6b7280; margin: 5px 0 0 0; font-size: 14px;">Your Digital Fashion Closet</p>
      </div>
      <div style="padding: 20px; border-top: 1px solid #f3f4f6; border-bottom: 1px solid #f3f4f6;">
        <p style="font-size: 16px; color: #374151; line-height: 1.5; margin: 0 0 16px 0;">Hello,</p>
        <p style="font-size: 16px; color: #374151; line-height: 1.5; margin: 0 0 24px 0;">Thank you for signing up. Please use the following 6-digit confirmation code to verify your account:</p>
        <div style="font-size: 36px; font-weight: 800; letter-spacing: 6px; text-align: center; margin: 30px 0; color: #FF5E3A; font-family: monospace;">
          ${code}
        </div>
        <p style="font-size: 14px; color: #6b7280; margin: 0;">This code is valid for 10 minutes. If you did not request this, please ignore this email.</p>
      </div>
      <div style="text-align: center; margin-top: 20px; color: #9ca3af; font-size: 12px;">
        &copy; ${new Date().getFullYear()} Styly Platform. All rights reserved.
      </div>
    </div>
  `;

  // Always log to console for local dev / when email is restricted
  console.log(`\n══════════════════════════════════════════════`);
  console.log(`[Email] Verification code for ${email}: ${code}`);
  console.log(`══════════════════════════════════════════════\n`);

  // 1. Try Resend REST API
  if (process.env.RESEND_API_KEY) {
    try {
      console.log(`[Email] Sending to ${email} via Resend...`);
      const resp = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.RESEND_API_KEY}`,
        },
        body: JSON.stringify({ from, to: email, subject, html }),
      });

      if (resp.ok) {
        console.log(`[Email] ✅ Sent to ${email} via Resend`);
        return;
      }

      const errBody = await resp.json().catch(() => ({ message: "unknown" }));
      // 403 = domain not verified — graceful fallback, don't throw
      if (resp.status === 403) {
        console.warn(`[Email] ⚠️  Resend domain restriction: ${errBody.message}`);
        console.warn(`[Email] 👉 To send to any email, verify a domain at https://resend.com/domains`);
        console.warn(`[Email] ✅ Code logged above — you can still test by copy-pasting it manually.`);
        return; // Not throwing — code is logged above
      }

      console.error(`[Email] Resend error ${resp.status}:`, errBody.message);
    } catch (e: any) {
      console.error(`[Email] Resend fetch failed:`, e.message);
    }
  }

  // 2. Try SMTP fallback
  if (process.env.SMTP_HOST) {
    try {
      console.log(`[Email] Trying SMTP fallback to ${email}...`);
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || "587"),
        secure: process.env.SMTP_SECURE === "true",
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });
      await transporter.sendMail({ from, to: email, subject, html });
      console.log(`[Email] ✅ Sent to ${email} via SMTP`);
      return;
    } catch (e: any) {
      console.error(`[Email] SMTP failed:`, e.message);
    }
  }

  // Code already printed above — no action needed
}
