import { aiClient } from "./ai.client.js"
import { SYSTEM_PROMPT } from "./system-prompt.js"
import { toolDefinitions } from "./tools/tool-definitions.js"
import { searchEvents } from "./tools/search-events.tool.js"
import { getEventDetails } from "./tools/get-event-details.tool.js"
import { checkAvailability } from "./tools/check-availability.tool.js"
import { getMyBookings } from "./tools/get-my-bookings.tool.js"
import { createBookingTool } from "./tools/create-booking.tool.js"
import { redis } from "../config/redis.js"

interface ToolContext {
    userId: string
}

const contextualTools: Record<string, (args: any, ctx: ToolContext) => Promise<any>> = {
    getMyBookings,
    createBooking: createBookingTool,
}

const plainTools: Record<string, (args: any) => Promise<any>> = {
    searchEvents,
    getEventDetails,
    checkAvailability,
}

const MAX_TOOL_ROUNDS = 5
const TTL_SECONDS = Number(process.env.CHAT_HISTORY_TTL_SECONDS) || 172800

const conversationKey = (userId: string) => `chat:history:${userId}`

const getHistory = async (userId: string): Promise<any[]> => {
    const raw = await redis.get(conversationKey(userId))
    if (raw) return JSON.parse(raw)
    return [{ role: "system", content: SYSTEM_PROMPT }]
}

const saveHistory = async (userId: string, history: any[]) => {
    // Refresh TTL on every write — an active conversation keeps sliding its
    // expiry forward; an abandoned one still expires ~48h after the last message
    await redis.set(conversationKey(userId), JSON.stringify(history), "EX", TTL_SECONDS)
}

// Public getter for the frontend to rehydrate chat UI on load.
// Strips system + tool-call plumbing — only user/assistant turns are
// meaningful to render as chat bubbles.
export const getConversationHistory = async (userId: string) => {
    const history = await getHistory(userId)
    return history
        .filter((m: any) => m.role === "user" || m.role === "assistant")
        .filter((m: any) => typeof m.content === "string" && m.content.trim().length > 0)
        .map((m: any) => ({ role: m.role, content: m.content }))
}

export const askAIStream = async (
    userId: string,
    userMessage: string,
    onToken: (token: string) => void,
    onToolResults: (results: { name: string; result: any }[]) => void,
    onStatus: (status: string) => void
) => {
    const history = await getHistory(userId)
    history.push({ role: "user", content: userMessage })

    let rounds = 0
    const toolResults: { name: string; result: any }[] = []

    while (rounds < MAX_TOOL_ROUNDS) {
        const probe = await aiClient.chat.completions.create({
            model: "openrouter/free",
            messages: history,
            tools: toolDefinitions,
            tool_choice: "auto",
        })

        const choice = probe.choices[0]
        if (!choice) {
            const fallback = "I didn't get a response — please try again."
            history.push({ role: "assistant", content: fallback })
            await saveHistory(userId, history)
            onToken(fallback)
            onToolResults(toolResults)
            return
        }

        const message = choice.message

        if (!message.tool_calls?.length) {
            const streamRes = await aiClient.chat.completions.create({
                model: "openrouter/free",
                messages: history,
                tools: toolDefinitions,
                tool_choice: "auto",
                stream: true,
            })

            let fullContent = ""
            for await (const chunk of streamRes) {
                const delta = chunk.choices[0]?.delta?.content
                if (delta) {
                    fullContent += delta
                    onToken(delta)
                }
            }

            // Guard against a model returning truly empty content — never
            // leave the user with no reply at all, and never save an empty
            // string as a real assistant turn in history
            if (!fullContent.trim()) {
                fullContent =
                    "I'm not sure what you'd like to book yet — could you tell me which event, and how many tickets?"
                onToken(fullContent)
            }

            history.push({ role: "assistant", content: fullContent })
            await saveHistory(userId, history)
            onToolResults(toolResults)
            return
        }

        // Tool calls present — resolve them silently, no streaming needed here
        history.push(message)

        for (const toolCall of message.tool_calls) {
            if (toolCall.type !== "function") {
                history.push({
                    role: "tool",
                    tool_call_id: toolCall.id,
                    content: JSON.stringify({ error: "Unsupported tool call type" }),
                })
                continue
            }

            const name = toolCall.function.name

            // Give the user something to look at while the tool runs
            const statusText: Record<string, string> = {
                searchEvents: "Searching events…",
                getEventDetails: "Looking up event details…",
                checkAvailability: "Checking availability…",
                getMyBookings: "Pulling up your bookings…",
                createBooking: "Booking your tickets…",
            }
            onStatus(statusText[name] ?? "Working on it…")

            let args: any = {}
            try {
                args = JSON.parse(toolCall.function.arguments || "{}")
            } catch {
                args = {}
            }

            let result: any
            try {
                if (contextualTools[name]) {
                    result = await contextualTools[name](args, { userId })
                } else if (plainTools[name]) {
                    result = await plainTools[name](args)
                } else {
                    result = { error: `Unknown tool: ${name}` }
                }
            } catch (err: any) {
                result = { error: err.message ?? "Tool execution failed" }
            }

            if (["searchEvents", "getEventDetails"].includes(name)) {
                toolResults.push({ name, result })
            }

            history.push({
                role: "tool",
                tool_call_id: toolCall.id,
                content: JSON.stringify(result),
            })
        }

        // Persist after every round, not just at the end — so if something
        // fails or times out mid-loop, we never lose tool results/booking
        await saveHistory(userId, history)
        rounds++
    }

    const fallback = "I wasn't able to finish that request — could you rephrase or try again?"
    history.push({ role: "assistant", content: fallback })
    await saveHistory(userId, history)
    onToken(fallback)
    onToolResults(toolResults)
}