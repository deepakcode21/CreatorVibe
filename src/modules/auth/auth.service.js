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

  // Email aur username dono check karo
  const { data: existing } = await supabaseAdmin
    .from("users")
    .select("email, username")
    .or(`email.eq.${email},username.eq.${username}`)
    .single();

  if (existing?.email === email) {
    throw Object.assign(new Error("Ye email already registered hai"), { statusCode: 409 });
  }
  if (existing?.username === username) {
    throw Object.assign(new Error("Ye username already liya ja chuka hai"), { statusCode: 409 });
  }

  // Password hash karo
  const hashedPassword = await bcrypt.hash(password, 12);

  // User banao
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

  logger.info(`Naya user register hua: ${user.username}`);
  return user;
};

// ─── LOGIN ────────────────────────────────────────────
export const loginUser = async ({ email, password }) => {

  // Brute force check — 5 se zyada galat attempts?
  const attempts = await redis.get(`login_attempts:${email}`);
  if (parseInt(attempts) >= 5) {
    throw Object.assign(
      new Error("Account temporarily lock ho gaya! 15 minute baad try karo"),
      { statusCode: 429 }
    );
  }

  // User dhundho
  const { data: user } = await supabaseAdmin
    .from("users")
    .select("id, email, password, username, display_name, avatar, status")
    .eq("email", email)
    .single();

  // User nahi mila ya password galat
  if (!user || !user.password) {
    await redis.set(`login_attempts:${email}`,
      (parseInt(attempts) || 0) + 1,
      { ex: 15 * 60 }
    );
    throw Object.assign(
      new Error("Email ya password galat hai"),
      { statusCode: 401 }
    );
  }

  if (user.status === "banned") {
    throw Object.assign(new Error("Account ban kar diya gaya hai"), { statusCode: 403 });
  }

  // Password check karo
  const isValid = await bcrypt.compare(password, user.password);
  if (!isValid) {
    await redis.set(`login_attempts:${email}`,
      (parseInt(attempts) || 0) + 1,
      { ex: 15 * 60 }
    );
    throw Object.assign(
      new Error("Email ya password galat hai"),
      { statusCode: 401 }
    );
  }

  // Sahi login — attempts clear karo
  await redis.del(`login_attempts:${email}`);

  // Tokens banao
  const { accessToken, refreshToken } = generateTokens(user);

  // Refresh token Redis mein save karo
  await redis.set(
    `refresh_token:${user.id}`,
    refreshToken,
    { ex: 7 * 24 * 60 * 60 } // 7 din
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
      new Error("Invalid ya expired token"),
      { statusCode: 401 }
    );
  }

  // Redis mein check karo
  const stored = await redis.get(`refresh_token:${decoded.sub}`);
  if (!stored) {
    throw Object.assign(
      new Error("Token expire ho gaya — dobara login karo"),
      { statusCode: 401 }
    );
  }

  // User lo
  const { data: user } = await supabaseAdmin
    .from("users")
    .select("id, email, username, display_name, avatar, status")
    .eq("id", decoded.sub)
    .single();

  if (!user) {
    throw Object.assign(new Error("User nahi mila"), { statusCode: 401 });
  }

  // Naye tokens banao
  const tokens = generateTokens(user);

  // Redis update karo
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
  logger.info(`User logout: ${userId}`);
};

// ─── FORGOT PASSWORD ──────────────────────────────────
export const forgotPassword = async (email) => {

  // User hai ya nahi check karo
  const { data: user } = await supabaseAdmin
    .from("users")
    .select("id, email")
    .eq("email", email)
    .single();

  // Security ke liye — user mile ya na mile, same response do
  // Attacker ko pata nahi chalega ki email registered hai ya nahi
  if (!user) {
    logger.info(`Forgot password: email nahi mila — ${email}`);
    return;
  }

  // Reset token banao — random string
  const resetToken = crypto.randomBytes(32).toString("hex");

  // Redis mein 15 minute ke liye save karo
  await redis.set(
    `password_reset:${resetToken}`,
    user.id,
    { ex: 15 * 60 } // 15 minute
  );

  // Email bhejo
  await sendPasswordResetEmail(email, resetToken);

  logger.info(`Password reset email bheja: ${email}`);
};

// ─── RESET PASSWORD ───────────────────────────────────
export const resetPassword = async (token, newPassword) => {

  // Redis mein token dhundho
  const userId = await redis.get(`password_reset:${token}`);

  if (!userId) {
    throw Object.assign(
      new Error("Reset link expire ho gaya ya invalid hai"),
      { statusCode: 400 }
    );
  }

  // Naya password hash karo
  const hashedPassword = await bcrypt.hash(newPassword, 12);

  // Database mein update karo
  const { error } = await supabaseAdmin
    .from("users")
    .update({ password: hashedPassword })
    .eq("id", userId);

  if (error) throw error;

  // Token delete karo — ek baar use ho gaya
  await redis.del(`password_reset:${token}`);

  // Saare active sessions bhi logout karo
  await redis.del(`refresh_token:${userId}`);

  logger.info(`Password reset ho gaya: userId ${userId}`);
};