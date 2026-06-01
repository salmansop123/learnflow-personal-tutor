import { render } from "@react-email/render";
import { Resend } from "resend";

import {
  ReminderEmail,
  type ReminderEmailProps,
} from "../../emails/ReminderEmail";

function getResend() {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error("RESEND_API_KEY is not configured");
  }
  return new Resend(apiKey);
}

function getEmailFrom(): string {
  return process.env.EMAIL_FROM ?? "LearnFlow <onboarding@resend.dev>";
}

export async function sendReminderEmail(
  to: string,
  data: ReminderEmailProps
): Promise<{ id?: string }> {
  const html = await render(ReminderEmail(data));
  const resend = getResend();

  const result = await resend.emails.send({
    from: getEmailFrom(),
    to,
    subject: `LearnFlow Reminder: ${data.title}`,
    html,
  });

  if (result.error) {
    throw new Error(result.error.message);
  }

  return { id: result.data?.id };
}

export type ContactEmailPayload = {
  name: string;
  email: string;
  message: string;
};

function getContactToEmail(): string {
  return process.env.CONTACT_TO_EMAIL ?? "support@learnflow.app";
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export async function sendContactEmail(
  data: ContactEmailPayload
): Promise<{ id?: string }> {
  const resend = getResend();
  const safeName = escapeHtml(data.name);
  const safeEmail = escapeHtml(data.email);
  const safeMessage = escapeHtml(data.message).replace(/\n/g, "<br />");

  const result = await resend.emails.send({
    from: getEmailFrom(),
    to: getContactToEmail(),
    replyTo: data.email,
    subject: `LearnFlow contact: ${data.name}`,
    html: `
      <p><strong>Name:</strong> ${safeName}</p>
      <p><strong>Email:</strong> ${safeEmail}</p>
      <p><strong>Message:</strong></p>
      <p>${safeMessage}</p>
    `,
  });

  if (result.error) {
    throw new Error(result.error.message);
  }

  return { id: result.data?.id };
}
