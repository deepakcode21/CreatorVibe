import { Router } from "express";
import * as superchatController from "./superchat.controller.js";
import { protect, validate } from "../../middlewares/auth.middleware.js";
import {
  initiateSuperChatSchema,
  verifyPaymentSchema,
} from "./superchat.validator.js";

const router = Router();

// ─── PUBLIC ROUTES (no login required) ───────────────────────────────────────

// Donor superchat initiate kare — no auth needed
router.post("/initiate",
  validate(initiateSuperChatSchema),
  superchatController.initiateSuperchat
);

// Payment verify karo — no auth needed
router.post("/verify",
  validate(verifyPaymentSchema),
  superchatController.verifyPayment
);

// ─── PRIVATE ROUTES (login required) ─────────────────────────────────────────

// Creator apne superchats dekhe
router.get("/my",
  protect,
  superchatController.getCreatorSuperchats
);

export default router;