import * as authService from "./auth.service.js";
import { ok, created, badReq, unauth, serverErr } from "../../utils/response.util.js";
import { logger } from "../../utils/logger.util.js";
import { env } from "../../config/env.js";

// Cookie settings
const COOKIE_OPTIONS = {
  httpOnly: true,  // Prevents JS access for security
  secure: env.NODE_ENV === "production",
  sameSite: "lax",
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};

// ─── REGISTER ─────────────────────────────────────────
export const register = async (req, res) => {
  try {
    const user = await authService.registerUser(req.body);
    return created(res, { user }, "Account created successfully");
  } catch (err) {
    if (err.statusCode === 409) return badReq(res, err.message);
    logger.error("Register error:", err.message);
    return serverErr(res, "Registration failed");
  }
};

// ─── LOGIN ────────────────────────────────────────────
export const login = async (req, res) => {
  try {
    const { user, accessToken, refreshToken } = await authService.loginUser(req.body);

    // Set Refresh token in cookie
    res.cookie("refreshToken", refreshToken, COOKIE_OPTIONS);

    return ok(res, { user, accessToken }, "Login successful");
  } catch (err) {
    if (err.statusCode === 401) return unauth(res, err.message);
    if (err.statusCode === 429) return res.status(429).json({ success: false, message: err.message });
    if (err.statusCode === 403) return res.status(403).json({ success: false, message: err.message });
    logger.error("Login error:", err.message);
    return serverErr(res, "Login failed");
  }
};

// ─── REFRESH TOKEN ────────────────────────────────────
export const refresh = async (req, res) => {
  try {
    const refreshToken = req.cookies?.refreshToken;
    if (!refreshToken) return unauth(res, "Token not found");

    const tokens = await authService.refreshTokens(refreshToken);

    // Update refresh token in cookie
    res.cookie("refreshToken", tokens.refreshToken, COOKIE_OPTIONS);

    return ok(res, { accessToken: tokens.accessToken }, "Token refreshed successfully");
  } catch (err) {
    res.clearCookie("refreshToken");
    return unauth(res, err.message);
  }
};

// ─── LOGOUT ───────────────────────────────────────────
export const logout = async (req, res) => {
  try {
    await authService.logoutUser(req.user.id);
    res.clearCookie("refreshToken");
    return ok(res, null, "Logged out successfully");
  } catch (err) {
    res.clearCookie("refreshToken");
    return ok(res, null, "Logged out successfully");
  }
};

// ─── GET ME ───────────────────────────────────────────
export const getMe = (req, res) => {
  return ok(res, { user: req.user }, "Profile retrieved successfully");
};

// ─── OAUTH CALLBACK ───────────────────────────────────
// Generic controller for both Google and Discord
export const oauthCallback = (req, res) => {
  try {
    if (!req.user) {
      return res.redirect(`${env.CLIENT_URL}/auth/error`);
    }

    const { accessToken, refreshToken } = require("../../utils/jwt.util.js").generateTokens(req.user);

    res.cookie("refreshToken", refreshToken, COOKIE_OPTIONS);

    // Redirect to frontend with token in URL
    return res.redirect(
      `${env.CLIENT_URL}/auth/callback?token=${accessToken}`
    );
  } catch (err) {
    logger.error("OAuth callback error:", err.message);
    return res.redirect(`${env.CLIENT_URL}/auth/error`);
  }
};

// ─── FORGOT PASSWORD ──────────────────────────────────
export const forgotPassword = async (req, res) => {
  try {
    await authService.forgotPassword(req.body.email);

    // Uniform response for security (prevents account enumeration)
    return ok(
      res,
      null,
      "If this email is registered, a password reset link has been sent"
    );
  } catch (err) {
    logger.error("Forgot password error:", err.message);
    return serverErr(res, "Failed to send email");
  }
};

// ─── RESET PASSWORD ───────────────────────────────────
export const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    await authService.resetPassword(token, newPassword);

    return ok(res, null, "Password reset successfully. You can now log in.");
  } catch (err) {
    if (err.statusCode === 400) return badReq(res, err.message);
    logger.error("Reset password error:", err.message);
    return serverErr(res, "Password reset failed");
  }
};