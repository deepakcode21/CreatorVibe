import crypto from "crypto";
import Razorpay from "razorpay";
import Stripe from "stripe";
import { supabaseAdmin } from "../../config/supabase.js";
import { env } from "../../config/env.js";
import { logger } from "../../utils/logger.util.js";
import { calculateFees, selectGateway } from "../../config/payment.js";

const razorpay = new Razorpay({
  key_id: env.RAZORPAY_KEY_ID,
  key_secret: env.RAZORPAY_KEY_SECRET,
});

const stripe = new Stripe(env.STRIPE_SECRET_KEY, {
  apiVersion: "2023-10-16",
});

// ─── INITIATE SUPERCHAT ───────────────────────────────────────────────────────
export const initiateSuperchat = async ({
  creator_username,
  donor_name,
  donor_email,
  message,
  amount,
  currency,
  gateway,
}) => {
  // Find creator
  const { data: creator, error: creatorError } = await supabaseAdmin
    .from("users")
    .select("id, username, display_name, status")
    .eq("username", creator_username)
    .eq("status", "active")
    .single();

  if (creatorError || !creator) {
    throw Object.assign(
      new Error("Creator not found"),
      { statusCode: 404 }
    );
  }

  // Calculate fees
  const { platformFee, creatorAmount } = calculateFees(amount, currency);

  // Auto select gateway if not specified
  const selectedGateway =
    gateway === "auto" ? selectGateway(currency, amount) : gateway;

  // Create pending transaction in DB
  const { data: transaction, error: txError } = await supabaseAdmin
    .from("superchat_transactions")
    .insert({
      creator_id: creator.id,
      donor_name,
      donor_email,
      message,
      amount,
      platform_fee: platformFee,
      creator_amount: creatorAmount,
      currency,
      gateway: selectedGateway,
      status: "pending",
    })
    .select()
    .single();

  if (txError) throw txError;

  // Create payment order based on gateway
  let gatewayOrder;

  if (selectedGateway === "razorpay") {
    gatewayOrder = await createRazorpayOrder(transaction, amount, currency);
  } else if (selectedGateway === "cashfree") {
    gatewayOrder = await createCashfreeOrder(
      transaction,
      amount,
      currency,
      donor_name,
      donor_email
    );
  } else if (selectedGateway === "stripe") {
    gatewayOrder = await createStripeIntent(
      transaction,
      amount,
      currency,
      donor_name,
      donor_email
    );
  }

  // Update transaction with gateway order id
  await supabaseAdmin
    .from("superchat_transactions")
    .update({ gateway_order_id: gatewayOrder.orderId })
    .eq("id", transaction.id);

  logger.info(`Superchat initiated: ${transaction.id} via ${selectedGateway}`);

  return {
    transaction_id: transaction.id,
    gateway: selectedGateway,
    gateway_order: gatewayOrder,
    amount,
    currency,
    creator: {
      username: creator.username,
      display_name: creator.display_name,
    },
  };
};

// ─── CREATE RAZORPAY ORDER ────────────────────────────────────────────────────
const createRazorpayOrder = async (transaction, amount, currency) => {
  const order = await razorpay.orders.create({
    amount: Math.round(amount * 100), // Razorpay uses paise
    currency,
    receipt: transaction.id,
    notes: {
      transaction_id: transaction.id,
      creator_id: transaction.creator_id,
    },
  });

  return {
    orderId: order.id,
    amount: order.amount,
    currency: order.currency,
    keyId: env.RAZORPAY_KEY_ID,
  };
};

// ─── CREATE CASHFREE ORDER ────────────────────────────────────────────────────
const createCashfreeOrder = async (
  transaction,
  amount,
  currency,
  donor_name,
  donor_email
) => {
  const response = await fetch(
    "https://sandbox.cashfree.com/pg/orders",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-version": "2023-08-01",
        "x-client-id": env.CASHFREE_APP_ID,
        "x-client-secret": env.CASHFREE_SECRET_KEY,
      },
      body: JSON.stringify({
        order_id: transaction.id,
        order_amount: amount,
        order_currency: currency,
        customer_details: {
          customer_id: transaction.id,
          customer_name: donor_name,
          customer_email: donor_email,
          customer_phone: "9999999999", // Optional but required by Cashfree
        },
        order_meta: {
          return_url: `${env.CLIENT_URL}/superchat/verify?transaction_id=${transaction.id}&gateway=cashfree`,
        },
      }),
    }
  );

  const order = await response.json();

  if (!order.order_id) {
    throw new Error("Cashfree order creation failed");
  }

  return {
    orderId: order.order_id,
    paymentSessionId: order.payment_session_id,
    amount,
    currency,
  };
};

