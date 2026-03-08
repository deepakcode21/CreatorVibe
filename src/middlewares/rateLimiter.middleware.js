import rateLimit from "express-rate-limit";

// ─── AUTH ROUTES LIMITER ─────────────────────────────
// Strict limits for Login/Register — to prevent spam and brute force
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,                   // Limit each IP to 10 requests per window
  message: {
    success: false,
    message: "Too many requests. Please try again after 15 minutes.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// ─── GENERAL API LIMITER ─────────────────────────────
// Standard rate limit for all other API endpoints
export const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100,            // Limit each IP to 100 requests per minute
  message: {
    success: false,
    message: "Too many requests. Please slow down.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// ─── SUPERCHAT LIMITER ───────────────────────────────
// Enhanced restriction on payment-related requests
export const superchatLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5,               // Limit each IP to 5 superchat requests per minute
  message: {
    success: false,
    message: "Rate limit exceeded. Please wait before sending another superchat.",
  },
});