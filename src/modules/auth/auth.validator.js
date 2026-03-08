import { z } from "zod";

// ─── REGISTER ────────────────────────────────────────
export const registerSchema = z.object({
  email: z
    .string({ required_error: "Email is required" })
    .email("Please provide a valid email address"),

  password: z
    .string({ required_error: "Password is required" })
    .min(8, "Password must be at least 8 characters long")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),

  username: z
    .string({ required_error: "Username is required" })
    .min(3, "Username must be at least 3 characters")
    .max(30, "Username cannot exceed 30 characters")
    .regex(
      /^[a-zA-Z0-9_]+$/,
      "Username can only contain letters, numbers, and underscores"
    )
    .toLowerCase(),

  display_name: z
    .string()
    .max(50, "Display name is too long")
    .optional(),
});

// ─── LOGIN ───────────────────────────────────────────
export const loginSchema = z.object({
  email: z
    .string({ required_error: "Email is required" })
    .email("Please provide a valid email address"),

  password: z
    .string({ required_error: "Password is required" })
    .min(1, "Password cannot be empty"),
});

// ─── FORGOT PASSWORD ─────────────────────────────────
export const forgotPasswordSchema = z.object({
  email: z
    .string({ required_error: "Email is required" })
    .email("Please provide a valid email address"),
});

// ─── RESET PASSWORD ───────────────────────────────────
export const resetPasswordSchema = z.object({
  token: z
    .string({ required_error: "Reset token is required" })
    .min(1, "Token cannot be empty"),

  newPassword: z
    .string({ required_error: "New password is required" })
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
});