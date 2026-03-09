import { Router } from "express";
import {
  razorpayWebhook,
  cashfreeWebhook,
  stripeWebhook,
} from "./webhook.controller.js";

const router = Router();

// ─── WEBHOOK ROUTES ───────────────────────────────────────────────────────────
// Note: Raw body required for signature verification
// No auth middleware — these are called by payment gateways

router.post("/razorpay", razorpayWebhook);
router.post("/cashfree", cashfreeWebhook);
router.post("/stripe", stripeWebhook);

export default router;