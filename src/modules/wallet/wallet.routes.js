import { Router } from "express";
import * as walletController from "./wallet.controller.js";
import { protect } from "../../middlewares/auth.middleware.js";

const router = Router();

// ─── ALL ROUTES PROTECTED ────────────────────────────────────────────────────

router.get("/balance",
  protect,
  walletController.getWalletBalance
);

router.get("/transactions",
  protect,
  walletController.getTransactionHistory
);

router.get("/stats",
  protect,
  walletController.getWalletStats
);

export default router;