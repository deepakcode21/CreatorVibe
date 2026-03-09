import { z } from "zod";

// ─── INITIATE SUPERCHAT ───────────────────────────────────────────────────────
export const initiateSuperChatSchema = z.object({
  creator_username: z
    .string({ required_error: "Creator username is required" })
    .min(3, "Invalid creator username"),

  donor_name: z
    .string({ required_error: "Your name is required" })
    .min(1, "Name cannot be empty")
    .max(50, "Name cannot exceed 50 characters"),

  donor_email: z
    .string({ required_error: "Your email is required" })
    .email("Invalid email address"),

  message: z
    .string()
    .max(200, "Message cannot exceed 200 characters")
    .optional()
    .default(""),

  amount: z
    .number({ required_error: "Amount is required" })
    .min(20, "Minimum amount is Rs. 20")
    .max(50000, "Maximum amount is Rs. 50,000"),

  currency: z
    .enum(["INR", "USD", "EUR", "GBP"])
    .default("INR"),

  gateway: z
    .enum(["razorpay", "cashfree", "stripe", "auto"])
    .default("auto"),
});

// ─── VERIFY PAYMENT ───────────────────────────────────────────────────────────
export const verifyPaymentSchema = z.object({
  transaction_id: z
    .string({ required_error: "Transaction ID is required" }),

  gateway: z
    .enum(["razorpay", "cashfree", "stripe"]),

  // Razorpay fields
  razorpay_order_id: z.string().optional(),
  razorpay_payment_id: z.string().optional(),
  razorpay_signature: z.string().optional(),

  // Cashfree fields
  cashfree_order_id: z.string().optional(),
  cashfree_payment_id: z.string().optional(),

  // Stripe fields
  stripe_payment_intent_id: z.string().optional(),
});