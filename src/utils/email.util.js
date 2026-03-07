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
      subject: "CreatorVibe — Password Reset Karo",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #FFE500; background: #080A0F; padding: 20px; text-align: center;">
            ⚡ CreatorVibe
          </h2>
          <div style="padding: 30px; background: #f9f9f9;">
            <h3>Password Reset Request</h3>
            <p>Tumne password reset karne ki request ki hai.</p>
            <p>Neeche button click karo — ye link <strong>15 minute</strong> tak valid hai:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}"
                style="background: #FFE500; color: #080A0F; padding: 14px 28px;
                text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
                Password Reset Karo
              </a>
            </div>
            <p style="color: #666; font-size: 13px;">
              Agar tumne ye request nahi ki — ignore kar do. 
              Tumhara account safe hai.
            </p>
          </div>
        </div>
      `,
    });

    logger.info(`Password reset email bheja: ${email}`);
  } catch (err) {
    logger.error("Email bhejne mein error:", err.message);
    throw new Error("Email nahi bhej paaye");
  }
};