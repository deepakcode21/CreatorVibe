import { supabaseAdmin } from "../../config/supabase.js";
import { logger } from "../../utils/logger.util.js";

// ─── GET WALLET BALANCE ───────────────────────────────────────────────────────
export const getWalletBalance = async (creator_id) => {
  const { data: wallet, error } = await supabaseAdmin
    .from("creator_wallet")
    .select("*")
    .eq("creator_id", creator_id)
    .single();

  if (error || !wallet) {
    return {
      total_earned: 0,
      available: 0,
      withdrawn: 0,
    };
  }

  return wallet;
};

// ─── GET TRANSACTION HISTORY ──────────────────────────────────────────────────
export const getTransactionHistory = async (
  creator_id,
  page = 1,
  limit = 20,
  status = null
) => {
  const offset = (page - 1) * limit;

  let query = supabaseAdmin
    .from("superchat_transactions")
    .select("*", { count: "exact" })
    .eq("creator_id", creator_id)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (status) {
    query = query.eq("status", status);
  }

  const { data, error, count } = await query;

  if (error) throw error;

  return {
    transactions: data,
    pagination: {
      page,
      limit,
      total: count,
      totalPages: Math.ceil(count / limit),
    },
  };
};

// ─── GET WALLET STATS ─────────────────────────────────────────────────────────
export const getWalletStats = async (creator_id) => {
  // Total earnings this month
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const { data: monthlyData } = await supabaseAdmin
    .from("superchat_transactions")
    .select("creator_amount")
    .eq("creator_id", creator_id)
    .eq("status", "completed")
    .gte("created_at", startOfMonth.toISOString());

  const monthlyEarnings = monthlyData?.reduce(
    (sum, tx) => sum + tx.creator_amount,
    0
  ) || 0;

  // Total superchats count
  const { count: totalSuperchats } = await supabaseAdmin
    .from("superchat_transactions")
    .select("*", { count: "exact", head: true })
    .eq("creator_id", creator_id)
    .eq("status", "completed");

  // Top donors
  const { data: topDonors } = await supabaseAdmin
    .from("superchat_transactions")
    .select("donor_name, donor_email, amount")
    .eq("creator_id", creator_id)
    .eq("status", "completed")
    .order("amount", { ascending: false })
    .limit(5);

  // Wallet balance
  const wallet = await getWalletBalance(creator_id);

  return {
    wallet,
    monthly_earnings: parseFloat(monthlyEarnings.toFixed(2)),
    total_superchats: totalSuperchats || 0,
    top_donors: topDonors || [],
  };
};