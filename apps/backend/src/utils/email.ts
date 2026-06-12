import { Resend } from "resend";

// Email is optional infrastructure: with EMAIL_ENABLED unset/false (e.g. before
// a sending domain is verified in Resend), links are logged to the console and
// surfaced to callers so the flows remain fully testable.
export const emailEnabled = (): boolean =>
  process.env.EMAIL_ENABLED === "true" && !!process.env.RESEND_API_KEY;

export const appUrl = (): string => process.env.APP_URL ?? "http://localhost:3000";

export const sendEmail = async (params: { to: string; subject: string; html: string }): Promise<void> => {
  if (!emailEnabled()) {
    console.log(`[email disabled] to=${params.to} subject="${params.subject}"`);
    return;
  }

  const resend = new Resend(process.env.RESEND_API_KEY);
  const { error } = await resend.emails.send({
    from: process.env.EMAIL_FROM ?? "CraftStock <onboarding@resend.dev>",
    to: params.to,
    subject: params.subject,
    html: params.html,
  });
  if (error) throw new Error(`Failed to send email: ${error.message}`);
};

export const sendVerificationEmail = async (to: string, businessName: string, rawToken: string): Promise<string> => {
  const link = `${appUrl()}/verify-email?token=${rawToken}`;
  console.log(`[verification link] ${to}: ${link}`);
  await sendEmail({
    to,
    subject: "Verify your CraftStock account",
    html: `<p>Welcome to CraftStock! Confirm your email to activate <strong>${businessName}</strong>.</p>
<p><a href="${link}">Verify my email</a></p>
<p>This link expires in 24 hours. If you didn't sign up, you can ignore this email.</p>`,
  });
  return link;
};

export const sendPasswordResetEmail = async (to: string, rawToken: string): Promise<string> => {
  const link = `${appUrl()}/reset-password?token=${rawToken}`;
  console.log(`[password reset link] ${to}: ${link}`);
  await sendEmail({
    to,
    subject: "Reset your CraftStock password",
    html: `<p>We received a request to reset your password.</p>
<p><a href="${link}">Choose a new password</a></p>
<p>This link expires in 1 hour. If you didn't request this, you can ignore this email.</p>`,
  });
  return link;
};
