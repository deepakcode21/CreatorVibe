import { z } from "zod";

// ─── ADD BANK ACCOUNT ─────────────────────────────────────────────────────────
export const addBankAccountSchema = z.object({
  account_holder_name: z
    .string({ required_error: "Account holder name is required" })
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name cannot exceed 100 characters"),

  account_number: z
    .string({ required_error: "Account number is required" })
    .min(9, "Invalid account number")
    .max(18, "Invalid account number")
    .regex(/^\d+$/, "Account number must contain only digits"),

  ifsc_code: z
    .string({ required_error: "IFSC code is required" })
    .regex(
      /^[A-Z]{4}0[A-Z0-9]{6}$/,
      "Invalid IFSC code format (e.g. SBIN0001234)"
    ),

  bank_name: z
    .string({ required_error: "Bank name is required" })
    .min(2, "Bank name must be at least 2 characters"),

  is_default: z.boolean().default(false),
});

// ─── REQUEST PAYOUT ───────────────────────────────────────────────────────────
export const requestPayoutSchema = z.object({
  amount: z
    .number({ required_error: "Amount is required" })
    .min(100, "Minimum payout amount is Rs. 100"),

  bank_account_id: z
    .string({ required_error: "Bank account is required" })
    .uuid("Invalid bank account ID"),

  gateway: z
    .enum(["razorpay", "cashfree"])
    .default("razorpay"),
});