// src/lib/email.ts
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM = process.env.RESEND_FROM_EMAIL || "KODEO <onboarding@kodeo.website>";

/**
 * Shared KODEO-branded HTML wrapper for transactional emails.
 * Dark background, lime accent, Inter-esque system font stack
 * (email clients don't reliably load Google Fonts).
 */
function emailShell({
  heading,
  body,
}: {
  heading: string;
  body: string;
}) {
  return `
  <div style="background:#0a0a0a;padding:40px 20px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
    <table role="presentation" width="100%" style="max-width:440px;margin:0 auto;">
      <tr>
        <td style="padding-bottom:28px;text-align:center;">
          <div style="display:inline-flex;align-items:center;gap:8px;">
            <span style="font-size:18px;font-weight:800;letter-spacing:0.08em;color:#ffffff;">◈ KODEO</span>
          </div>
        </td>
      </tr>
      <tr>
        <td style="background:#111111;border:1px solid #242424;border-radius:16px;padding:36px 32px;">
          <h1 style="margin:0 0 12px;font-size:20px;font-weight:700;color:#ffffff;">${heading}</h1>
          ${body}
        </td>
      </tr>
      <tr>
        <td style="padding-top:24px;text-align:center;">
          <p style="margin:0;font-size:12px;color:#6b6b70;">
            © 2026 KODEO Systems. If you didn't request this, you can safely ignore this email.
          </p>
        </td>
      </tr>
    </table>
  </div>`;
}

function otpBlock(otp: string) {
  return `
    <div style="margin:24px 0;text-align:center;">
      <span style="display:inline-block;padding:14px 28px;background:#1a1a1a;border:1px solid #333333;border-radius:12px;font-family:'Courier New',monospace;font-size:32px;font-weight:700;letter-spacing:10px;color:#d7fb43;">
        ${otp}
      </span>
    </div>
    <p style="margin:0;font-size:13px;color:#a1a1aa;text-align:center;">This code expires in 10 minutes.</p>`;
}

export async function sendOtpEmail({
  to,
  otp,
  type,
}: {
  to: string;
  otp: string;
  type: "email-verification" | "sign-in" | "forget-password" | "change-email";
}) {
  const copy: Record<typeof type, { subject: string; heading: string; lead: string }> = {
    "email-verification": {
      subject: "Verify your KODEO account",
      heading: "Verify your email",
      lead: "Enter this code to confirm your email address and finish creating your account.",
    },
    "sign-in": {
      subject: "Your KODEO sign-in code",
      heading: "Sign in to KODEO",
      lead: "Enter this code to sign in.",
    },
    "forget-password": {
      subject: "Reset your KODEO password",
      heading: "Reset your password",
      lead: "Enter this code to set a new password for your account.",
    },
    "change-email": {
      subject: "Confirm your new KODEO email",
      heading: "Confirm your new email",
      lead: "Enter this code to confirm this email address change.",
    },
  };

  const { subject, heading, lead } = copy[type];

  await resend.emails.send({
    from: FROM,
    to,
    subject,
    html: emailShell({
      heading,
      body: `
        <p style="margin:0 0 4px;font-size:14px;color:#a1a1aa;line-height:1.6;">${lead}</p>
        ${otpBlock(otp)}
      `,
    }),
  });
}

export async function sendWelcomeEmail({ to, name }: { to: string; name: string }) {
  await resend.emails.send({
    from: FROM,
    to,
    subject: "Welcome to KODEO",
    html: emailShell({
      heading: `Welcome, ${name || "there"} 👋`,
      body: `
        <p style="margin:0;font-size:14px;color:#a1a1aa;line-height:1.6;">
          Your account is verified and ready. Head back to KODEO to finish setting up your profile and land on your dashboard.
        </p>
      `,
    }),
  });
}

/**
 * Sent to OAuth-only users (no password) when they request account
 * deletion — Better Auth requires this confirmation step since there's
 * no password to re-verify against for those accounts.
 */
export async function sendAccountDeletionEmail({ to, url }: { to: string; url: string }) {
  await resend.emails.send({
    from: FROM,
    to,
    subject: "Confirm account deletion — KODEO",
    html: emailShell({
      heading: "Confirm account deletion",
      body: `
        <p style="margin:0 0 20px;font-size:14px;color:#a1a1aa;line-height:1.6;">
          We received a request to permanently delete your KODEO account. This cannot be undone. If this was you, confirm below.
        </p>
        <div style="text-align:center;">
          <a href="${url}" style="display:inline-block;padding:12px 28px;background:#f87171;border-radius:10px;color:#0a0a0a;font-weight:700;font-size:14px;text-decoration:none;">
            Confirm deletion
          </a>
        </div>
        <p style="margin:20px 0 0;font-size:12px;color:#6b6b70;text-align:center;">
          If you didn't request this, ignore this email — your account is safe.
        </p>
      `,
    }),
  });
}

/**
 * Sent when someone invites another person to a KODEO workspace
 * (Part 2c). `acceptUrl` points at the public /invite/[token] landing
 * page on kodeo.website — that page itself handles both "not signed
 * in yet" (prompts sign-up/login first) and "signed in" (shows an
 * Accept / Decline choice) rather than baking any auth state into the
 * link itself.
 */
export async function sendWorkspaceInvitationEmail({
  to,
  workspaceName,
  inviterName,
  role,
  acceptUrl,
}: {
  to: string;
  workspaceName: string;
  inviterName: string;
  role: string;
  acceptUrl: string;
}) {
  const roleLabel = role.charAt(0).toUpperCase() + role.slice(1);

  await resend.emails.send({
    from: FROM,
    to,
    subject: `${inviterName} invited you to join ${workspaceName} on KODEO`,
    html: emailShell({
      heading: `You're invited to ${workspaceName}`,
      body: `
        <p style="margin:0 0 20px;font-size:14px;color:#a1a1aa;line-height:1.6;">
          <strong style="color:#ffffff;">${inviterName}</strong> invited you to join
          <strong style="color:#ffffff;">${workspaceName}</strong> on KODEO as
          <strong style="color:#d7fb43;">${roleLabel}</strong>.
        </p>
        <div style="text-align:center;">
          <a href="${acceptUrl}" style="display:inline-block;padding:12px 28px;background:#d7fb43;border-radius:10px;color:#08090a;font-weight:700;font-size:14px;text-decoration:none;">
            View invitation
          </a>
        </div>
        <p style="margin:20px 0 0;font-size:12px;color:#6b6b70;text-align:center;">
          This invitation expires in 7 days. If you weren't expecting this, you can ignore this email.
        </p>
      `,
    }),
  });
}
