import nodemailer from 'nodemailer';
import logger from './logger.js';

// ─── Transporter ──────────────────────────────────────────────────────────────

const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT),
    secure: process.env.SMTP_PORT === '465',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
};

// ─── Base Email Template ──────────────────────────────────────────────────────

const baseTemplate = (content) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>TaskHive</title>
  <style>
    body { font-family: 'Inter', Arial, sans-serif; background: #f8fafc; margin: 0; padding: 0; }
    .container { max-width: 560px; margin: 40px auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.07); }
    .header { background: linear-gradient(135deg, #f59e0b, #d97706); padding: 32px 40px; text-align: center; }
    .header h1 { color: #fff; margin: 0; font-size: 28px; font-weight: 800; letter-spacing: -0.5px; }
    .header p { color: rgba(255,255,255,0.85); margin: 4px 0 0; font-size: 14px; }
    .body { padding: 40px; }
    .body p { color: #475569; font-size: 15px; line-height: 1.7; margin: 0 0 16px; }
    .btn { display: inline-block; background: #f59e0b; color: #fff !important; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 15px; margin: 8px 0 24px; }
    .code { background: #f1f5f9; border-radius: 8px; padding: 16px 24px; font-size: 28px; font-weight: 700; letter-spacing: 8px; text-align: center; color: #0f172a; margin: 16px 0; font-family: monospace; }
    .divider { border: none; border-top: 1px solid #e2e8f0; margin: 24px 0; }
    .footer { padding: 24px 40px; background: #f8fafc; text-align: center; }
    .footer p { color: #94a3b8; font-size: 12px; margin: 0; }
    .warning { background: #fff7ed; border: 1px solid #fed7aa; border-radius: 8px; padding: 12px 16px; font-size: 13px; color: #9a3412; margin-top: 16px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🐝 TaskHive</h1>
      <p>Team task management, simplified</p>
    </div>
    <div class="body">${content}</div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} TaskHive. All rights reserved.<br/>
      If you didn't create an account, you can safely ignore this email.</p>
    </div>
  </div>
</body>
</html>
`;

// ─── Email Templates ──────────────────────────────────────────────────────────

const templates = {
  verifyEmail: ({ name, verifyUrl }) => ({
    subject: 'Verify your TaskHive email',
    html: baseTemplate(`
      <p>Hi <strong>${name}</strong>,</p>
      <p>Welcome to TaskHive! We're excited to have you on board. Please verify your email address to get started.</p>
      <div style="text-align:center">
        <a href="${verifyUrl}" class="btn">Verify Email Address</a>
      </div>
      <p style="font-size:13px;color:#94a3b8">Or copy this link:<br/><a href="${verifyUrl}" style="color:#f59e0b;word-break:break-all">${verifyUrl}</a></p>
      <div class="warning">⏱ This link expires in <strong>24 hours</strong>.</div>
    `),
  }),

  passwordReset: ({ name, resetUrl }) => ({
    subject: 'Reset your TaskHive password',
    html: baseTemplate(`
      <p>Hi <strong>${name}</strong>,</p>
      <p>We received a request to reset the password for your account. Click the button below to set a new password.</p>
      <div style="text-align:center">
        <a href="${resetUrl}" class="btn">Reset Password</a>
      </div>
      <p style="font-size:13px;color:#94a3b8">Or copy this link:<br/><a href="${resetUrl}" style="color:#f59e0b;word-break:break-all">${resetUrl}</a></p>
      <div class="warning">⏱ This link expires in <strong>1 hour</strong>. If you didn't request a password reset, please ignore this email — your password will remain unchanged.</div>
    `),
  }),

  passwordChanged: ({ name }) => ({
    subject: 'Your TaskHive password was changed',
    html: baseTemplate(`
      <p>Hi <strong>${name}</strong>,</p>
      <p>This is a confirmation that your TaskHive account password was changed successfully.</p>
      <p>If you did not make this change, please <a href="${process.env.CLIENT_URL}/auth/forgot-password" style="color:#f59e0b">reset your password immediately</a> or contact our support team.</p>
      <hr class="divider"/>
      <p style="font-size:13px;color:#94a3b8">For security, all active sessions have been terminated. Please log in again with your new password.</p>
    `),
  }),

  mentionNotification: ({ name, authorName, taskTitle, commentContent, taskUrl }) => ({
    subject: `${authorName} mentioned you in a comment`,
    html: baseTemplate(`
      <p>Hi ${name},</p>
      <p><strong>${authorName}</strong> mentioned you in a comment on task <strong>${taskTitle}</strong>:</p>
      <blockquote style="border-left:3px solid #f59e0b;padding:8px 16px;margin:12px 0;color:#64748b;font-style:italic">
        "${commentContent}${commentContent.length >= 200 ? '…' : ''}"
      </blockquote>
      <div style="text-align:center">
        <a href="${taskUrl}" class="btn">View Task</a>
      </div>
    `),
  }),

  workspaceInvite: ({ inviterName, workspaceName, role, inviteUrl }) => ({
    subject: `${inviterName} invited you to join ${workspaceName} on TaskHive`,
    html: baseTemplate(`
      <p>Hi there,</p>
      <p><strong>${inviterName}</strong> has invited you to join the <strong>${workspaceName}</strong> workspace on TaskHive as a <strong>${role}</strong>.</p>
      <div style="text-align:center">
        <a href="${inviteUrl}" class="btn">Accept Invitation</a>
      </div>
      <p style="font-size:13px;color:#94a3b8">Or copy this link:<br/><a href="${inviteUrl}" style="color:#f59e0b;word-break:break-all">${inviteUrl}</a></p>
      <div class="warning">⏱ This invitation expires in <strong>7 days</strong>. If you don't have a TaskHive account, you'll be prompted to create one.</div>
    `),
  }),

  welcomeEmail: ({ name }) => ({
    subject: 'Welcome to TaskHive 🐝',
    html: baseTemplate(`
      <p>Hi <strong>${name}</strong>,</p>
      <p>Your email has been verified and your account is ready to go! 🎉</p>
      <p>Here's what you can do with TaskHive:</p>
      <ul style="color:#475569;font-size:15px;line-height:2">
        <li>📋 Create and manage projects</li>
        <li>✅ Assign and track tasks</li>
        <li>👥 Collaborate with your team in real-time</li>
        <li>📊 Track progress with dashboards</li>
      </ul>
      <div style="text-align:center;margin-top:24px">
        <a href="${process.env.CLIENT_URL}/dashboard" class="btn">Go to Dashboard</a>
      </div>
    `),
  }),
};

// ─── Send Email ───────────────────────────────────────────────────────────────

export const sendEmail = async ({ to, templateName, templateData }) => {
  try {
    const transporter = createTransporter();
    const template = templates[templateName](templateData);

    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to,
      subject: template.subject,
      html: template.html,
    });

    logger.info(`Email sent: ${info.messageId} → ${to} [${templateName}]`);
    return info;
  } catch (error) {
    logger.error(`Email send failed to ${to}:`, error);
    throw error;
  }
};