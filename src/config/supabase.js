import { createClient } from "@supabase/supabase-js";
import { env } from "./env.js";
import { logger } from "../utils/logger.util.js";

// ─── NORMAL CLIENT ───────────────────────────────────
// Frontend requests ke liye — limited access
export const supabase = createClient(
  env.SUPABASE_URL,
  env.SUPABASE_ANON_KEY
);

// ─── ADMIN CLIENT ────────────────────────────────────
// Backend ke liye — full access
// Kabhi bhi frontend ko mat dena ye key!
export const supabaseAdmin = createClient(
  env.SUPABASE_URL,
  env.SUPABASE_SERVICE_KEY
);

// ─── CONNECTION CHECK ────────────────────────────────
export const checkSupabaseConnection = async () => {
  try {
    const { error } = await supabaseAdmin
      .from("users")
      .select("count")
      .limit(1);

    // Table exist nahi karti abhi — that's okay!
    // Bas connection check kar rahe hain
    if (error && error.code !== "42P01") {
      throw error;
    }

    logger.info("✅ Supabase connected!");
  } catch (err) {
    logger.error("❌ Supabase connection failed:", err.message);
    process.exit(1);
  }
};