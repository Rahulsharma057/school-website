const nodemailer = require("nodemailer");

let transporter = null;

const getTransporter = () => {
  if (transporter) return transporter;
  if (!process.env.SMTP_HOST) return null;

  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === "true",
    auth: process.env.SMTP_USER
      ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
      : undefined,
  });

  return transporter;
};

// Best-effort mail sender — silently no-ops if SMTP isn't configured, and
// never throws, since a notification email failing should never break the
// request (form submission) that triggered it.
const sendMail = async ({ to, subject, html }) => {
  const t = getTransporter();
  if (!t || !to) return;

  try {
    await t.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to,
      subject,
      html,
    });
  } catch (err) {
    console.error("sendMail failed:", err.message);
  }
};

module.exports = sendMail;