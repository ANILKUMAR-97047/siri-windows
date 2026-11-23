import nodemailer from "nodemailer";

interface SendResetEmailOptions {
  to: string;
  name: string;
  resetUrl: string;
}

// Create reusable SMTP transporter using .env.local Gmail SMTP configuration
export function getMailTransporter() {
  const host = process.env.SMTP_HOST || "smtp.gmail.com";
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASSWORD;

  if (!user || !pass) {
    throw new Error(
      "Gmail SMTP configuration missing: SMTP_USER or SMTP_PASSWORD not set in .env.local"
    );
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: {
      user,
      pass,
    },
  });
}

// Send official password reset email to administrator
export async function sendPasswordResetEmail({
  to,
  name,
  resetUrl,
}: SendResetEmailOptions): Promise<{ success: boolean; messageId?: string }> {
  const transporter = getMailTransporter();
  const fromAddress =
    process.env.MAIL_FROM ||
    process.env.SMTP_USER ||
    '"Siri Windows Admin Security" <sirienterprises8003@gmail.com>';

  const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Your Siri Windows Admin Password</title>
  <style>
    body {
      font-family: 'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background-color: #0b1120;
      color: #f1f5f9;
      margin: 0;
      padding: 0;
      line-height: 1.6;
    }
    .wrapper {
      max-width: 580px;
      margin: 30px auto;
      background: #0f172a;
      border: 1px solid #1e293b;
      border-radius: 20px;
      overflow: hidden;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
    }
    .header {
      background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
      padding: 32px 30px;
      text-align: center;
      border-bottom: 1px solid #334155;
    }
    .logo-badge {
      display: inline-block;
      width: 48px;
      height: 48px;
      line-height: 48px;
      background: #f59e0b;
      color: #0b1120;
      font-weight: 900;
      font-size: 24px;
      border-radius: 14px;
      margin-bottom: 12px;
    }
    .brand-title {
      font-size: 20px;
      font-weight: 800;
      color: #ffffff;
      letter-spacing: -0.02em;
      margin: 0;
    }
    .brand-subtitle {
      font-size: 11px;
      color: #94a3b8;
      margin-top: 4px;
      text-transform: uppercase;
      letter-spacing: 0.1em;
    }
    .content {
      padding: 36px 32px;
      color: #cbd5e1;
    }
    .greeting {
      font-size: 16px;
      font-weight: 700;
      color: #ffffff;
      margin-bottom: 14px;
    }
    .text {
      font-size: 14px;
      color: #94a3b8;
      margin-bottom: 24px;
      line-height: 1.65;
    }
    .cta-container {
      text-align: center;
      margin: 32px 0;
    }
    .cta-button {
      display: inline-block;
      background-color: #f59e0b;
      color: #0f172a !important;
      text-decoration: none;
      font-weight: 800;
      font-size: 14px;
      padding: 14px 34px;
      border-radius: 12px;
      box-shadow: 0 8px 24px rgba(245, 158, 11, 0.25);
      transition: background-color 0.2s;
    }
    .expiry-note {
      background: rgba(245, 158, 11, 0.08);
      border: 1px solid rgba(245, 158, 11, 0.2);
      border-radius: 10px;
      padding: 12px 16px;
      font-size: 12px;
      color: #fbbf24;
      margin-bottom: 24px;
    }
    .link-fallback {
      font-size: 11px;
      color: #64748b;
      word-break: break-all;
      margin-top: 24px;
      padding-top: 20px;
      border-top: 1px solid #1e293b;
    }
    .link-fallback a {
      color: #f59e0b;
      text-decoration: underline;
    }
    .footer {
      background: #090d16;
      padding: 20px 30px;
      text-align: center;
      border-top: 1px solid #1e293b;
      font-size: 11px;
      color: #64748b;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <div class="logo-badge">S</div>
      <h1 class="brand-title">Siri Windows & Doors</h1>
      <div class="brand-subtitle">Admin Operations & Security Portal</div>
    </div>
    <div class="content">
      <div class="greeting">Hello ${name || "Administrator"},</div>
      <p class="text">
        We received an official request to reset the password for your administrator account (<strong>${to}</strong>). Click the secure button below to set a new password:
      </p>

      <div class="cta-container">
        <a href="${resetUrl}" target="_blank" class="cta-button">Reset Admin Password &rarr;</a>
      </div>

      <div class="expiry-note">
        ⏱️ <strong>Security Notice:</strong> This password reset link is single-use and will expire in <strong>1 hour</strong>.
      </div>

      <p class="text" style="margin-bottom: 0;">
        If you did not request this password reset, you can safely ignore this email. Your existing credentials remain completely secure.
      </p>

      <div class="link-fallback">
        If the button above does not work, copy and paste this URL into your browser:<br>
        <a href="${resetUrl}">${resetUrl}</a>
      </div>
    </div>
    <div class="footer">
      Siri Windows & Doors &bull; Tanuku HQ, Andhra Pradesh &bull; Internal Admin Operations
    </div>
  </div>
</body>
</html>
`;

  const info = await transporter.sendMail({
    from: fromAddress,
    to,
    subject: "Reset Your Siri Windows Admin Password",
    text: `Hello ${name || "Administrator"},\n\nWe received a request to reset your password for your Siri Windows Admin account (${to}).\n\nReset your password here (link expires in 1 hour):\n${resetUrl}\n\nIf you did not request this, you can ignore this email.\n\nSiri Windows & Doors`,
    html: htmlContent,
  });

  return { success: true, messageId: info.messageId };
}

export interface SendCustomerInquiryOptions {
  to: string;
  name: string;
  city?: string;
  product?: string;
  message?: string;
}

function escapeHtml(str: string): string {
  if (!str) return "";
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// Send official confirmation email to customer after contact form submission
export async function sendCustomerInquiryConfirmationEmail({
  to,
  name,
  city,
  product,
  message,
}: SendCustomerInquiryOptions): Promise<{ success: boolean; messageId?: string }> {
  const transporter = getMailTransporter();
  const fromAddress =
    process.env.MAIL_FROM ||
    `"Siri Windows & Doors" <${process.env.SMTP_USER || "sirienterprises8003@gmail.com"}>`;

  const safeName = escapeHtml(name || "Valued Customer");
  const safeCity = escapeHtml(city || "Not Specified");
  const safeProduct = escapeHtml(product || "UPVC & Aluminium Windows & Doors");
  const safeMessage = message ? escapeHtml(message.slice(0, 300)) : "";

  const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Inquiry Received - Siri Windows & Doors</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      background-color: #f8fafc;
      color: #334155;
      margin: 0;
      padding: 0;
      -webkit-font-smoothing: antialiased;
    }
    .wrapper {
      max-width: 580px;
      margin: 24px auto;
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 4px 16px rgba(15, 23, 42, 0.06);
    }
    .header {
      background: #0f172a;
      padding: 28px 24px;
      text-align: center;
      border-bottom: 3px solid #f59e0b;
    }
    .logo-badge {
      display: inline-block;
      width: 44px;
      height: 44px;
      line-height: 44px;
      background: #f59e0b;
      color: #0f172a;
      font-weight: 900;
      font-size: 22px;
      border-radius: 12px;
      margin-bottom: 10px;
      text-align: center;
    }
    .brand-title {
      font-size: 20px;
      font-weight: 800;
      color: #ffffff;
      margin: 0;
      letter-spacing: -0.02em;
    }
    .brand-subtitle {
      font-size: 11px;
      color: #94a3b8;
      margin-top: 4px;
      text-transform: uppercase;
      letter-spacing: 0.08em;
    }
    .content {
      padding: 30px 24px;
    }
    .status-badge {
      display: inline-block;
      background: #ecfdf5;
      border: 1px solid #a7f3d0;
      color: #047857;
      font-size: 12px;
      font-weight: 700;
      padding: 4px 12px;
      border-radius: 9999px;
      margin-bottom: 16px;
    }
    .greeting {
      font-size: 16px;
      font-weight: 700;
      color: #0f172a;
      margin-bottom: 10px;
    }
    .text {
      font-size: 14px;
      color: #475569;
      line-height: 1.6;
      margin: 0 0 20px 0;
    }
    .summary-card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 16px 18px;
      margin-bottom: 24px;
    }
    .summary-title {
      font-size: 12px;
      font-weight: 700;
      color: #0f172a;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 12px;
      padding-bottom: 8px;
      border-bottom: 1px solid #e2e8f0;
    }
    .contact-box {
      background: #fffbeb;
      border: 1px solid #fde68a;
      border-radius: 12px;
      padding: 14px 16px;
      margin-bottom: 24px;
      font-size: 13px;
      color: #92400e;
      line-height: 1.5;
    }
    .footer {
      background: #f1f5f9;
      padding: 20px 24px;
      text-align: center;
      border-top: 1px solid #e2e8f0;
      font-size: 11px;
      color: #64748b;
      line-height: 1.6;
    }
    @media only screen and (max-width: 600px) {
      .wrapper {
        margin: 0 !important;
        border-radius: 0 !important;
        border: none !important;
      }
      .content {
        padding: 24px 16px !important;
      }
      .header {
        padding: 24px 16px !important;
      }
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <div class="logo-badge">S</div>
      <h1 class="brand-title">Siri Windows &amp; Doors</h1>
      <div class="brand-subtitle">Tanuku Fabrication &amp; Installation Works</div>
    </div>
    <div class="content">
      <div class="status-badge">&#10003; Request Received Successfully</div>
      <div class="greeting">Hello ${safeName},</div>
      <p class="text">
        Thank you for contacting <strong>Siri Windows &amp; Doors</strong>! Your inquiry has been received by our workshop. Our team will review your specifications and contact you shortly to assist with measurement, custom fabrication options, and accurate pricing.
      </p>

      <table width="100%" cellpadding="0" cellspacing="0" class="summary-card" style="width: 100%; border-collapse: collapse; margin-bottom: 24px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px;">
        <tr>
          <td colspan="2" class="summary-title" style="padding: 12px 14px 8px 14px; font-size: 12px; font-weight: 700; color: #0f172a; text-transform: uppercase; border-bottom: 1px solid #e2e8f0;">
            Inquiry Summary
          </td>
        </tr>
        <tr>
          <td style="padding: 8px 14px; color: #64748b; font-size: 13px;">Product Interest:</td>
          <td style="padding: 8px 14px; color: #0f172a; font-size: 13px; font-weight: 600; text-align: right;">${safeProduct}</td>
        </tr>
        <tr>
          <td style="padding: 8px 14px; color: #64748b; font-size: 13px;">Location / City:</td>
          <td style="padding: 8px 14px; color: #0f172a; font-size: 13px; font-weight: 600; text-align: right;">${safeCity}</td>
        </tr>
        ${safeMessage
      ? `<tr>
          <td style="padding: 8px 14px 12px 14px; color: #64748b; font-size: 13px; vertical-align: top;">Your Message:</td>
          <td style="padding: 8px 14px 12px 14px; color: #0f172a; font-size: 13px; font-weight: 500; text-align: right; max-width: 250px;">&quot;${safeMessage}&quot;</td>
        </tr>`
      : ""
    }
      </table>

      <div class="contact-box">
        <strong>Need urgent assistance?</strong><br>
        Feel free to call our Tanuku workshop directly at <strong>+91 9985168003</strong> or <strong>+91 7780127475</strong> during business hours.
      </div>

      <p class="text" style="margin-bottom: 0; font-size: 13px; color: #64748b;">
        Warm regards,<br>
        <strong style="color: #0f172a;">Customer Relations &amp; Fabrication Team</strong><br>
        Siri Windows &amp; Doors
      </p>
    </div>
    <div class="footer">
      Siri Windows &amp; Doors &bull; NH-16 Service Road, Tanuku, West Godavari District, Andhra Pradesh<br>
      This is an automated confirmation sent to ${to}.
    </div>
  </div>
</body>
</html>`;

  const textContent = `Hello ${safeName},

Thank you for contacting Siri Windows & Doors!

Your request has been submitted successfully. Our team will review your requirements and contact you shortly to assist with measurement, custom fabrication options, and accurate pricing.

Inquiry Summary:
- Product Interest: ${product || "UPVC & Aluminium Windows & Doors"}
- Location: ${city || "Not Specified"}
${message ? `- Message: "${message}"\n` : ""}
Need immediate assistance?
Call our Tanuku workshop directly at +91 98491 23456 / +91 98480 12345.

Warm regards,
Customer Relations & Fabrication Team
Siri Windows & Doors
Tanuku, West Godavari, Andhra Pradesh`;

  const info = await transporter.sendMail({
    from: fromAddress,
    to,
    subject: "Your Request is Received – Siri Windows & Doors",
    text: textContent,
    html: htmlContent,
  });

  return { success: true, messageId: info.messageId };
}
