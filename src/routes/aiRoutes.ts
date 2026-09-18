import express from "express";
import { chatWithAIController } from "../controller/aiController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/chat", authMiddleware, chatWithAIController);

export default router;