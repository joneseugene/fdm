import "server-only";

import { serverEnv } from "@/server/env";

/**
 * Transactional emails. Email clients aren't browsers: table layout and
 * inline styles only, no web fonts or external CSS.
 */
const BRAND = "#E8B523";
const INK = "#2A2219";
const MUTED = "#6B6157";
const BORDER = "#ECE6DC";
const CANVAS = "#FBF8F1";
const FONT = "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";
const NAME = "Faith and Deliverance Ministries Global";

type Content = {
  subject: string;
  preview: string;
  heading: string;
  paragraphs: string[];
  /** A one-time code shown large (e.g. invitation code). */
  code?: string;
  action?: { label: string; url: string };
  note?: string;
};

const escape = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

function render({ subject, preview, heading, paragraphs, code, action, note }: Content) {
  const year = new Date().getFullYear();
  const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escape(heading)}</title></head>
<body style="margin:0;padding:0;background:${CANVAS};font-family:${FONT};">
<div style="display:none;max-height:0;overflow:hidden;">${escape(preview)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${CANVAS};">
<tr><td align="center" style="padding:32px 16px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">
<tr><td style="padding:0 4px 20px;font-size:17px;font-weight:800;color:${INK};">${NAME}</td></tr>
<tr><td style="background:#ffffff;border:1px solid ${BORDER};border-radius:16px;padding:32px 28px;">
<h1 style="margin:0 0 16px;font-size:22px;line-height:30px;color:${INK};">${escape(heading)}</h1>
${paragraphs.map((p) => `<p style="margin:0 0 16px;font-size:15px;line-height:24px;color:${INK};">${escape(p)}</p>`).join("")}
${
  code
    ? `<p style="margin:8px 0 24px;padding:16px;text-align:center;font-size:32px;line-height:40px;font-weight:800;letter-spacing:10px;color:${INK};background:${CANVAS};border:1px solid ${BORDER};border-radius:12px;font-family:Menlo,Consolas,monospace;">${escape(code)}</p>`
    : ""
}
${
  action
    ? `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:8px 0 24px;"><tr><td style="border-radius:9999px;background:${BRAND};">
<a href="${escape(action.url)}" target="_blank" style="display:inline-block;padding:12px 28px;font-size:15px;font-weight:700;color:${INK};text-decoration:none;border-radius:9999px;">${escape(action.label)}</a>
</td></tr></table>
<p style="margin:0 0 20px;font-size:13px;line-height:20px;color:${MUTED};word-break:break-all;">Button not working? Copy this link: ${escape(action.url)}</p>`
    : ""
}
${note ? `<p style="margin:0;padding:12px 16px;font-size:13px;line-height:20px;color:${MUTED};background:${CANVAS};border-radius:10px;">${escape(note)}</p>` : ""}
</td></tr>
<tr><td style="padding:20px 4px 0;font-size:12px;line-height:18px;color:${MUTED};">If you didn&#39;t expect this email, you can ignore it.<br>&copy; ${year} ${NAME}</td></tr>
</table></td></tr></table></body></html>`;

  const text = [
    heading,
    "",
    ...paragraphs.flatMap((p) => [p, ""]),
    ...(code ? [`Your code: ${code}`, ""] : []),
    ...(action ? [`${action.label}: ${action.url}`, ""] : []),
    ...(note ? [note, ""] : []),
    `© ${year} ${NAME}`,
  ].join("\n");

  return { subject, html, text };
}

export function resetPasswordEmail(p: { firstName: string; url: string; minutesValid: number }) {
  return render({
    subject: "Reset your password",
    preview: "Use this link to choose a new password.",
    heading: "Reset your password",
    paragraphs: [`Hi ${p.firstName},`, "Someone asked to reset the password for your website admin account."],
    action: { label: "Choose a new password", url: p.url },
    note: `This link works once and expires in ${p.minutesValid} minutes. If you didn't ask for it, your password stays the same.`,
  });
}

export function inviteEmail(p: {
  firstName: string;
  url: string;
  roleLabel: string;
  duty: string | null;
  hoursValid: number;
}) {
  return render({
    subject: "Set up your FDMG website admin account",
    preview: "Choose a password to activate your account.",
    heading: "You've been invited",
    paragraphs: [
      `Hi ${p.firstName},`,
      `You've been added to the ${NAME} website admin as a ${p.roleLabel}${p.duty ? ` (${p.duty})` : ""}.`,
      "Click the button below to choose your password and activate your account.",
    ],
    action: { label: "Set up my account", url: p.url },
    note: `This link is just for you. It works once and expires in ${p.hoursValid} hours. If you didn't expect this, ignore the email.`,
  });
}

export function testEmail() {
  return render({
    subject: "Test email from the FDMG website",
    preview: "Your email settings work.",
    heading: "Your email settings work",
    paragraphs: ["This test was sent from Admin > Email settings. Invitations and password resets will be sent the same way."],
  });
}

export function newMessageEmail(p: { name: string; email: string; message: string }) {
  return render({
    subject: `New message from ${p.name}`,
    preview: p.message.slice(0, 120),
    heading: "New message from the website",
    paragraphs: [`${p.name} <${p.email}> wrote:`, p.message],
    action: { label: "Open messages", url: new URL("/admin/messages", serverEnv.APP_URL).toString() },
  });
}
