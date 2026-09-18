import type OpenAI from "openai";

export const toolDefinitions = [
    {
        type: "function",
        function: {
            name: "searchEvents",
            description: "Search upcoming events by keyword and/or maximum price.",
            parameters: {
                type: "object",
                properties: {
                    query: { type: "string", description: "Keyword, e.g. 'comedy'" },
                    maxPrice: { type: "number", description: "Maximum ticket price in INR" },
                },
                required: [],
            },
        },
    },
    {
        type: "function",
        function: {
            name: "getEventDetails",
            description: "Get full details for a single event, including its sections.",
            parameters: {
                type: "object",
                properties: {
                    eventId: { type: "string", description: "MongoDB ObjectId of the event" },
                },
                required: ["eventId"],
            },
        },
    },
    {
        type: "function",
        function: {
            name: "checkAvailability",
            description: "Check whether a given quantity of tickets is available in a section.",
            parameters: {
                type: "object",
                properties: {
                    eventId: { type: "string" },
                    sectionId: { type: "string" },
                    quantity: { type: "number" },
                },
                required: ["eventId", "sectionId", "quantity"],
            },
        },
    },
    {
        type: "function",
        function: {
            name: "getMyBookings",
            description: "Get the current user's upcoming bookings. Takes no arguments.",
            parameters: { type: "object", properties: {}, required: [] },
        },
    },
    {
        type: "function",
        function: {
            name: "createBooking",
            description:
                "Create a booking for the current user. Only call this AFTER the user has explicitly confirmed the event, section, quantity, and total price.",
            parameters: {
                type: "object",
                properties: {
                    eventId: { type: "string" },
                    sectionId: { type: "string" },
                    quantity: { type: "number" },
                },
                required: ["eventId", "sectionId", "quantity"],
            },
        },
    },
] as const satisfies OpenAI.Chat.Completions.ChatCompletionTool[];