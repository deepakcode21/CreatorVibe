import { Router } from "express";
import passport from "passport";
import * as authController from "./auth.controller.js";
import { protect } from "../../middlewares/auth.middleware.js";
import { validate } from "../../middlewares/auth.middleware.js";
import { authLimiter } from "../../middlewares/rateLimiter.middleware.js";
import { registerSchema, loginSchema, forgotPasswordSchema, resetPasswordSchema } from "./auth.validator.js";

const router = Router();

// ─── LOCAL AUTH ───────────────────────────────────────
// Email + Password
router.post("/register",
  authLimiter,
  validate(registerSchema),
  authController.register
);

router.post("/login",
  authLimiter,
  validate(loginSchema),
  authController.login
);

// ─── FORGOT PASSWORD ──────────────────────────────────
router.post("/forgot-password",
  authLimiter,
  validate(forgotPasswordSchema),
  authController.forgotPassword
);

// ─── RESET PASSWORD ───────────────────────────────────
router.post("/reset-password",
  authLimiter,
  validate(resetPasswordSchema),
  authController.resetPassword
);

router.post("/refresh", authController.refresh);

router.post("/logout", protect, authController.logout);

router.get("/me", protect, authController.getMe);

// ─── GOOGLE OAUTH ─────────────────────────────────────
router.get("/google",
  passport.authenticate("google", { session: false })
);

router.get("/google/callback",
  passport.authenticate("google", {
    session: false,
    failureRedirect: "/api/v1/auth/failed",
  }),
  authController.oauthCallback
);

// ─── DISCORD OAUTH ────────────────────────────────────
router.get("/discord",
  passport.authenticate("discord", { session: false })
);

router.get("/discord/callback",
  passport.authenticate("discord", {
    session: false,
    failureRedirect: "/api/v1/auth/failed",
  }),
  authController.oauthCallback
);

// ─── OAUTH FAILED ─────────────────────────────────────
router.get("/failed", (req, res) => {
  res.status(401).json({
    success: false,
    message: "OAuth login fail ho gaya",
  });
});

export default router;