// ─── CREATE STRIPE PAYMENT INTENT ────────────────────────────────────────────
const createStripeIntent = async (
  transaction,
  amount,
  currency,
  donor_name,
  donor_email
) => {
  const paymentIntent = await stripe.paymentIntents.create({
    amount: Math.round(amount * 100), // Stripe uses cents
    currency: currency.toLowerCase(),
    receipt_email: donor_email,
    metadata: {
      transaction_id: transaction.id,
      creator_id: transaction.creator_id,
      donor_name,
    },
  });

  return {
    orderId: paymentIntent.id,
    clientSecret: paymentIntent.client_secret,
    amount,
    currency,
  };
};

// ─── VERIFY PAYMENT ───────────────────────────────────────────────────────────
export const verifyPayment = async ({
  transaction_id,
  gateway,
  razorpay_order_id,
  razorpay_payment_id,
  razorpay_signature,
  cashfree_order_id,
  cashfree_payment_id,
  stripe_payment_intent_id,
}) => {
  // Fetch transaction
  const { data: transaction, error } = await supabaseAdmin
    .from("superchat_transactions")
    .select("*")
    .eq("id", transaction_id)
    .single();

  if (error || !transaction) {
    throw Object.assign(
      new Error("Transaction not found"),
      { statusCode: 404 }
    );
  }

  if (transaction.status === "completed") {
    throw Object.assign(
      new Error("Transaction already completed"),
      { statusCode: 400 }
    );
  }

  let isVerified = false;
  let gateway_payment_id = null;

  // Verify based on gateway
  if (gateway === "razorpay") {
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest("hex");

    isVerified = expectedSignature === razorpay_signature;
    gateway_payment_id = razorpay_payment_id;

  } else if (gateway === "cashfree") {
    // Cashfree verification via API
    const response = await fetch(
      `https://sandbox.cashfree.com/pg/orders/${cashfree_order_id}/payments/${cashfree_payment_id}`,
      {
        headers: {
          "x-api-version": "2023-08-01",
          "x-client-id": env.CASHFREE_APP_ID,
          "x-client-secret": env.CASHFREE_SECRET_KEY,
        },
      }
    );
    const payment = await response.json();
    isVerified = payment.payment_status === "SUCCESS";
    gateway_payment_id = cashfree_payment_id;

  } else if (gateway === "stripe") {
    const paymentIntent = await stripe.paymentIntents.retrieve(
      stripe_payment_intent_id
    );
    isVerified = paymentIntent.status === "succeeded";
    gateway_payment_id = stripe_payment_intent_id;
  }

  if (!isVerified) {
    // Mark as failed
    await supabaseAdmin
      .from("superchat_transactions")
      .update({ status: "failed" })
      .eq("id", transaction_id);

    throw Object.assign(
      new Error("Payment verification failed"),
      { statusCode: 400 }
    );
  }

  // Mark as completed
  await supabaseAdmin
    .from("superchat_transactions")
    .update({
      status: "completed",
      gateway_payment_id,
    })
    .eq("id", transaction_id);

  // Update creator wallet
  await updateCreatorWallet(
    transaction.creator_id,
    transaction.creator_amount
  );

  logger.info(`Payment verified: ${transaction_id}`);

  return { transaction_id, status: "completed" };
};

// ─── UPDATE CREATOR WALLET ────────────────────────────────────────────────────
const updateCreatorWallet = async (creator_id, amount) => {
  // Check if wallet exists
  const { data: wallet } = await supabaseAdmin
    .from("creator_wallet")
    .select("id")
    .eq("creator_id", creator_id)
    .single();

  if (!wallet) {
    // Create wallet
    await supabaseAdmin.from("creator_wallet").insert({
      creator_id,
      total_earned: amount,
      available: amount,
    });
  } else {
    // Update wallet
    await supabaseAdmin.rpc("increment_wallet", {
      p_creator_id: creator_id,
      p_amount: amount,
    });
  }
};

// ─── GET CREATOR SUPERCHATS ───────────────────────────────────────────────────
export const getCreatorSuperchats = async (creator_id, page = 1, limit = 20) => {
  const offset = (page - 1) * limit;

  const { data, error, count } = await supabaseAdmin
    .from("superchat_transactions")
    .select("*", { count: "exact" })
    .eq("creator_id", creator_id)
    .eq("status", "completed")
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) throw error;

  return {
    superchats: data,
    pagination: {
      page,
      limit,
      total: count,
      totalPages: Math.ceil(count / limit),
    },
  };
};