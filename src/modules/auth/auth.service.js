import bcrypt from "bcryptjs";
import crypto from "crypto";
import { sendPasswordResetEmail } from "../../utils/email.util.js";
import { supabaseAdmin } from "../../config/supabase.js";
import { Redis } from "@upstash/redis";
import { generateTokens, verifyRefreshToken } from "../../utils/jwt.util.js";
import { logger } from "../../utils/logger.util.js";
import { env } from "../../config/env.js";

// ─── REDIS CLIENT ─────────────────────────────────────
const redis = new Redis({
  url: env.UPSTASH_REDIS_REST_URL,
  token: env.UPSTASH_REDIS_REST_TOKEN,
});

// ─── REGISTER ─────────────────────────────────────────
export const registerUser = async ({ email, password, username, display_name }) => {

  // Check both email and username availability
  const { data: existing } = await supabaseAdmin
    .from("users")
    .select("email, username")
    .or(`email.eq.${email},username.eq.${username}`)
    .single();

  if (existing?.email === email) {
    throw Object.assign(new Error("This email is already registered"), { statusCode: 409 });
  }
  if (existing?.username === username) {
    throw Object.assign(new Error("This username is already taken"), { statusCode: 409 });
  }

  // Hash the password
  const hashedPassword = await bcrypt.hash(password, 12);

  // Create new user record
  const { data: user, error } = await supabaseAdmin
    .from("users")
    .insert({
      email,
      password: hashedPassword,
      username: username.toLowerCase(),
      display_name: display_name || username,
      status: "active",
      email_verified: false,
    })
    .select("id, email, username, display_name, avatar, status")
    .single();

  if (error) throw error;

  logger.info(`New user registered: ${user.username}`);
  return user;
};

// ─── LOGIN ────────────────────────────────────────────
export const loginUser = async ({ email, password }) => {

  // Brute force protection — check for excessive failed attempts
  const attempts = await redis.get(`login_attempts:${email}`);
  if (parseInt(attempts) >= 5) {
    throw Object.assign(
      new Error("Account temporarily locked due to too many failed attempts. Please try again after 15 minutes"),
      { statusCode: 429 }
    );
  }

  // Find user by email
  const { data: user } = await supabaseAdmin
    .from("users")
    .select("id, email, password, username, display_name, avatar, status")
    .eq("email", email)
    .single();

  // User not found or password not set
  if (!user || !user.password) {
    await redis.set(`login_attempts:${email}`,
      (parseInt(attempts) || 0) + 1,
      { ex: 15 * 60 }
    );
    throw Object.assign(
      new Error("Invalid email or password"),
      { statusCode: 401 }
    );
  }

  if (user.status === "banned") {
    throw Object.assign(new Error("This account has been banned"), { statusCode: 403 });
  }

  // Verify password
  const isValid = await bcrypt.compare(password, user.password);
  if (!isValid) {
    await redis.set(`login_attempts:${email}`,
      (parseInt(attempts) || 0) + 1,
      { ex: 15 * 60 }
    );
    throw Object.assign(
      new Error("Invalid email or password"),
      { statusCode: 401 }
    );
  }

  // Successful login — clear rate limit attempts
  await redis.del(`login_attempts:${email}`);

  // Generate authentication tokens
  const { accessToken, refreshToken } = generateTokens(user);

  // Persist refresh token in Redis
  await redis.set(
    `refresh_token:${user.id}`,
    refreshToken,
    { ex: 7 * 24 * 60 * 60 } // 7 days expiration
  );

  const { password: _, ...safeUser } = user;
  return { user: safeUser, accessToken, refreshToken };
};

// ─── REFRESH TOKENS ───────────────────────────────────
export const refreshTokens = async (refreshToken) => {
  let decoded;
  try {
    decoded = verifyRefreshToken(refreshToken);
  } catch {
    throw Object.assign(
      new Error("Invalid or expired token"),
      { statusCode: 401 }
    );
  }

  // Verify token existence in Redis
  const stored = await redis.get(`refresh_token:${decoded.sub}`);
  if (!stored) {
    throw Object.assign(
      new Error("Session expired — please log in again"),
      { statusCode: 401 }
    );
  }

  // Retrieve user details
  const { data: user } = await supabaseAdmin
    .from("users")
    .select("id, email, username, display_name, avatar, status")
    .eq("id", decoded.sub)
    .single();

  if (!user) {
    throw Object.assign(new Error("User not found"), { statusCode: 401 });
  }

  // Generate new token pair
  const tokens = generateTokens(user);

  // Update token in Redis
  await redis.set(
    `refresh_token:${user.id}`,
    tokens.refreshToken,
    { ex: 7 * 24 * 60 * 60 }
  );

  return tokens;
};

// ─── LOGOUT ───────────────────────────────────────────
export const logoutUser = async (userId) => {
  await redis.del(`refresh_token:${userId}`);
  logger.info(`User logout initiated for: ${userId}`);
};

// ─── FORGOT PASSWORD ──────────────────────────────────
export const forgotPassword = async (email) => {

  // Verify user existence
  const { data: user } = await supabaseAdmin
    .from("users")
    .select("id, email")
    .eq("email", email)
    .single();

  // Security measure: Return uniform response to prevent account enumeration
  if (!user) {
    logger.info(`Forgot password request: Email not found — ${email}`);
    return;
  }

  // Generate unique reset token
  const resetToken = crypto.randomBytes(32).toString("hex");

  // Store token in Redis with 15-minute expiration
  await redis.set(
    `password_reset:${resetToken}`,
    user.id,
    { ex: 15 * 60 } // 15 minutes
  );

  // Dispatch reset email
  await sendPasswordResetEmail(email, resetToken);

  logger.info(`Password reset email dispatched to: ${email}`);
};

// ─── RESET PASSWORD ───────────────────────────────────
export const resetPassword = async (token, newPassword) => {

  // Retrieve userId associated with the token
  const userId = await redis.get(`password_reset:${token}`);

  if (!userId) {
    throw Object.assign(
      new Error("Reset link is invalid or has expired"),
      { statusCode: 400 }
    );
  }

  // Hash the new password
  const hashedPassword = await bcrypt.hash(newPassword, 12);

  // Update password in database
  const { error } = await supabaseAdmin
    .from("users")
    .update({ password: hashedPassword })
    .eq("id", userId);

  if (error) throw error;

  // Invalidate reset token after use
  await redis.del(`password_reset:${token}`);

  // Invalidate all active sessions for security
  await redis.del(`refresh_token:${userId}`);

  logger.info(`Password successfully reset for userId: ${userId}`);
};