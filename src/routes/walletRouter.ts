import express from "express";
import { getWalletController, createRechargeOrderController, verifyRechargeController } from "../controller/walletController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", authMiddleware, getWalletController);
router.post("/create-order", authMiddleware, createRechargeOrderController);
router.post("/verify", authMiddleware, verifyRechargeController);

export default router;