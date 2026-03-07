import * as authService from "./auth.service.js";
import { ok, created, badReq, unauth, serverErr } from "../../utils/response.util.js";
import { logger } from "../../utils/logger.util.js";
import { env } from "../../config/env.js";

// Cookie settings
const COOKIE_OPTIONS = {
  httpOnly: true,  // JS se access nahi hoga
  secure: env.NODE_ENV === "production",
  sameSite: "lax",
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 din
};

// ─── REGISTER ─────────────────────────────────────────
export const register = async (req, res) => {
  try {
    const user = await authService.registerUser(req.body);
    return created(res, { user }, "Account ban gaya!");
  } catch (err) {
    if (err.statusCode === 409) return badReq(res, err.message);
    logger.error("Register error:", err.message);
    return serverErr(res, "Register nahi ho paya");
  }
};

// ─── LOGIN ────────────────────────────────────────────
export const login = async (req, res) => {
  try {
    const { user, accessToken, refreshToken } = await authService.loginUser(req.body);

    // Refresh token cookie mein daalo
    res.cookie("refreshToken", refreshToken, COOKIE_OPTIONS);

    return ok(res, { user, accessToken }, "Login ho gaye!");
  } catch (err) {
    if (err.statusCode === 401) return unauth(res, err.message);
    if (err.statusCode === 429) return res.status(429).json({ success: false, message: err.message });
    if (err.statusCode === 403) return res.status(403).json({ success: false, message: err.message });
    logger.error("Login error:", err.message);
    return serverErr(res, "Login nahi ho paya");
  }
};

// ─── REFRESH TOKEN ────────────────────────────────────
export const refresh = async (req, res) => {
  try {
    const refreshToken = req.cookies?.refreshToken;
    if (!refreshToken) return unauth(res, "Token nahi mila");

    const tokens = await authService.refreshTokens(refreshToken);

    // Naya refresh token cookie mein
    res.cookie("refreshToken", tokens.refreshToken, COOKIE_OPTIONS);

    return ok(res, { accessToken: tokens.accessToken }, "Token refresh ho gaya!");
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
    return ok(res, null, "Logout ho gaye!");
  } catch (err) {
    res.clearCookie("refreshToken");
    return ok(res, null, "Logout ho gaye!");
  }
};

// ─── GET ME ───────────────────────────────────────────
export const getMe = (req, res) => {
  return ok(res, { user: req.user }, "Profile mila!");
};

// ─── OAUTH CALLBACK ───────────────────────────────────
// Google/Discord dono ke liye same controller
export const oauthCallback = (req, res) => {
  try {
    if (!req.user) {
      return res.redirect(`${env.CLIENT_URL}/auth/error`);
    }

    const { accessToken, refreshToken } = require("../../utils/jwt.util.js").generateTokens(req.user);

    res.cookie("refreshToken", refreshToken, COOKIE_OPTIONS);

    // Frontend par redirect — token URL mein
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

    // Hamesha same response do — security ke liye
    return ok(
      res,
      null,
      "Agar ye email registered hai toh reset link bhej diya hai!"
    );
  } catch (err) {
    logger.error("Forgot password error:", err.message);
    return serverErr(res, "Email nahi bhej paaye");
  }
};

// ─── RESET PASSWORD ───────────────────────────────────
export const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    await authService.resetPassword(token, newPassword);

    return ok(res, null, "Password reset ho gaya! Ab login karo.");
  } catch (err) {
    if (err.statusCode === 400) return badReq(res, err.message);
    logger.error("Reset password error:", err.message);
    return serverErr(res, "Password reset nahi ho paya");
  }
};