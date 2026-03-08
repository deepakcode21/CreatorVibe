import { logger } from "../utils/logger.util.js";

// ─── 404 HANDLER ─────────────────────────────────────
// Triggered when no matching route is found
export const notFoundHandler = (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.path} does not exist`,
  });
};

// ─── GLOBAL ERROR HANDLER ────────────────────────────
// Catch-all middleware for handling any internal errors
export const errorHandler = (err, req, res, next) => {
  logger.error(`${req.method} ${req.path} — ${err.message}`);

  // Supabase unique constraint errors
  if (err.code === "23505") {
    return res.status(409).json({
      success: false,
      message: "This record already exists",
    });
  }

  // JWT errors
  if (err.name === "JsonWebTokenError") {
    return res.status(401).json({
      success: false,
      message: "Invalid token provided",
    });
  }

  if (err.name === "TokenExpiredError") {
    return res.status(401).json({
      success: false,
      message: "Token has expired — please log in again",
    });
  }

  // Custom and Internal Server Errors
  const statusCode = err.statusCode || 500;
  const message =
    statusCode < 500 ? err.message : "An internal server error occurred";

  res.status(statusCode).json({
    success: false,
    message,
  });
};