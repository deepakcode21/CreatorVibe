import * as creatorService from "./creator.service.js";
import {
  ok,
  created,
  badReq,
  notFound,
  serverErr,
  conflict,
} from "../../utils/response.util.js";
import { logger } from "../../utils/logger.util.js";

// ─── GET MY PROFILE ──────────────────────────────────────────────────────────
export const getMyProfile = async (req, res) => {
  try {
    const profile = await creatorService.getMyProfile(req.user.id);
    return ok(res, { profile }, "Profile fetched successfully");
  } catch (err) {
    logger.error("Get my profile error:", err.message);
    return serverErr(res, "Failed to fetch profile");
  }
};

// ─── GET PUBLIC PROFILE ──────────────────────────────────────────────────────
export const getPublicProfile = async (req, res) => {
  try {
    const profile = await creatorService.getPublicProfile(req.params.username);
    return ok(res, { profile }, "Profile fetched successfully");
  } catch (err) {
    if (err.statusCode === 404) return notFound(res, err.message);
    logger.error("Get public profile error:", err.message);
    return serverErr(res, "Failed to fetch profile");
  }
};

// ─── UPDATE PROFILE ──────────────────────────────────────────────────────────
export const updateProfile = async (req, res) => {
  try {
    const user = await creatorService.updateProfile(req.user.id, req.body);
    return ok(res, { user }, "Profile updated successfully");
  } catch (err) {
    if (err.statusCode === 409) return conflict(res, err.message);
    logger.error("Update profile error:", err.message);
    return serverErr(res, "Failed to update profile");
  }
};

// ─── UPDATE AVATAR ───────────────────────────────────────────────────────────
export const updateAvatar = async (req, res) => {
  try {
    if (!req.file) {
      return badReq(res, "Please upload an image file");
    }

    // File size check — max 5MB
    if (req.file.size > 5 * 1024 * 1024) {
      return badReq(res, "Image size cannot exceed 5MB");
    }

    // File type check
    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedTypes.includes(req.file.mimetype)) {
      return badReq(res, "Only JPEG, PNG and WebP images are allowed");
    }

    const user = await creatorService.updateAvatar(
      req.user.id,
      req.file.buffer,
      req.file.mimetype
    );

    return ok(res, { user }, "Avatar updated successfully");
  } catch (err) {
    logger.error("Update avatar error:", err.message);
    return serverErr(res, "Failed to update avatar");
  }
};

// ─── UPDATE SOCIAL LINKS ─────────────────────────────────────────────────────
export const updateSocialLinks = async (req, res) => {
  try {
    const links = await creatorService.updateSocialLinks(
      req.user.id,
      req.body
    );
    return ok(res, { links }, "Social links updated successfully");
  } catch (err) {
    logger.error("Update social links error:", err.message);
    return serverErr(res, "Failed to update social links");
  }
};