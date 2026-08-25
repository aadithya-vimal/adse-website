// Outbound email delivery. No SMTP provider is configured yet — invites are
// logged to the server console and their link is returned to the inviting
// admin. To enable real email, install nodemailer, fill the env vars below
// (SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS) and replace the stub.

export async function sendInviteEmail({ to, name, role, inviteUrl }) {
  const subject = `You have been invited as ${role} — AIML & DS Department`;
  const body =
    `Hello ${name},\n\n` +
    `You have been invited to join the AIML & DS department portal as ${role}.\n` +
    `Accept your invitation using this link: ${inviteUrl}\n\n` +
    `This link expires in 7 days.`;

  if (process.env.SMTP_HOST && process.env.SMTP_USER) {
    // import nodemailer from 'nodemailer' and send for real here
    console.log('[mail] SMTP configured but transporter not wired — printing instead');
  }
  console.log(`\n=== INVITE EMAIL ===\nTo: ${to}\nSubject: ${subject}\n${body}\n====================\n`);
}
