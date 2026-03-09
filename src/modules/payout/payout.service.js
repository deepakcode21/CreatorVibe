import { supabaseAdmin } from "../../config/supabase.js";
import { logger } from "../../utils/logger.util.js";
import { env } from "../../config/env.js";

// ─── ADD BANK ACCOUNT ─────────────────────────────────────────────────────────
export const addBankAccount = async (creator_id, bankData) => {
  // If is_default true — remove default from others first
  if (bankData.is_default) {
    await supabaseAdmin
      .from("bank_accounts")
      .update({ is_default: false })
      .eq("creator_id", creator_id);
  }

  // Check if this is first bank account — auto set as default
  const { count } = await supabaseAdmin
    .from("bank_accounts")
    .select("*", { count: "exact", head: true })
    .eq("creator_id", creator_id);

  const isFirst = count === 0;

  const { data, error } = await supabaseAdmin
    .from("bank_accounts")
    .insert({
      creator_id,
      ...bankData,
      is_default: isFirst ? true : bankData.is_default,
    })
    .select()
    .single();

  if (error) throw error;

  logger.info(`Bank account added: ${creator_id}`);
  return data;
};

// ─── GET BANK ACCOUNTS ────────────────────────────────────────────────────────
export const getBankAccounts = async (creator_id) => {
  const { data, error } = await supabaseAdmin
    .from("bank_accounts")
    .select("*")
    .eq("creator_id", creator_id)
    .order("is_default", { ascending: false });

  if (error) throw error;
  return data;
};

// ─── DELETE BANK ACCOUNT ──────────────────────────────────────────────────────
export const deleteBankAccount = async (creator_id, account_id) => {
  const { data: account } = await supabaseAdmin
    .from("bank_accounts")
    .select("is_default")
    .eq("id", account_id)
    .eq("creator_id", creator_id)
    .single();

  if (!account) {
    throw Object.assign(
      new Error("Bank account not found"),
      { statusCode: 404 }
    );
  }

  if (account.is_default) {
    throw Object.assign(
      new Error("Cannot delete default bank account. Set another as default first."),
      { statusCode: 400 }
    );
  }

  const { error } = await supabaseAdmin
    .from("bank_accounts")
    .delete()
    .eq("id", account_id)
    .eq("creator_id", creator_id);

  if (error) throw error;

  logger.info(`Bank account deleted: ${account_id}`);
};

// ─── SET DEFAULT BANK ACCOUNT ─────────────────────────────────────────────────
export const setDefaultBankAccount = async (creator_id, account_id) => {
  // Remove default from all
  await supabaseAdmin
    .from("bank_accounts")
    .update({ is_default: false })
    .eq("creator_id", creator_id);

  // Set new default
  const { data, error } = await supabaseAdmin
    .from("bank_accounts")
    .update({ is_default: true })
    .eq("id", account_id)
    .eq("creator_id", creator_id)
    .select()
    .single();

  if (error || !data) {
    throw Object.assign(
      new Error("Bank account not found"),
      { statusCode: 404 }
    );
  }

  return data;
};

// ─── REQUEST PAYOUT ───────────────────────────────────────────────────────────
export const requestPayout = async (creator_id, { amount, bank_account_id, gateway }) => {
  // Check wallet balance
  const { data: wallet } = await supabaseAdmin
    .from("creator_wallet")
    .select("available")
    .eq("creator_id", creator_id)
    .single();

  if (!wallet || wallet.available < amount) {
    throw Object.assign(
      new Error("Insufficient wallet balance"),
      { statusCode: 400 }
    );
  }

  // Verify bank account belongs to creator
  const { data: bankAccount } = await supabaseAdmin
    .from("bank_accounts")
    .select("*")
    .eq("id", bank_account_id)
    .eq("creator_id", creator_id)
    .single();

  if (!bankAccount) {
    throw Object.assign(
      new Error("Bank account not found"),
      { statusCode: 404 }
    );
  }

  // Deduct from available balance
  await supabaseAdmin
    .from("creator_wallet")
    .update({
      available: wallet.available - amount,
      withdrawn: supabaseAdmin.rpc("get_withdrawn", { p_creator_id: creator_id }),
      updated_at: new Date().toISOString(),
    })
    .eq("creator_id", creator_id);

  // Create payout request
  const { data: payout, error } = await supabaseAdmin
    .from("payout_requests")
    .insert({
      creator_id,
      amount,
      gateway,
      bank_account_id,
      status: "pending",
    })
    .select()
    .single();

  if (error) throw error;

  logger.info(`Payout requested: ${payout.id} — Amount: ${amount}`);

  return payout;
};

// ─── GET PAYOUT HISTORY ───────────────────────────────────────────────────────
export const getPayoutHistory = async (creator_id, page = 1, limit = 20) => {
  const offset = (page - 1) * limit;

  const { data, error, count } = await supabaseAdmin
    .from("payout_requests")
    .select(`
      *,
      bank_accounts (
        bank_name,
        account_number,
        ifsc_code
      )
    `, { count: "exact" })
    .eq("creator_id", creator_id)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) throw error;

  return {
    payouts: data,
    pagination: {
      page,
      limit,
      total: count,
      totalPages: Math.ceil(count / limit),
    },
  };
};