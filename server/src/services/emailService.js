const nodemailer = require("nodemailer");
const env = require("../config/env");

let transporter = null;
if (env.email.user && env.email.password) {
  transporter = nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE || "gmail",
    auth: { user: env.email.user, pass: env.email.password },
  });
}

async function sendEmail({ to, subject, text, html }) {
  if (!transporter) {
    console.log(`📧 [email skipped — EMAIL_USER not configured] to=${to} subject="${subject}"`);
    return { skipped: true };
  }
  return transporter.sendMail({
    from: env.email.user,
    to,
    subject,
    text,
    html,
  });
}

module.exports = { sendEmail };
