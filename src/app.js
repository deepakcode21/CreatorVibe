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
import creatorRoutes from "./modules/creator/creator.routes.js";
import superchatRoutes from "./modules/superchat/superchat.routes.js";
import walletRoutes from "./modules/wallet/wallet.routes.js";
import payoutRoutes from "./modules/payout/payout.routes.js";
import webhookRoutes from "./modules/webhook/webhook.routes.js";

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
    message: "CreatorVibe API is operational",
    timestamp: new Date().toISOString(),
  });
});

// ─── ROUTES ───────────────────────────────────────────
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/creators", creatorRoutes);
app.use("/api/v1/superchats", superchatRoutes);
app.use("/api/v1/wallet", walletRoutes);
app.use("/api/v1/payouts", payoutRoutes);
app.use("/api/v1/webhooks", webhookRoutes);

// ─── ERROR HANDLERS ───────────────────────────────────
app.use(notFoundHandler);
app.use(errorHandler);

// ─── SERVER STARTUP ───────────────────────────────────
const startServer = async () => {
  try {
    // Verify Supabase connection
    await checkSupabaseConnection();

    app.listen(env.PORT, () => {
      logger.info(`Server is running on port ${env.PORT}`);
      logger.info(`Environment: ${env.NODE_ENV}`);
      logger.info(`Health check endpoint: http://localhost:${env.PORT}/health`);
    });
  } catch (err) {
    logger.error("Failed to start server:", err.message);
    process.exit(1);
  }
};

startServer();

export default app;