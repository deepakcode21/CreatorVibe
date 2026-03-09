import * as walletService from "./wallet.service.js";
import { ok, serverErr } from "../../utils/response.util.js";
import { logger } from "../../utils/logger.util.js";

// ─── GET WALLET BALANCE ───────────────────────────────────────────────────────
export const getWalletBalance = async (req, res) => {
  try {
    const wallet = await walletService.getWalletBalance(req.user.id);
    return ok(res, { wallet }, "Wallet fetched successfully");
  } catch (err) {
    logger.error("Get wallet error:", err.message);
    return serverErr(res, "Failed to fetch wallet");
  }
};

// ─── GET TRANSACTION HISTORY ──────────────────────────────────────────────────
export const getTransactionHistory = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const status = req.query.status || null;

    const result = await walletService.getTransactionHistory(
      req.user.id,
      page,
      limit,
      status
    );

    return ok(res, result, "Transactions fetched successfully");
  } catch (err) {
    logger.error("Get transactions error:", err.message);
    return serverErr(res, "Failed to fetch transactions");
  }
};

// ─── GET WALLET STATS ─────────────────────────────────────────────────────────
export const getWalletStats = async (req, res) => {
  try {
    const stats = await walletService.getWalletStats(req.user.id);
    return ok(res, { stats }, "Wallet stats fetched successfully");
  } catch (err) {
    logger.error("Get wallet stats error:", err.message);
    return serverErr(res, "Failed to fetch wallet stats");
  }
};