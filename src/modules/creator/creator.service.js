import { v2 as cloudinary } from "cloudinary";
import { supabaseAdmin } from "../../config/supabase.js";
import { env } from "../../config/env.js";
import { logger } from "../../utils/logger.util.js";

// ─── CLOUDINARY CONFIG ───────────────────────────────────────────────────────
cloudinary.config({
  cloud_name: env.CLOUDINARY_CLOUD_NAME,
  api_key: env.CLOUDINARY_API_KEY,
  api_secret: env.CLOUDINARY_API_SECRET,
});

// ─── GET MY PROFILE ──────────────────────────────────────────────────────────
export const getMyProfile = async (userId) => {
  const { data: user, error } = await supabaseAdmin
    .from("users")
    .select(`
      id,
      email,
      username,
      display_name,
      avatar,
      bio,
      status,
      email_verified,
      youtube_verified,
      created_at,
      social_links (
        youtube_url,
        instagram_url,
        twitter_url,
        discord_url,
        website_url
      )
    `)
    .eq("id", userId)
    .single();

  if (error) throw error;
  return user;
};

// ─── GET PUBLIC PROFILE ──────────────────────────────────────────────────────
export const getPublicProfile = async (username) => {
  const { data: user, error } = await supabaseAdmin
    .from("users")
    .select(`
      id,
      username,
      display_name,
      avatar,
      bio,
      youtube_verified,
      created_at,
      social_links (
        youtube_url,
        instagram_url,
        twitter_url,
        discord_url,
        website_url
      )
    `)
    .eq("username", username)
    .eq("status", "active")
    .single();

  if (error || !user) {
    throw Object.assign(
      new Error("Creator not found"),
      { statusCode: 404 }
    );
  }

  return user;
};

// ─── UPDATE PROFILE ──────────────────────────────────────────────────────────
export const updateProfile = async (userId, updates) => {
  // Username change — check if already taken
  if (updates.username) {
    const { data: existing } = await supabaseAdmin
      .from("users")
      .select("id")
      .eq("username", updates.username)
      .neq("id", userId)
      .single();

    if (existing) {
      throw Object.assign(
        new Error("Username is already taken"),
        { statusCode: 409 }
      );
    }
  }

  const { data: user, error } = await supabaseAdmin
    .from("users")
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId)
    .select("id, email, username, display_name, avatar, bio, status")
    .single();

  if (error) throw error;

  logger.info(`Profile updated: ${userId}`);
  return user;
};

// ─── UPDATE AVATAR ───────────────────────────────────────────────────────────
export const updateAvatar = async (userId, fileBuffer, mimetype) => {
  // Upload to Cloudinary
  const uploadResult = await new Promise((resolve, reject) => {
    cloudinary.uploader
      .upload_stream(
        {
          folder: "creatorvibe/avatars",
          public_id: `avatar_${userId}`,
          overwrite: true,
          transformation: [
            { width: 400, height: 400, crop: "fill", gravity: "face" },
            { quality: "auto", fetch_format: "auto" },
          ],
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      )
      .end(fileBuffer);
  });

  // Save URL to database
  const { data: user, error } = await supabaseAdmin
    .from("users")
    .update({
      avatar: uploadResult.secure_url,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId)
    .select("id, username, avatar")
    .single();

  if (error) throw error;

  logger.info(`Avatar updated: ${userId}`);
  return user;
};

// ─── UPDATE SOCIAL LINKS ─────────────────────────────────────────────────────
export const updateSocialLinks = async (userId, links) => {
  // Upsert — create if not exists, update if exists
  const { data, error } = await supabaseAdmin
    .from("social_links")
    .upsert(
      {
        user_id: userId,
        ...links,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    )
    .select()
    .single();

  if (error) throw error;

  logger.info(`Social links updated: ${userId}`);
  return data;
};