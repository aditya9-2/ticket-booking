import { eventModel } from "../../models/eventModel.js";

export interface SearchEventsInput {
    query?: string;
    maxPrice?: number;
}

export const searchEvents = async ({ query, maxPrice }: SearchEventsInput) => {
    const filter: Record<string, any> = {
        isDeleted: false,
        date: { $gte: new Date() },
    };

    if (query) filter.$text = { $search: query };
    if (maxPrice !== undefined) filter["sections.price"] = { $lte: maxPrice };

    return eventModel
        .find(filter)
        .select("-__v -createdBy")
        .sort({ date: 1 })
        .limit(10);
};