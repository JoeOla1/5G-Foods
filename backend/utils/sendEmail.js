const { Resend } = require("resend");

// Created inside the function so the server still starts
// even if RESEND_API_KEY is missing.
async function sendEmail({ to, subject, html, text }) {
  if (!process.env.RESEND_API_KEY) {
    throw new Error("RESEND_API_KEY is not set.");
  }
  if (!process.env.EMAIL_FROM) {
    throw new Error("EMAIL_FROM is not set.");
  }

  const resend = new Resend(process.env.RESEND_API_KEY);

  const { data, error } = await resend.emails.send({
    from: process.env.EMAIL_FROM,
    to: to,
    subject: subject,
    html: html,
    text: text,
  });

  if (error) {
    throw new Error(error.message || "Failed to send email.");
  }

  return data;
}

module.exports = sendEmail;