import nodemailer from 'nodemailer';
import { env } from '../config/env.js';

let transporter;

function getTransporter() {
  if (transporter) return transporter;
  const { transport, smtp } = env.email;

  if (transport === 'console') {
    if (env.isProd) throw new Error('EMAIL_TRANSPORT=console is not allowed in production');
    transporter = {
      async sendMail(message) {
        // Development only: lets you sign in locally without an email provider.
        console.log(`\n[email:console] To: ${message.to}\nSubject: ${message.subject}\n${message.text}\n`);
        return { messageId: 'console' };
      },
    };
    return transporter;
  }

  if (transport === 'brevo') {
    const { apiKey, senderEmail, senderName } = env.email.brevo;
    if (!apiKey || !senderEmail) throw new Error('Brevo is not configured. Set BREVO_API_KEY and BREVO_SENDER_EMAIL.');
    transporter = {
      async sendMail(message) {
        const res = await fetch('https://api.brevo.com/v3/smtp/email', {
          method: 'POST',
          headers: { 'api-key': apiKey, 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify({
            sender: { name: senderName, email: senderEmail },
            to: [{ email: message.to }],
            subject: message.subject,
            textContent: message.text,
            ...(message.html ? { htmlContent: message.html } : {}),
          }),
          signal: AbortSignal.timeout(15000),
        });
        if (!res.ok) {
          const detail = await res.text().catch(() => '');
          throw new Error(`Brevo send failed (${res.status}): ${detail.slice(0, 200)}`);
        }
        return res.json();
      },
    };
    return transporter;
  }

  if (transport === 'memory') {
    // Test only: messages are kept in memory for assertions.
    transporter = { outbox: [], async sendMail(message) { this.outbox.push(message); return { messageId: 'memory' }; } };
    return transporter;
  }

  if (!smtp.host || !smtp.user || !smtp.pass) {
    throw new Error('SMTP is not configured. Set SMTP_HOST, SMTP_USER and SMTP_PASS (works with Amazon SES, Resend or any SMTP provider).');
  }
  transporter = nodemailer.createTransport({
    host: smtp.host,
    port: smtp.port,
    secure: smtp.secure,
    auth: { user: smtp.user, pass: smtp.pass },
  });
  return transporter;
}

export const getOutbox = () => getTransporter().outbox || [];

export async function sendOtpEmail(email, otp, purpose = 'signup') {
  const minutes = Math.round(env.otp.ttlSeconds / 60);
  const intro = purpose === 'reset' ? 'Use this code to reset your DARA password:' : 'Welcome to DARA! Use this code to verify your email and create your account:';
  const text = `${intro} ${otp}\n\nIt expires in ${minutes} minutes and can only be used once. If you did not request this code, you can ignore this email.`;
  const html = `
  <div style="font-family:Arial,Helvetica,sans-serif;max-width:480px;margin:0 auto;padding:32px;background:#FFF5F1;color:#1a1a1a">
    <h1 style="font-family:Georgia,serif;letter-spacing:6px;font-weight:400;margin:0 0 4px">DARA</h1>
    <p style="margin:0 0 24px;color:#880E4F;font-size:12px;letter-spacing:2px;text-transform:uppercase">Fashion Jewellery &amp; Accessories</p>
    <p>${intro}</p>
    <p style="font-size:32px;letter-spacing:10px;font-weight:bold;color:#880E4F;margin:12px 0 24px">${otp}</p>
    <p style="color:#555;font-size:14px">This code expires in ${minutes} minutes and can only be used once.</p>
    <p style="color:#888;font-size:12px">If you did not request this code, you can safely ignore this email.</p>
  </div>`;

  await getTransporter().sendMail({ from: env.email.from, to: email, subject: purpose === 'reset' ? `${otp} is your DARA password reset code` : `${otp} is your DARA verification code`, text, html });
}

export async function sendOrderConfirmationEmail(order) {
  const lines = order.items.map((i) => `• ${i.name}${i.variantLabel ? ` (${i.variantLabel})` : ''} × ${i.quantity} — ₹${i.lineTotal}`).join('\n');
  const text = `Thank you for shopping with DARA Fashions!\n\nOrder ${order.orderNumber}\n${lines}\n\nTotal: ₹${order.total}\nPayment: ${order.paymentMethod === 'cod' ? 'Cash on Delivery' : 'Online'}\n\nWe will email you when your order ships.`;
  try {
    await getTransporter().sendMail({ from: env.email.from, to: order.email, subject: `Your DARA order ${order.orderNumber}`, text });
  } catch (err) {
    // Confirmation email failure must not fail the order.
    console.error('Failed to send order confirmation email:', err.message);
  }
}
