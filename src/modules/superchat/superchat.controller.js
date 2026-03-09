import * as superchatService from "./superchat.service.js";
import {
  ok,
  created,
  badReq,
  notFound,
  serverErr,
} from "../../utils/response.util.js";
import { logger } from "../../utils/logger.util.js";

// ─── INITIATE SUPERCHAT ───────────────────────────────────────────────────────
export const initiateSuperchat = async (req, res) => {
  try {
    const result = await superchatService.initiateSuperchat(req.body);
    return created(res, result, "Superchat initiated successfully");
  } catch (err) {
    if (err.statusCode === 404) return notFound(res, err.message);
    logger.error("Initiate superchat error:", err.message);
    return serverErr(res, "Failed to initiate superchat");
  }
};

// ─── VERIFY PAYMENT ───────────────────────────────────────────────────────────
export const verifyPayment = async (req, res) => {
  try {
    const result = await superchatService.verifyPayment(req.body);
    return ok(res, result, "Payment verified successfully");
  } catch (err) {
    if (err.statusCode === 404) return notFound(res, err.message);
    if (err.statusCode === 400) return badReq(res, err.message);
    logger.error("Verify payment error:", err.message);
    return serverErr(res, "Payment verification failed");
  }
};

// ─── GET CREATOR SUPERCHATS ───────────────────────────────────────────────────
export const getCreatorSuperchats = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;

    const result = await superchatService.getCreatorSuperchats(
      req.user.id,
      page,
      limit
    );

    return ok(res, result, "Superchats fetched successfully");
  } catch (err) {
    logger.error("Get superchats error:", err.message);
    return serverErr(res, "Failed to fetch superchats");
  }
};