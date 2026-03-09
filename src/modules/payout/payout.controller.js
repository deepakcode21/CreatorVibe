import * as payoutService from "./payout.service.js";
import {
  ok,
  created,
  badReq,
  notFound,
  serverErr,
} from "../../utils/response.util.js";
import { logger } from "../../utils/logger.util.js";

// ─── ADD BANK ACCOUNT ─────────────────────────────────────────────────────────
export const addBankAccount = async (req, res) => {
  try {
    const account = await payoutService.addBankAccount(
      req.user.id,
      req.body
    );
    return created(res, { account }, "Bank account added successfully");
  } catch (err) {
    logger.error("Add bank account error:", err.message);
    return serverErr(res, "Failed to add bank account");
  }
};

// ─── GET BANK ACCOUNTS ────────────────────────────────────────────────────────
export const getBankAccounts = async (req, res) => {
  try {
    const accounts = await payoutService.getBankAccounts(req.user.id);
    return ok(res, { accounts }, "Bank accounts fetched successfully");
  } catch (err) {
    logger.error("Get bank accounts error:", err.message);
    return serverErr(res, "Failed to fetch bank accounts");
  }
};

// ─── DELETE BANK ACCOUNT ──────────────────────────────────────────────────────
export const deleteBankAccount = async (req, res) => {
  try {
    await payoutService.deleteBankAccount(
      req.user.id,
      req.params.id
    );
    return ok(res, null, "Bank account deleted successfully");
  } catch (err) {
    if (err.statusCode === 404) return notFound(res, err.message);
    if (err.statusCode === 400) return badReq(res, err.message);
    logger.error("Delete bank account error:", err.message);
    return serverErr(res, "Failed to delete bank account");
  }
};

// ─── SET DEFAULT BANK ACCOUNT ─────────────────────────────────────────────────
export const setDefaultBankAccount = async (req, res) => {
  try {
    const account = await payoutService.setDefaultBankAccount(
      req.user.id,
      req.params.id
    );
    return ok(res, { account }, "Default bank account updated successfully");
  } catch (err) {
    if (err.statusCode === 404) return notFound(res, err.message);
    logger.error("Set default bank account error:", err.message);
    return serverErr(res, "Failed to update default bank account");
  }
};

// ─── REQUEST PAYOUT ───────────────────────────────────────────────────────────
export const requestPayout = async (req, res) => {
  try {
    const payout = await payoutService.requestPayout(
      req.user.id,
      req.body
    );
    return created(res, { payout }, "Payout request submitted successfully");
  } catch (err) {
    if (err.statusCode === 400) return badReq(res, err.message);
    if (err.statusCode === 404) return notFound(res, err.message);
    logger.error("Request payout error:", err.message);
    return serverErr(res, "Failed to submit payout request");
  }
};

// ─── GET PAYOUT HISTORY ───────────────────────────────────────────────────────
export const getPayoutHistory = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;

    const result = await payoutService.getPayoutHistory(
      req.user.id,
      page,
      limit
    );
    return ok(res, result, "Payout history fetched successfully");
  } catch (err) {
    logger.error("Get payout history error:", err.message);
    return serverErr(res, "Failed to fetch payout history");
  }
};