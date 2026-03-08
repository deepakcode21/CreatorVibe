import { Resend } from "resend";
import { env } from "../config/env.js";
import { logger } from "./logger.util.js";

const resend = new Resend(env.RESEND_API_KEY);

// ─── PASSWORD RESET EMAIL ─────────────────────────────
export const sendPasswordResetEmail = async (email, resetToken) => {
  const resetUrl = `${env.CLIENT_URL}/auth/reset-password?token=${resetToken}`;

  try {
    await resend.emails.send({
      from: env.EMAIL_FROM,
      to: email,
      subject: "CreatorVibe — Password Reset Request",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #FFE500; background: #080A0F; padding: 20px; text-align: center;">
            CreatorVibe
          </h2>
          <div style="padding: 30px; background: #f9f9f9;">
            <h3>Password Reset Request</h3>
            <p>You have requested to reset your password.</p>
            <p>Click the button below to proceed — this link is valid for <strong>15 minutes</strong>:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" 
                style="background: #FFE500; color: #080A0F; padding: 14px 28px; 
                text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
                Reset Password
              </a>
            </div>
            <p style="color: #666; font-size: 13px;">
              If you did not make this request, please ignore this email. 
              Your account remains secure.
            </p>
          </div>
        </div>
      `,
    });

    logger.info(`Password reset email sent to: ${email}`);
  } catch (err) {
    logger.error("Error sending email:", err.message);
    throw new Error("Failed to send email");
  }
};