
import { logger } from "../utils/logger.util.js";

// ─── 404 HANDLER ─────────────────────────────────────
// Koi route match nahi hua
export const notFoundHandler = (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.path} exist nahi karta`,
  });
};

// ─── GLOBAL ERROR HANDLER ────────────────────────────
// Koi bhi error aaye — yahan aayega
export const errorHandler = (err, req, res, next) => {
  logger.error(`${req.method} ${req.path} — ${err.message}`);

  // Supabase errors
  if (err.code === "23505") {
    return res.status(409).json({
      success: false,
      message: "Ye record already exist karta hai",
    });
  }

  // JWT errors
  if (err.name === "JsonWebTokenError") {
    return res.status(401).json({
      success: false,
      message: "Invalid token hai",
    });
  }

  if (err.name === "TokenExpiredError") {
    return res.status(401).json({
      success: false,
      message: "Token expire ho gaya — dobara login karo",
    });
  }

  // Custom errors
  const statusCode = err.statusCode || 500;
  const message =
    statusCode < 500 ? err.message : "Server mein kuch gadbad hui";

  res.status(statusCode).json({
    success: false,
    message,
  });
};