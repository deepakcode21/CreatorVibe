import { Router } from "express";
import multer from "multer";
import * as creatorController from "./creator.controller.js";
import { protect } from "../../middlewares/auth.middleware.js";
import { validate } from "../../middlewares/auth.middleware.js";
import {
  updateProfileSchema,
  updateSocialLinksSchema,
} from "./creator.validator.js";

const router = Router();

// Multer — memory storage (file buffer Cloudinary ko bhejenge)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
});

// ─── PRIVATE ROUTES (login required) ─────────────────────────────────────────
router.get("/me",
  protect,
  creatorController.getMyProfile
);

router.put("/me",
  protect,
  validate(updateProfileSchema),
  creatorController.updateProfile
);

router.put("/me/avatar",
  protect,
  upload.single("avatar"),
  creatorController.updateAvatar
);

router.put("/me/social-links",
  protect,
  validate(updateSocialLinksSchema),
  creatorController.updateSocialLinks
);

// ─── PUBLIC ROUTES (no login required) ───────────────────────────────────────
router.get("/:username",
  creatorController.getPublicProfile
);

export default router;