import { aiClient } from "./ai.client.js";
import { SYSTEM_PROMPT } from "./system-prompt.js";
import { toolDefinitions } from "./tools/tool-definitions.js";
import { searchEvents } from "./tools/search-events.tool.js";
import { getEventDetails } from "./tools/get-event-details.tool.js";
import { checkAvailability } from "./tools/check-availability.tool.js";
import { getMyBookings } from "./tools/get-my-bookings.tool.js";
import { createBookingTool } from "./tools/create-booking.tool.js";

interface ToolContext {
    userId: string;
}

// Tools that need the authenticated user injected server-side
const contextualTools: Record<string, (args: any, ctx: ToolContext) => Promise<any>> = {
    getMyBookings,
    createBooking: createBookingTool,
};

// Tools that only take LLM-supplied args
const plainTools: Record<string, (args: any) => Promise<any>> = {
    searchEvents,
    getEventDetails,
    checkAvailability,
};

// Very simple in-memory per-user conversation store.
// Fine for local Postman testing; swap for Redis/DB before production
// (it resets on server restart and doesn't scale across instances).
const conversations = new Map<string, any[]>();

const MAX_TOOL_ROUNDS = 5;

export const askAI = async (userId: string, userMessage: string) => {
    const history = conversations.get(userId) ?? [
        { role: "system", content: SYSTEM_PROMPT },
    ];

    history.push({ role: "user", content: userMessage });

    let rounds = 0;

    while (rounds < MAX_TOOL_ROUNDS) {
        const response = await aiClient.chat.completions.create({
            model: "openrouter/free", // confirm this model supports tool calling
            messages: history,
            tools: toolDefinitions,
            tool_choice: "auto",
        });

        const choice = response.choices[0];

        if (!choice) {
            conversations.set(userId, history);
            return "I didn't get a response — please try again.";
        }

        const message = choice.message;

        if (!message.tool_calls?.length) {
            history.push({ role: "assistant", content: message.content });
            conversations.set(userId, history);
            return message.content;
        }

        history.push(message);

        for (const toolCall of message.tool_calls) {
            // We only define/expect "function" tools — narrow away the
            // custom-tool-call variant before touching .function
            if (toolCall.type !== "function") {
                history.push({
                    role: "tool",
                    tool_call_id: toolCall.id,
                    content: JSON.stringify({ error: "Unsupported tool call type" }),
                });
                continue;
            }

            const name = toolCall.function.name;
            let args: any = {};
            try {
                args = JSON.parse(toolCall.function.arguments || "{}");
            } catch {
                args = {};
            }

            let result: any;
            try {
                if (contextualTools[name]) {
                    result = await contextualTools[name](args, { userId });
                } else if (plainTools[name]) {
                    result = await plainTools[name](args);
                } else {
                    result = { error: `Unknown tool: ${name}` };
                }
            } catch (err: any) {
                result = { error: err.message ?? "Tool execution failed" };
            }

            history.push({
                role: "tool",
                tool_call_id: toolCall.id,
                content: JSON.stringify(result),
            });
        }

        rounds++;
    }

    conversations.set(userId, history);
    return "I wasn't able to finish that request — could you rephrase or try again?";
};