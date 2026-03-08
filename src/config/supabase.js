import { createClient } from "@supabase/supabase-js";
import { env } from "./env.js";
import { logger } from "../utils/logger.util.js";

// ─── NORMAL CLIENT ───────────────────────────────────
// For frontend requests — restricted access
export const supabase = createClient(
  env.SUPABASE_URL,
  env.SUPABASE_ANON_KEY
);

// ─── ADMIN CLIENT ────────────────────────────────────
// For backend operations — full administrative access
// SECURITY WARNING: Never expose this service key to the frontend!
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

    // If table doesn't exist yet (code 42P01), that's acceptable
    // We are only verifying the connection integrity
    if (error && error.code !== "42P01") {
      throw error;
    }

    logger.info("Supabase connected successfully");
  } catch (err) {
    logger.error("Supabase connection failed:", err.message);
    process.exit(1);
  }
};