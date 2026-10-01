import express from "express";
import { createOrderController, verifyPaymentController } from "../controller/paymentController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/create-order", authMiddleware, createOrderController);
router.post("/verify", authMiddleware, verifyPaymentController);

export default router;