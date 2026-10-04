import { eventModel } from "../../models/eventModel.js";
import { EventCategory } from "../../types/category.js";

export interface SearchEventsInput {
    query?: string;
    maxPrice?: number;
    category?: string;
    venue?: string;
    location?: string;
}

export const searchEvents = async ({ query, maxPrice, category, venue, location }: SearchEventsInput) => {
    const filter: Record<string, any> = {
        isDeleted: false,
        date: { $gte: new Date() },
    };

    if (query) filter.$text = { $search: query };
    if (maxPrice !== undefined) filter["sections.price"] = { $lte: maxPrice };

    if (category) {
        const normalized = category.toLowerCase();
        if (Object.values(EventCategory).includes(normalized as EventCategory)) {
            filter.category = normalized;
        }
    }

    if (venue) filter.venue = { $regex: venue, $options: "i" };
    if (location) filter.location = { $regex: location, $options: "i" };

    return eventModel
        .find(filter)
        .select("-__v -createdBy")
        .sort({ date: 1 })
        .limit(10);
};