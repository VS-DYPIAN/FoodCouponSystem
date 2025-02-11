import nodemailer from "nodemailer";
import { log } from "./vite";

// Create reusable transporter
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

export async function sendPasswordResetEmail(
  to: string,
  resetToken: string,
  username: string
) {
  const resetUrl = `${process.env.APP_URL || `http://${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.repl.co`}/auth/reset-password/${resetToken}`;

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to,
    subject: "Password Reset Request",
    html: `
      <h1>Hello ${username},</h1>
      <p>You requested to reset your password.</p>
      <p>Please click the link below to reset your password:</p>
      <a href="${resetUrl}">${resetUrl}</a>
      <p>This link will expire in 1 hour.</p>
      <p>If you didn't request this, please ignore this email.</p>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    log("Password reset email sent", "email");
  } catch (error) {
    log(`Failed to send password reset email: ${error}`, "email");
    throw new Error("Failed to send password reset email");
  }
}
