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
