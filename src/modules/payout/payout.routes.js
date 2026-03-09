import { Router } from "express";
import * as payoutController from "./payout.controller.js";
import { protect, validate } from "../../middlewares/auth.middleware.js";
import {
  addBankAccountSchema,
  requestPayoutSchema,
} from "./payout.validator.js";

const router = Router();

// ─── BANK ACCOUNTS ────────────────────────────────────────────────────────────

router.get("/bank-accounts",
  protect,
  payoutController.getBankAccounts
);

router.post("/bank-accounts",
  protect,
  validate(addBankAccountSchema),
  payoutController.addBankAccount
);

router.delete("/bank-accounts/:id",
  protect,
  payoutController.deleteBankAccount
);

router.patch("/bank-accounts/:id/default",
  protect,
  payoutController.setDefaultBankAccount
);

// ─── PAYOUTS ──────────────────────────────────────────────────────────────────

router.post("/request",
  protect,
  validate(requestPayoutSchema),
  payoutController.requestPayout
);

router.get("/history",
  protect,
  payoutController.getPayoutHistory
);

export default router;