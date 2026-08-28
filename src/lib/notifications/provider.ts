import { Resend } from "resend";
import { siteConfig } from "@/data/site";

const apiKey = process.env.RESEND_API_KEY;
export const resend = apiKey ? new Resend(apiKey) : null;

export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
}

export async function sendEmail(options: SendEmailOptions): Promise<void> {
  if (!resend) {
    console.warn(
      "[Notifications] RESEND_API_KEY not set. Email not sent:",
      options.subject,
      "to",
      options.to
    );
    return;
  }

  const defaultFrom =
    process.env.EMAIL_FROM || "FRISØR KBH <booking@frisorkbh.dk>";

  const { error } = await resend.emails.send({
    from: defaultFrom,
    replyTo:
      options.replyTo ||
      process.env.EMAIL_REPLY_TO ||
      siteConfig.contact.email,
    to: options.to,
    subject: options.subject,
    html: options.html,
    text: options.text,
  });

  if (error) {
    throw new Error(`Failed to send email: ${error.message}`);
  }
}
