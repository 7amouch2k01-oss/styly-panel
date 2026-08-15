import nodemailer from "nodemailer";
import fs from "fs";
import path from "path";

// Load fallback SMTP config from root config file if present
let smtpConfig: any = null;
try {
  const configPath = path.join(process.cwd(), "smtp_config.json");
  if (fs.existsSync(configPath)) {
    smtpConfig = JSON.parse(fs.readFileSync(configPath, "utf-8"));
  }
} catch (e: any) {
  console.warn("[Email] Failed to load smtp_config.json:", e.message);
}

// ─── Shared sender helper ──────────────────────────────────────────────────────
const FROM = process.env.SMTP_FROM || process.env.RESEND_FROM || smtpConfig?.SMTP_FROM || "Styly <onboarding@resend.dev>";

async function sendEmail(to: string, subject: string, html: string) {
  console.log(`\n══════════════════════════════════════════════`);
  console.log(`[Email] Sending to: ${to} | Subject: ${subject}`);
  console.log(`══════════════════════════════════════════════\n`);

  const senderEmail = process.env.SMTP_USER || smtpConfig?.SMTP_USER || "styly.app.official@gmail.com";
  const senderName = "Styly";

  // 1. Try Brevo HTTPS REST API (works across all Railway hosting on port 443)
  const brevoKey = process.env.BREVO_API_KEY || process.env.BREVO_SMTP_KEY || (process.env.SMTP_PASS?.startsWith("xsmtpsib-") ? process.env.SMTP_PASS : undefined) || smtpConfig?.BREVO_API_KEY || (smtpConfig?.SMTP_PASS?.startsWith("xsmtpsib-") ? smtpConfig?.SMTP_PASS : undefined);
  
  if (brevoKey) {
    try {
      const resp = await fetch("https://api.brevo.com/v3/smtp/email", {
        method: "POST",
        headers: {
          "accept": "application/json",
          "api-key": brevoKey,
          "content-type": "application/json",
        },
        body: JSON.stringify({
          sender: { name: senderName, email: senderEmail },
          to: [{ email: to }],
          subject,
          htmlContent: html,
        }),
      });
      if (resp.ok) { console.log(`[Email] ✅ Sent via Brevo HTTPS API`); return; }
      const err = await resp.json().catch(() => ({ message: "unknown" }));
      console.error(`[Email] Brevo error ${resp.status}:`, err.message || JSON.stringify(err));
    } catch (e: any) { console.error(`[Email] Brevo fetch failed:`, e.message); }
  }

  // 2. Try SendGrid (supports Gmail single sender verification over HTTPS port 443)
  if (process.env.SENDGRID_API_KEY) {
    try {
      const resp = await fetch("https://api.sendgrid.com/v3/mail/send", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.SENDGRID_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          personalizations: [{ to: [{ email: to }] }],
          from: { email: senderEmail, name: senderName },
          subject,
          content: [{ type: "text/html", value: html }],
        }),
      });
      if (resp.ok) { console.log(`[Email] ✅ Sent via SendGrid`); return; }
      const err = await resp.json().catch(() => ({ message: "unknown" }));
      console.error(`[Email] SendGrid error ${resp.status}:`, err.message || JSON.stringify(err));
    } catch (e: any) { console.error(`[Email] SendGrid fetch failed:`, e.message); }
  }

  // 3. Try Resend (requires custom domain over HTTPS port 443)
  if (process.env.RESEND_API_KEY) {
    try {
      const resp = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.RESEND_API_KEY}`,
        },
        body: JSON.stringify({ from: FROM, to, subject, html }),
      });
      if (resp.ok) { console.log(`[Email] ✅ Sent via Resend`); return; }
      const err = await resp.json().catch(() => ({ message: "unknown" }));
      if (resp.status === 403) {
        console.warn(`[Email] ⚠️  Resend domain restriction: ${err.message}`);
      } else {
        console.error(`[Email] Resend error ${resp.status}:`, err.message);
      }
    } catch (e: any) { console.error(`[Email] Resend fetch failed:`, e.message); }
  }

  // 4. Try SMTP (blocked by Railway on Hobby tier, but works locally)
  const smtpHost = process.env.SMTP_HOST || smtpConfig?.SMTP_HOST;
  const smtpPort = process.env.SMTP_PORT || smtpConfig?.SMTP_PORT;
  const smtpSecure = process.env.SMTP_SECURE || smtpConfig?.SMTP_SECURE;
  const smtpUser = process.env.SMTP_USER || smtpConfig?.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS || smtpConfig?.SMTP_PASS;

  if (smtpHost) {
    try {
      const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: parseInt(smtpPort || "587"),
        secure: smtpSecure === "true",
        auth: { user: smtpUser, pass: smtpPass },
      });
      await transporter.sendMail({ from: FROM, to, subject, html });
      console.log(`[Email] ✅ Sent via SMTP`);
    } catch (e: any) { console.error(`[Email] SMTP failed:`, e.message); }
  }
}


// ─── Branded wrapper ───────────────────────────────────────────────────────────
function brandedEmail(content: string, previewText = "") {
  const year = new Date().getFullYear();
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Styly</title>
</head>
<body style="margin:0;padding:0;background:#F4F4F5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  ${previewText ? `<div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">${previewText}</div>` : ""}
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#F4F4F5;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;">

          <!-- HEADER -->
          <tr>
            <td style="background:linear-gradient(135deg,#e11d48 0%,#f43f5e 40%,#f97316 100%);border-radius:20px 20px 0 0;padding:36px 40px 32px;text-align:center;">
              <div style="display:inline-flex;align-items:center;gap:8px;margin-bottom:6px;">
                <span style="font-size:32px;font-weight:900;color:#ffffff;letter-spacing:-1.5px;line-height:1;">Styly</span>
              </div>
              <p style="margin:0;font-size:12px;color:rgba(255,255,255,0.75);letter-spacing:2px;text-transform:uppercase;font-weight:600;">Fashion · Fit · Community</p>
            </td>
          </tr>

          <!-- BODY -->
          <tr>
            <td style="background:#ffffff;padding:40px;border-left:1px solid #f1f5f9;border-right:1px solid #f1f5f9;">
              ${content}
            </td>
          </tr>

          <!-- FOOTER -->
          <tr>
            <td style="background:#18181b;border-radius:0 0 20px 20px;padding:28px 40px;text-align:center;">
              <p style="margin:0 0 12px;font-size:13px;color:#a1a1aa;">
                Questions? Reply to this email or visit
                <a href="https://responsible-harmony-production-8371.up.railway.app" style="color:#f97316;text-decoration:none;font-weight:600;">styly.app</a>
              </p>
              <p style="margin:0;font-size:11px;color:#52525b;">© ${year} Styly Fashion Platform. All rights reserved.</p>
              <p style="margin:8px 0 0;font-size:11px;color:#3f3f46;">You received this email because you have a Styly account.</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// ─── Shared CTA button ─────────────────────────────────────────────────────────
function ctaButton(href: string, label: string) {
  return `<div style="text-align:center;margin:32px 0;">
    <a href="${href}" style="display:inline-block;background:linear-gradient(135deg,#e11d48,#f97316);color:#ffffff;text-decoration:none;padding:15px 36px;border-radius:50px;font-weight:800;font-size:15px;letter-spacing:0.3px;box-shadow:0 4px 20px rgba(225,29,72,0.35);">
      ${label}
    </a>
  </div>`;
}

// ─── Info card ─────────────────────────────────────────────────────────────────
function infoCard(label: string, value: string) {
  return `<div style="background:#fafafa;border:1px solid #f1f5f9;border-radius:12px;padding:14px 18px;margin-bottom:10px;">
    <p style="margin:0 0 3px;font-size:11px;color:#94a3b8;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;">${label}</p>
    <p style="margin:0;font-size:14px;color:#1e293b;font-weight:600;">${value}</p>
  </div>`;
}

// ─── VERIFICATION EMAIL ────────────────────────────────────────────────────────
export async function sendVerificationEmail(email: string, code: string) {
  console.log(`[Email] Verification code for ${email}: ${code}`);
  const html = brandedEmail(`
    <p style="font-size:22px;font-weight:800;color:#0f172a;margin:0 0 8px;">Verify your email 🔐</p>
    <p style="font-size:15px;color:#64748b;line-height:1.6;margin:0 0 32px;">
      Welcome to Styly! Use the code below to confirm your account and unlock your personal fashion feed, 3D mannequin, and more.
    </p>

    <div style="background:linear-gradient(135deg,#fff1f2,#fff7ed);border:2px dashed #fca5a5;border-radius:16px;padding:28px;text-align:center;margin:0 0 32px;">
      <p style="margin:0 0 8px;font-size:12px;color:#f43f5e;font-weight:700;letter-spacing:2px;text-transform:uppercase;">Verification Code</p>
      <p style="margin:0;font-size:46px;font-weight:900;letter-spacing:14px;color:#e11d48;font-family:'Courier New',monospace;">${code}</p>
      <p style="margin:10px 0 0;font-size:12px;color:#94a3b8;">Expires in <strong>10 minutes</strong></p>
    </div>

    <div style="background:#f8fafc;border-radius:10px;padding:14px 18px;border-left:3px solid #e11d48;">
      <p style="margin:0;font-size:13px;color:#64748b;">⚠️ <strong>Never share this code</strong> with anyone. Styly staff will never ask for it.</p>
    </div>
  `, "Your Styly verification code is inside");
  await sendEmail(email, "🔐 Verify your Styly account", html);
}

// ─── PASSWORD RESET EMAIL ──────────────────────────────────────────────────────
export async function sendPasswordResetEmail(email: string, resetUrl: string) {
  console.log(`[Email] Password reset link for ${email}: ${resetUrl}`);
  const html = brandedEmail(`
    <p style="font-size:22px;font-weight:800;color:#0f172a;margin:0 0 8px;">Reset your password 🔑</p>
    <p style="font-size:15px;color:#64748b;line-height:1.6;margin:0 0 8px;">
      We received a request to reset the password for your Styly account. Click the button below to choose a new one.
    </p>
    <p style="font-size:13px;color:#94a3b8;margin:0 0 32px;">This link is valid for <strong>1 hour</strong>.</p>

    ${ctaButton(resetUrl, "Reset My Password →")}

    <div style="background:#f8fafc;border-radius:10px;padding:14px 18px;border-left:3px solid #f97316;">
      <p style="margin:0;font-size:13px;color:#64748b;">🛡️ If you didn't request this, your account is safe. No changes have been made.</p>
    </div>

    <p style="margin:24px 0 0;font-size:12px;color:#94a3b8;word-break:break-all;">
      Can't click the button? Copy this link:<br/>
      <a href="${resetUrl}" style="color:#e11d48;">${resetUrl}</a>
    </p>
  `, "Reset your Styly password — link inside");
  await sendEmail(email, "🔑 Reset your Styly password", html);
}

// ─── ORDER CONFIRMATION EMAIL (to customer) ────────────────────────────────────
export async function sendOrderConfirmationEmail(email: string, order: {
  orderId: number; customerName: string; items: { name: string; qty: number; price: number }[];
  total: number; paymentMethod: string; address: string;
}) {
  console.log(`[Email] Order confirmation for ${email} — Order #${order.orderId}`);
  const paymentLabels: Record<string, string> = {
    card: "💳 Bank Card",
    d17: "📱 D17",
    flouci: "💸 Flouci",
    cod: "🚚 Cash on Delivery",
  };
  const itemRows = order.items.map(i =>
    `<tr>
      <td style="padding:10px 0;border-bottom:1px solid #f1f5f9;font-size:14px;color:#334155;">${i.name}
        <span style="color:#94a3b8;font-size:12px;"> × ${i.qty}</span>
      </td>
      <td style="padding:10px 0;border-bottom:1px solid #f1f5f9;text-align:right;font-size:14px;font-weight:700;color:#e11d48;">${(i.price * i.qty).toLocaleString()} TND</td>
    </tr>`
  ).join("");

  const html = brandedEmail(`
    <p style="font-size:22px;font-weight:800;color:#0f172a;margin:0 0 4px;">Order confirmed! 🎉</p>
    <p style="font-size:15px;color:#64748b;margin:0 0 28px;">Hi ${order.customerName}, your order <strong style="color:#e11d48;">#${order.orderId}</strong> is confirmed and will be prepared shortly.</p>

    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:20px;">
      <thead>
        <tr>
          <td style="font-size:11px;color:#94a3b8;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;padding-bottom:10px;">Item</td>
          <td style="font-size:11px;color:#94a3b8;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;padding-bottom:10px;text-align:right;">Price</td>
        </tr>
      </thead>
      <tbody>${itemRows}</tbody>
      <tfoot>
        <tr>
          <td style="padding:14px 0 0;font-size:16px;font-weight:900;color:#0f172a;">Total</td>
          <td style="padding:14px 0 0;text-align:right;font-size:18px;font-weight:900;color:#e11d48;">${order.total.toLocaleString()} TND</td>
        </tr>
      </tfoot>
    </table>

    ${infoCard("Payment Method", paymentLabels[order.paymentMethod] || order.paymentMethod)}
    ${infoCard("Delivery Address", order.address)}

    <p style="margin:24px 0 0;font-size:13px;color:#94a3b8;text-align:center;">We'll send you another email when your order is on its way. 📦</p>
  `, `Order #${order.orderId} confirmed — thank you!`);
  await sendEmail(email, `✅ Order #${order.orderId} confirmed — Styly`, html);
}

// ─── BRAND NEW ORDER EMAIL ─────────────────────────────────────────────────────
export async function sendBrandOrderEmail(brandEmail: string, data: {
  brandName: string; orderId: number; customerName: string; customerPhone: string;
  address: string; items: { name: string; qty: number; price: number }[];
}) {
  console.log(`[Email] New order notification for brand ${data.brandName} at ${brandEmail}`);
  const itemRows = data.items.map(i =>
    `<tr>
      <td style="padding:10px 0;border-bottom:1px solid #f1f5f9;font-size:14px;color:#334155;">${i.name}
        <span style="color:#94a3b8;font-size:12px;"> × ${i.qty}</span>
      </td>
      <td style="padding:10px 0;border-bottom:1px solid #f1f5f9;text-align:right;font-size:14px;font-weight:700;color:#e11d48;">${(i.price * i.qty).toLocaleString()} TND</td>
    </tr>`
  ).join("");

  const html = brandedEmail(`
    <p style="font-size:22px;font-weight:800;color:#0f172a;margin:0 0 4px;">New order received! 🛍️</p>
    <p style="font-size:15px;color:#64748b;margin:0 0 28px;">Hi <strong>${data.brandName}</strong> team — a new order <strong style="color:#e11d48;">#${data.orderId}</strong> is waiting for your confirmation on the Brand Dashboard.</p>

    ${infoCard("Customer", data.customerName)}
    ${infoCard("Phone", `📞 ${data.customerPhone}`)}
    ${infoCard("Delivery Address", `📍 ${data.address}`)}

    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:20px 0;">
      <thead>
        <tr>
          <td style="font-size:11px;color:#94a3b8;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;padding-bottom:10px;">Item</td>
          <td style="font-size:11px;color:#94a3b8;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;padding-bottom:10px;text-align:right;">Subtotal</td>
        </tr>
      </thead>
      <tbody>${itemRows}</tbody>
    </table>

    ${ctaButton("https://responsible-harmony-production-8371.up.railway.app/brand", "View Order in Dashboard →")}
  `, `New order #${data.orderId} for ${data.brandName}`);
  await sendEmail(brandEmail, `🛍️ New Order #${data.orderId} — ${data.brandName} via Styly`, html);
}

// ─── ORDER DELIVERED EMAIL (to customer) ──────────────────────────────────────
export async function sendOrderDeliveredEmail(email: string, data: {
  customerName: string; orderId: number;
}) {
  console.log(`[Email] Delivery confirmation for ${email} — Order #${data.orderId}`);
  const html = brandedEmail(`
    <p style="font-size:22px;font-weight:800;color:#0f172a;margin:0 0 4px;">Your order arrived! 🎁</p>
    <p style="font-size:15px;color:#64748b;margin:0 0 28px;">
      Hi ${data.customerName}, great news — order <strong style="color:#e11d48;">#${data.orderId}</strong> has been delivered successfully!
    </p>

    <div style="background:linear-gradient(135deg,#f0fdf4,#dcfce7);border:1px solid #bbf7d0;border-radius:16px;padding:28px;text-align:center;margin:0 0 28px;">
      <p style="font-size:52px;margin:0;">✅</p>
      <p style="font-size:20px;font-weight:900;color:#15803d;margin:10px 0 4px;">Delivered</p>
      <p style="font-size:13px;color:#16a34a;margin:0;">Order #${data.orderId}</p>
    </div>

    <p style="font-size:15px;color:#64748b;line-height:1.6;text-align:center;margin:0 0 8px;">
      We hope you love your new pieces! 💫<br/>
      Share your look with the Styly community on the feed.
    </p>

    ${ctaButton("https://responsible-harmony-production-8371.up.railway.app/feed", "Share Your Look 📸")}
  `, `Your order #${data.orderId} has arrived!`);
  await sendEmail(email, `🎁 Your Styly order #${data.orderId} has been delivered!`, html);
}

