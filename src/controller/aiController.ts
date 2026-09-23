import type { Request, Response } from "express"
import { askAIStream, getConversationHistory } from "../ai/ai.service.js"

export const chatWithAIController = async (req: Request, res: Response) => {
    try {
        const userId = req.id
        const { message } = req.body

        if (!message || typeof message !== "string") {
            return res.status(400).json({ message: "message is required" })
        }

        res.setHeader("Content-Type", "text/event-stream")
        res.setHeader("Cache-Control", "no-cache")
        res.setHeader("Connection", "keep-alive")
        res.flushHeaders()

        const send = (event: string, data: unknown) => {
            res.write(`event: ${event}\n`)
            res.write(`data: ${JSON.stringify(data)}\n\n`)
        }

        await askAIStream(
            userId,
            message,
            (token) => send("token", { token }),
            (toolResults) => send("toolResults", { toolResults })
        )

        send("done", {})
        res.end()
    } catch (err) {
        if (res.headersSent) {
            res.write(`event: error\ndata: ${JSON.stringify({ message: "AI service error" })}\n\n`)
            res.end()
        } else {
            res.status(500).json({
                message: "AI service error",
                error: err instanceof Error ? err.message : undefined,
            })
        }
    }
}

export const getChatHistoryController = async (req: Request, res: Response) => {
    try {
        const userId = req.id
        const history = await getConversationHistory(userId)
        return res.status(200).json({ history })
    } catch (err) {
        return res.status(500).json({
            message: "Couldn't load chat history",
            error: err instanceof Error ? err.message : undefined,
        })
    }
}