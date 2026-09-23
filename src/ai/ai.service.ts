import { aiClient } from "./ai.client.js"
import { SYSTEM_PROMPT } from "./system-prompt.js"
import { toolDefinitions } from "./tools/tool-definitions.js"
import { searchEvents } from "./tools/search-events.tool.js"
import { getEventDetails } from "./tools/get-event-details.tool.js"
import { checkAvailability } from "./tools/check-availability.tool.js"
import { getMyBookings } from "./tools/get-my-bookings.tool.js"
import { createBookingTool } from "./tools/create-booking.tool.js"

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

// TODO: use Redis
const conversations = new Map<string, any[]>()
const MAX_TOOL_ROUNDS = 5

export const askAIStream = async (
    userId: string,
    userMessage: string,
    onToken: (token: string) => void,
    onToolResults: (results: { name: string; result: any }[]) => void
) => {
    const history = conversations.get(userId) ?? [{ role: "system", content: SYSTEM_PROMPT }]
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
            conversations.set(userId, history)
            onToken("I didn't get a response — please try again.")
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

            history.push({ role: "assistant", content: fullContent })
            conversations.set(userId, history)
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

        rounds++
    }

    conversations.set(userId, history)
    onToken("I wasn't able to finish that request — could you rephrase or try again?")
    onToolResults(toolResults)
}