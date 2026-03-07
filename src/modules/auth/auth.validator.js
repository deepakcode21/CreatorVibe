import { z } from "zod";

// ─── REGISTER ────────────────────────────────────────
export const registerSchema = z.object({
  email: z
    .string({ required_error: "Email dena zaroori hai" })
    .email("Valid email do"),

  password: z
    .string({ required_error: "Password dena zaroori hai" })
    .min(8, "Password kam se kam 8 characters ka hona chahiye")
    .regex(/[A-Z]/, "Ek uppercase letter hona chahiye")
    .regex(/[0-9]/, "Ek number hona chahiye"),

  username: z
    .string({ required_error: "Username dena zaroori hai" })
    .min(3, "Username kam se kam 3 characters")
    .max(30, "Username zyada se zyada 30 characters")
    .regex(
      /^[a-zA-Z0-9_]+$/,
      "Username mein sirf letters, numbers aur underscore allowed hai"
    )
    .toLowerCase(),

  display_name: z
    .string()
    .max(50, "Display name bahut lamba hai")
    .optional(),
});

// ─── LOGIN ───────────────────────────────────────────
export const loginSchema = z.object({
  email: z
    .string({ required_error: "Email do" })
    .email("Valid email do"),

  password: z
    .string({ required_error: "Password do" })
    .min(1, "Password khali nahi hona chahiye"),
});

// ─── FORGOT PASSWORD ─────────────────────────────────
export const forgotPasswordSchema = z.object({
  email: z
    .string({ required_error: "Email do" })
    .email("Valid email do"),
});

// ─── RESET PASSWORD ───────────────────────────────────
export const resetPasswordSchema = z.object({
  token: z
    .string({ required_error: "Reset token required hai" })
    .min(1, "Token khali nahi hona chahiye"),

  newPassword: z
    .string({ required_error: "Naya password do" })
    .min(8, "Password kam se kam 8 characters")
    .regex(/[A-Z]/, "Ek uppercase letter hona chahiye")
    .regex(/[0-9]/, "Ek number hona chahiye"),
});