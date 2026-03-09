import crypto from "crypto";
import { supabaseAdmin } from "../../config/supabase.js";
import { env } from "../../config/env.js";
import { logger } from "../../utils/logger.util.js";

// ─── VERIFY RAZORPAY WEBHOOK SIGNATURE ───────────────────────────────────────
const verifyRazorpaySignature = (rawBody, signature) => {
  const expectedSignature = crypto
    .createHmac("sha256", env.RAZORPAY_WEBHOOK_SECRET)
    .update(rawBody)
    .digest("hex");
  return expectedSignature === signature;
};

// ─── VERIFY CASHFREE WEBHOOK SIGNATURE ───────────────────────────────────────
const verifyCashfreeSignature = (rawBody, signature, timestamp) => {
  const data = timestamp + rawBody;
  const expectedSignature = crypto
    .createHmac("sha256", env.CASHFREE_SECRET_KEY)
    .update(data)
    .digest("base64");
  return expectedSignature === signature;
};

// ─── HANDLE PAYMENT SUCCESS ───────────────────────────────────────────────────
const handlePaymentSuccess = async (transactionId, gatewayPaymentId) => {
  const { data: transaction } = await supabaseAdmin
    .from("superchat_transactions")
    .select("*")
    .eq("gateway_order_id", transactionId)
    .single();

  if (!transaction || transaction.status === "completed") return;

  // Mark transaction as completed
  await supabaseAdmin
    .from("superchat_transactions")
    .update({
      status: "completed",
      gateway_payment_id: gatewayPaymentId,
    })
    .eq("id", transaction.id);

  // Update creator wallet
  const { data: wallet } = await supabaseAdmin
    .from("creator_wallet")
    .select("id")
    .eq("creator_id", transaction.creator_id)
    .single();

  if (!wallet) {
    await supabaseAdmin.from("creator_wallet").insert({
      creator_id: transaction.creator_id,
      total_earned: transaction.creator_amount,
      available: transaction.creator_amount,
      withdrawn: 0,
    });
  } else {
    await supabaseAdmin.rpc("increment_wallet", {
      p_creator_id: transaction.creator_id,
      p_amount: transaction.creator_amount,
    });
  }

  logger.info(`Webhook: Payment completed — ${transaction.id}`);
};

// ─── RAZORPAY WEBHOOK ─────────────────────────────────────────────────────────
export const razorpayWebhook = async (req, res) => {
  try {
    const signature = req.headers["x-razorpay-signature"];
    const rawBody = JSON.stringify(req.body);

    // Verify signature
    if (!verifyRazorpaySignature(rawBody, signature)) {
      logger.warn("Razorpay webhook: Invalid signature");
      return res.status(400).json({ success: false });
    }

    const event = req.body.event;
    const payload = req.body.payload;

    // Log webhook
    await supabaseAdmin.from("webhook_logs").insert({
      gateway: "razorpay",
      event,
      payload: req.body,
      status: "received",
    });

    // Handle events
    if (event === "payment.captured") {
      const orderId = payload.payment.entity.order_id;
      const paymentId = payload.payment.entity.id;
      await handlePaymentSuccess(orderId, paymentId);
    }

    if (event === "payment.failed") {
      const orderId = payload.payment.entity.order_id;
      await supabaseAdmin
        .from("superchat_transactions")
        .update({ status: "failed" })
        .eq("gateway_order_id", orderId);

      logger.info(`Razorpay payment failed: ${orderId}`);
    }

    return res.status(200).json({ success: true });
  } catch (err) {
    logger.error("Razorpay webhook error:", err.message);
    return res.status(500).json({ success: false });
  }
};

// ─── CASHFREE WEBHOOK ─────────────────────────────────────────────────────────
export const cashfreeWebhook = async (req, res) => {
  try {
    const signature = req.headers["x-webhook-signature"];
    const timestamp = req.headers["x-webhook-timestamp"];
    const rawBody = JSON.stringify(req.body);

    // Verify signature
    if (!verifyCashfreeSignature(rawBody, signature, timestamp)) {
      logger.warn("Cashfree webhook: Invalid signature");
      return res.status(400).json({ success: false });
    }

    const event = req.body.type;
    const data = req.body.data;

    // Log webhook
    await supabaseAdmin.from("webhook_logs").insert({
      gateway: "cashfree",
      event,
      payload: req.body,
      status: "received",
    });

    // Handle events
    if (event === "PAYMENT_SUCCESS") {
      const orderId = data.order.order_id;
      const paymentId = data.payment.cf_payment_id;
      await handlePaymentSuccess(orderId, String(paymentId));
    }

    if (event === "PAYMENT_FAILED") {
      const orderId = data.order.order_id;
      await supabaseAdmin
        .from("superchat_transactions")
        .update({ status: "failed" })
        .eq("gateway_order_id", orderId);

      logger.info(`Cashfree payment failed: ${orderId}`);
    }

    return res.status(200).json({ success: true });
  } catch (err) {
    logger.error("Cashfree webhook error:", err.message);
    return res.status(500).json({ success: false });
  }
};

// ─── STRIPE WEBHOOK ───────────────────────────────────────────────────────────
export const stripeWebhook = async (req, res) => {
  try {
    const signature = req.headers["stripe-signature"];
    const { stripe } = await import("../../config/payment.js");

    let event;

    try {
      event = stripe.webhooks.constructEvent(
        req.rawBody,
        signature,
        env.STRIPE_WEBHOOK_SECRET
      );
    } catch (err) {
      logger.warn("Stripe webhook: Invalid signature");
      return res.status(400).json({ success: false });
    }

    // Log webhook
    await supabaseAdmin.from("webhook_logs").insert({
      gateway: "stripe",
      event: event.type,
      payload: event,
      status: "received",
    });

    // Handle events
    if (event.type === "payment_intent.succeeded") {
      const paymentIntent = event.data.object;
      await handlePaymentSuccess(paymentIntent.id, paymentIntent.id);
    }

    if (event.type === "payment_intent.payment_failed") {
      const paymentIntent = event.data.object;
      await supabaseAdmin
        .from("superchat_transactions")
        .update({ status: "failed" })
        .eq("gateway_order_id", paymentIntent.id);

      logger.info(`Stripe payment failed: ${paymentIntent.id}`);
    }

    return res.status(200).json({ success: true });
  } catch (err) {
    logger.error("Stripe webhook error:", err.message);
    return res.status(500).json({ success: false });
  }
};