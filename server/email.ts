import nodemailer from "nodemailer";

// ─── Shared sender helper ──────────────────────────────────────────────────────
const FROM = process.env.SMTP_FROM || "Styly <onboarding@resend.dev>";

async function sendEmail(to: string, subject: string, html: string) {
  console.log(`\n══════════════════════════════════════════════`);
  console.log(`[Email] To: ${to} | Subject: ${subject}`);
  console.log(`══════════════════════════════════════════════\n`);

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
        return;
      }
      console.error(`[Email] Resend error ${resp.status}:`, err.message);
    } catch (e: any) { console.error(`[Email] Resend fetch failed:`, e.message); }
  }

  if (process.env.SMTP_HOST) {
    try {
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || "587"),
        secure: process.env.SMTP_SECURE === "true",
        auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
      });
      await transporter.sendMail({ from: FROM, to, subject, html });
      console.log(`[Email] ✅ Sent via SMTP`);
    } catch (e: any) { console.error(`[Email] SMTP failed:`, e.message); }
  }
}

// ─── Branded wrapper ───────────────────────────────────────────────────────────
function brandedEmail(content: string) {
  return `
    <div style="font-family: sans-serif; max-width: 560px; margin: 0 auto; background: #fff; border-radius: 16px; overflow: hidden; border: 1px solid #e5e7eb;">
      <div style="background: linear-gradient(135deg, #FF5E3A, #FF8A3A); padding: 28px 32px; text-align: center;">
        <h1 style="color: #fff; margin: 0; font-size: 28px; font-weight: 900; letter-spacing: -1px;">Styly</h1>
        <p style="color: rgba(255,255,255,0.85); margin: 4px 0 0; font-size: 13px;">Your Digital Fashion Closet</p>
      </div>
      <div style="padding: 32px;">${content}</div>
      <div style="padding: 20px 32px; background: #f9fafb; text-align: center; color: #9ca3af; font-size: 12px; border-top: 1px solid #f3f4f6;">
        &copy; ${new Date().getFullYear()} Styly Platform. All rights reserved.
      </div>
    </div>`;
}

// ─── VERIFICATION EMAIL ────────────────────────────────────────────────────────
export async function sendVerificationEmail(email: string, code: string) {
  console.log(`[Email] Verification code for ${email}: ${code}`);
  const html = brandedEmail(`
    <p style="font-size: 16px; color: #374151; margin: 0 0 16px;">Hello,</p>
    <p style="font-size: 15px; color: #374151; margin: 0 0 24px;">Please verify your Styly account using the code below:</p>
    <div style="font-size: 38px; font-weight: 900; letter-spacing: 8px; text-align: center; margin: 32px 0; color: #FF5E3A; font-family: monospace; background: #fff5f2; padding: 20px; border-radius: 12px;">
      ${code}
    </div>
    <p style="font-size: 13px; color: #9ca3af; margin: 0; text-align: center;">Valid for 10 minutes. If you didn't request this, ignore this email.</p>`);
  await sendEmail(email, "Verify your Styly Account", html);
}

// ─── PASSWORD RESET EMAIL ──────────────────────────────────────────────────────
export async function sendPasswordResetEmail(email: string, resetUrl: string) {
  console.log(`[Email] Password reset link for ${email}: ${resetUrl}`);
  const html = brandedEmail(`
    <p style="font-size: 16px; color: #374151; margin: 0 0 16px;">Hello,</p>
    <p style="font-size: 15px; color: #374151; margin: 0 0 24px;">We received a request to reset your Styly password. Click the button below to set a new password:</p>
    <div style="text-align: center; margin: 32px 0;">
      <a href="${resetUrl}" style="background: linear-gradient(135deg, #FF5E3A, #FF8A3A); color: #fff; text-decoration: none; padding: 14px 32px; border-radius: 50px; font-weight: 800; font-size: 15px; display: inline-block;">Reset My Password</a>
    </div>
    <p style="font-size: 13px; color: #9ca3af; margin: 0; text-align: center;">This link expires in 1 hour. If you didn't request this, your account is still safe.</p>`);
  await sendEmail(email, "Reset your Styly Password", html);
}

