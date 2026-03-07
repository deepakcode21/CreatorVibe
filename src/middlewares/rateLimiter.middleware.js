import rateLimit from "express-rate-limit";

// ─── AUTH ROUTES LIMITER ─────────────────────────────
// Login/Register par strict limit — spam rokne ke liye
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,                   // 15 minute mein sirf 10 requests
  message: {
    success: false,
    message: "Bahut zyada requests! 15 minute baad try karo.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// ─── GENERAL API LIMITER ─────────────────────────────
// Baaki saari APIs ke liye
export const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100,            // 1 minute mein 100 requests
  message: {
    success: false,
    message: "Bahut zyada requests! Thoda ruko.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// ─── SUPERCHAT LIMITER ───────────────────────────────
// Payment requests pe extra strict
export const superchatLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5,              // 1 minute mein sirf 5 superchats
  message: {
    success: false,
    message: "Itni jaldi superchat nahi kar sakte!",
  },
});