import express from "express";
import { chatWithAIController, getChatHistoryController } from "../controller/aiController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/chat", authMiddleware, chatWithAIController);
router.get("/history", authMiddleware, getChatHistoryController);

export default router;