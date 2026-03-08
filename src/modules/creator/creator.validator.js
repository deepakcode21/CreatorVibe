import { z } from "zod";

// ─── UPDATE PROFILE ──────────────────────────────────────────────────────────
export const updateProfileSchema = z.object({
  display_name: z
    .string()
    .min(1, "Display name cannot be empty")
    .max(50, "Display name cannot exceed 50 characters")
    .optional(),

  bio: z
    .string()
    .max(300, "Bio cannot exceed 300 characters")
    .optional(),

  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(30, "Username cannot exceed 30 characters")
    .regex(
      /^[a-zA-Z0-9_]+$/,
      "Username can only contain letters, numbers and underscores"
    )
    .toLowerCase()
    .optional(),
});

// ─── UPDATE SOCIAL LINKS ─────────────────────────────────────────────────────
export const updateSocialLinksSchema = z.object({
  youtube_url: z
    .string()
    .url("Invalid YouTube URL")
    .regex(/youtube\.com|youtu\.be/, "Must be a valid YouTube URL")
    .optional()
    .nullable(),

  instagram_url: z
    .string()
    .url("Invalid Instagram URL")
    .regex(/instagram\.com/, "Must be a valid Instagram URL")
    .optional()
    .nullable(),

  twitter_url: z
    .string()
    .url("Invalid Twitter URL")
    .regex(/twitter\.com|x\.com/, "Must be a valid Twitter/X URL")
    .optional()
    .nullable(),

  discord_url: z
    .string()
    .url("Invalid Discord URL")
    .regex(/discord\.gg|discord\.com/, "Must be a valid Discord URL")
    .optional()
    .nullable(),

  website_url: z
    .string()
    .url("Invalid website URL")
    .optional()
    .nullable(),
});