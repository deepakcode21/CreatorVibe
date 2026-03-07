import passport from "passport";
import { unauth, forbidden } from "../utils/response.util.js";

// ─── ROUTE PROTECT KARO ──────────────────────────────
// Ye middleware lagao jis route ko login chahiye
export const protect = (req, res, next) => {
  passport.authenticate("jwt", { session: false }, (err, user) => {
    if (err) return next(err);
    if (!user) return unauth(res, "Login karo pehle");
    req.user = user; // User ko request mein daalo
    next();
  })(req, res, next);
};

// ─── OPTIONAL AUTH ───────────────────────────────────
// Login ho toh extra data do, nahi toh bhi chalega
export const optionalAuth = (req, res, next) => {
  passport.authenticate("jwt", { session: false }, (err, user) => {
    if (user) req.user = user;
    next(); // Error ho ya na ho — aage jao
  })(req, res, next);
};

// ─── YOUTUBE VERIFIED CHECK ──────────────────────────
// Sirf wo creators jo YouTube channel verify kar chuke hain
export const requireYouTube = (req, res, next) => {
  if (!req.user?.youtube_verified) {
    return forbidden(res, "Pehle apna YouTube channel verify karo");
  }
  next();
};

// ─── REQUEST VALIDATE KARO ───────────────────────────
// Zod schema se body check karo
export const validate = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body);

  if (!result.success) {
    const errors = result.error.flatten().fieldErrors;
    return res.status(400).json({
      success: false,
      message: "Galat data bheja hai",
      errors,
    });
  }

  req.body = result.data; // Clean data use karo
  next();
};