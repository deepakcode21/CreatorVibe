import passport from "passport";
import { unauth, forbidden } from "../utils/response.util.js";

// ─── ROUTE PROTECTION ────────────────────────────────
// Middleware to protect routes that require authentication
export const protect = (req, res, next) => {
  passport.authenticate("jwt", { session: false }, (err, user) => {
    if (err) return next(err);
    if (!user) return unauth(res, "Authentication required");
    req.user = user; // Attach user to the request object
    next();
  })(req, res, next);
};

// ─── OPTIONAL AUTHENTICATION ─────────────────────────
// Provides extra data if logged in, otherwise continues without error
export const optionalAuth = (req, res, next) => {
  passport.authenticate("jwt", { session: false }, (err, user) => {
    if (user) req.user = user;
    next(); // Proceed regardless of authentication status
  })(req, res, next);
};

// ─── YOUTUBE VERIFICATION CHECK ──────────────────────
// Restricts access to creators with a verified YouTube channel
export const requireYouTube = (req, res, next) => {
  if (!req.user?.youtube_verified) {
    return forbidden(res, "Please verify your YouTube channel first");
  }
  next();
};

// ─── REQUEST VALIDATION ──────────────────────────────
// Validates the request body against a Zod schema
export const validate = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body);

  if (!result.success) {
    const errors = result.error.flatten().fieldErrors;
    return res.status(400).json({
      success: false,
      message: "Validation failed: Invalid data provided",
      errors,
    });
  }

  req.body = result.data; // Use sanitized data
  next();
};