// ─── ORDER CONFIRMATION EMAIL (to customer) ────────────────────────────────────
export async function sendOrderConfirmationEmail(email: string, order: {
  orderId: number; customerName: string; items: { name: string; qty: number; price: number }[];
  total: number; paymentMethod: string; address: string;
}) {
  console.log(`[Email] Order confirmation for ${email} — Order #${order.orderId}`);
  const itemRows = order.items.map(i =>
    `<tr><td style="padding: 8px 0; color: #374151;">${i.name} × ${i.qty}</td><td style="padding: 8px 0; text-align: right; color: #FF5E3A; font-weight: 700;">${(i.price * i.qty).toLocaleString()} TND</td></tr>`
  ).join("");
  const paymentLabels: Record<string, string> = { card: "💳 Bank Card", d17: "📱 D17", flouci: "💸 Flouci", cod: "🚚 Cash on Delivery" };
  const html = brandedEmail(`
    <p style="font-size: 16px; color: #374151; margin: 0 0 8px;">Hi ${order.customerName},</p>
    <p style="font-size: 15px; color: #374151; margin: 0 0 24px;">🎉 Your order <strong>#${order.orderId}</strong> has been placed successfully!</p>
    <table style="width: 100%; border-collapse: collapse; margin: 0 0 24px;">
      <tbody>${itemRows}</tbody>
      <tfoot>
        <tr style="border-top: 2px solid #f3f4f6;">
          <td style="padding: 12px 0; font-weight: 900; font-size: 16px;">Total</td>
          <td style="padding: 12px 0; text-align: right; font-weight: 900; font-size: 16px; color: #FF5E3A;">${order.total.toLocaleString()} TND</td>
        </tr>
      </tfoot>
    </table>
    <div style="background: #f9fafb; border-radius: 12px; padding: 16px; margin: 0 0 24px;">
      <p style="margin: 0 0 8px; font-size: 13px; color: #6b7280; font-weight: 600;">PAYMENT METHOD</p>
      <p style="margin: 0; font-size: 15px; color: #374151; font-weight: 700;">${paymentLabels[order.paymentMethod] || order.paymentMethod}</p>
    </div>
    <div style="background: #f9fafb; border-radius: 12px; padding: 16px;">
      <p style="margin: 0 0 8px; font-size: 13px; color: #6b7280; font-weight: 600;">DELIVERY ADDRESS</p>
      <p style="margin: 0; font-size: 14px; color: #374151;">${order.address}</p>
    </div>`);
  await sendEmail(email, `Order Confirmed #${order.orderId} — Styly`, html);
}

// ─── BRAND NEW ORDER EMAIL ─────────────────────────────────────────────────────
export async function sendBrandOrderEmail(brandEmail: string, data: {
  brandName: string; orderId: number; customerName: string; customerPhone: string;
  address: string; items: { name: string; qty: number; price: number }[];
}) {
  console.log(`[Email] New order notification for brand ${data.brandName} at ${brandEmail}`);
  const itemRows = data.items.map(i =>
    `<tr><td style="padding: 8px 0; color: #374151;">${i.name} × ${i.qty}</td><td style="padding: 8px 0; text-align: right; font-weight: 700;">${(i.price * i.qty).toLocaleString()} TND</td></tr>`
  ).join("");
  const html = brandedEmail(`
    <p style="font-size: 16px; color: #374151; margin: 0 0 8px;">Hi ${data.brandName} team,</p>
    <p style="font-size: 15px; color: #374151; margin: 0 0 24px;">🛍️ You have a new order <strong>#${data.orderId}</strong> waiting for your confirmation!</p>
    <div style="background: #f9fafb; border-radius: 12px; padding: 16px; margin: 0 0 20px;">
      <p style="margin: 0 0 4px; font-size: 13px; color: #6b7280; font-weight: 600;">CUSTOMER</p>
      <p style="margin: 0; font-size: 15px; font-weight: 700; color: #374151;">${data.customerName}</p>
      <p style="margin: 4px 0 0; font-size: 13px; color: #6b7280;">📞 ${data.customerPhone}</p>
      <p style="margin: 4px 0 0; font-size: 13px; color: #6b7280;">📍 ${data.address}</p>
    </div>
    <table style="width: 100%; border-collapse: collapse; margin: 0 0 24px;">
      <tbody>${itemRows}</tbody>
    </table>
    <p style="font-size: 13px; color: #9ca3af; margin: 0;">Log in to your Brand Dashboard to confirm this shipment.</p>`);
  await sendEmail(brandEmail, `New Order #${data.orderId} — ${data.brandName} via Styly`, html);
}

// ─── ORDER DELIVERED EMAIL (to customer) ──────────────────────────────────────
export async function sendOrderDeliveredEmail(email: string, data: {
  customerName: string; orderId: number;
}) {
  console.log(`[Email] Delivery confirmation for ${email} — Order #${data.orderId}`);
  const html = brandedEmail(`
    <p style="font-size: 16px; color: #374151; margin: 0 0 8px;">Hi ${data.customerName},</p>
    <p style="font-size: 22px; font-weight: 900; color: #374151; margin: 0 0 16px;">🎉 Your order has arrived!</p>
    <p style="font-size: 15px; color: #374151; margin: 0 0 24px;">Order <strong>#${data.orderId}</strong> has been delivered successfully. We hope you love your new pieces!</p>
    <div style="text-align: center; padding: 32px; background: linear-gradient(135deg, #f0fdf4, #dcfce7); border-radius: 16px; margin: 0 0 24px;">
      <p style="font-size: 48px; margin: 0;">✅</p>
      <p style="font-size: 18px; font-weight: 900; color: #16a34a; margin: 8px 0 0;">Delivered</p>
    </div>
    <p style="font-size: 13px; color: #9ca3af; margin: 0; text-align: center;">Thank you for shopping with Styly. Share your look on the feed! 📸</p>`);
  await sendEmail(email, `Your order #${data.orderId} has been delivered 🎉`, html);
}

