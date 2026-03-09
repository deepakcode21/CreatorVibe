import Razorpay from "razorpay";
import Stripe from "stripe";
import { env } from "./env.js";

// ─── RAZORPAY ────────────────────────────────────────────────────────────────
export const razorpay = new Razorpay({
  key_id: env.RAZORPAY_KEY_ID,
  key_secret: env.RAZORPAY_KEY_SECRET,
});

// ─── STRIPE ──────────────────────────────────────────────────────────────────
export const stripe = new Stripe(env.STRIPE_SECRET_KEY, {
  apiVersion: "2023-10-16",
});

// ─── PLATFORM FEE CALCULATOR ─────────────────────────────────────────────────
export const calculateFees = (amount, currency = "INR") => {
  const feePercentage = parseFloat(env.PLATFORM_FEE_PERCENTAGE) / 100;
  const platformFee = parseFloat((amount * feePercentage).toFixed(2));
  const creatorAmount = parseFloat((amount - platformFee).toFixed(2));

  return { platformFee, creatorAmount };
};

// ─── SMART GATEWAY SELECTOR ──────────────────────────────────────────────────
export const selectGateway = (currency, amount) => {
  // International payments → Stripe
  if (currency !== "INR") return "stripe";

  // India payments → Cashfree (cheapest)
  // Razorpay as fallback
  return "cashfree";
};

// ─── GATEWAY CONFIGS ─────────────────────────────────────────────────────────
export const GATEWAY_CONFIG = {
  razorpay: {
    name: "Razorpay",
    currency: ["INR"],
    minAmount: 1,
    feePercentage: 2.0,
  },
  cashfree: {
    name: "Cashfree",
    currency: ["INR"],
    minAmount: 1,
    feePercentage: 1.75,
  },
  stripe: {
    name: "Stripe",
    currency: ["USD", "EUR", "GBP"],
    minAmount: 0.5,
    feePercentage: 2.9,
  },
};