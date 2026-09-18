import type { Request, Response } from "express";
import { askAI } from "../ai/ai.service.js";

export const chatWithAIController = async (req: Request, res: Response) => {
    try {
        const userId = req.id;
        const { message } = req.body;

        if (!message || typeof message !== "string") {
            return res.status(400).json({ message: "message is required" });
        }

        const reply = await askAI(userId, message);
        return res.status(200).json({ reply });
    } catch (err) {
        return res.status(500).json({
            message: "AI service error",
            error: err instanceof Error ? err.message : undefined,
        });
    }
};