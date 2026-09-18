import { getEventById } from "../../services/eventServices.js";

export interface GetEventDetailsInput {
    eventId: string;
}

export const getEventDetails = async ({ eventId }: GetEventDetailsInput) => {
    const event = await getEventById(eventId);
    if (!event) return { error: "Event not found" };
    return event;
};