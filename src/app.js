import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import morgan from "morgan";
import passport from "passport";

import { env } from "./config/env.js";
import { configurePassport } from "./config/passport.js";
import { checkSupabaseConnection } from "./config/supabase.js";
import { logger } from "./utils/logger.util.js";
import { apiLimiter } from "./middlewares/rateLimiter.middleware.js";
import { notFoundHandler, errorHandler } from "./middlewares/errorHandler.middleware.js";

// ─── ROUTES ───────────────────────────────────────────
import authRoutes from "./modules/auth/auth.routes.js";

const app = express();

// ─── SECURITY ─────────────────────────────────────────
app.use(helmet());
app.use(cors({
  origin: env.CLIENT_URL,
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
}));

// ─── MIDDLEWARES ──────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(morgan("dev"));
app.use(apiLimiter);

// ─── PASSPORT ─────────────────────────────────────────
configurePassport();
app.use(passport.initialize());

// ─── HEALTH CHECK ─────────────────────────────────────
app.get("/health", (req, res) => {
  res.json({
    success: true,
    message: "CreatorVibe API chal raha hai! 🚀",
    timestamp: new Date().toISOString(),
  });
});

// ─── ROUTES ───────────────────────────────────────────
app.use("/api/v1/auth", authRoutes);

// ─── ERROR HANDLERS ───────────────────────────────────
app.use(notFoundHandler);
app.use(errorHandler);

// ─── SERVER START ─────────────────────────────────────
const startServer = async () => {
  try {
    // Supabase check karo
    await checkSupabaseConnection();

    app.listen(env.PORT, () => {
      logger.info(`🚀 Server chal raha hai port ${env.PORT} par`);
      logger.info(`🌍 Environment: ${env.NODE_ENV}`);
      logger.info(`📌 Health check: http://localhost:${env.PORT}/health`);
    });
  } catch (err) {
    logger.error("Server start nahi ho paya:", err.message);
    process.exit(1);
  }
};

startServer();

export default app;