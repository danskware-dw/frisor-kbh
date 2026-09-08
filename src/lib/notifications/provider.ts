import { Resend } from "resend";
import { siteConfig } from "@/data/site";

/** Lazily create the Resend client so the env var is read at send time. */
function getResendClient(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return null;
  }
  return new Resend(apiKey);
}

export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
}

export async function sendEmail(options: SendEmailOptions): Promise<void> {
  const resend = getResendClient();

  if (!resend) {
    console.error(
      "[Notifications] RESEND_API_KEY is NOT set in environment. Email skipped:",
      options.subject,
      "to",
      options.to
    );
    return;
  }

  const defaultFrom =
    process.env.EMAIL_FROM || "FRISØR KBH <booking@frisorkbh.dk>";

  console.log(
    `[Notifications] Sending email: "${options.subject}" to ${options.to} from ${defaultFrom}`
  );

  const { data, error } = await resend.emails.send({
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
    console.error("[Notifications] Resend API error:", JSON.stringify(error));
    throw new Error(`Failed to send email: ${error.message}`);
  }

  console.log(
    `[Notifications] Email sent successfully. Resend ID: ${data?.id}`
  );
}

