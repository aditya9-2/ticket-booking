import { eventModel } from "../models/eventModel.js";

export const getAllEvents = async () => {
    return eventModel
        .find({ isDeleted: false })
        .select("-__v -createdBy")
        .sort({ date: 1 });
};


export const getEventById = async (eventId: string | string[]) => {
    return eventModel
        .findOne({
            _id: eventId,
            isDeleted: false
        })
        .select("-__v -createdBy");
};


export const checkSectionAvailability = async (
    eventId: string,
    sectionId: string,
    quantity: number
) => {
    const event = await eventModel.findOne({ _id: eventId, isDeleted: false });

    if (!event) {
        return { available: false, reason: "Event not found" };
    }

    const section = event.sections.find((s) => s._id?.toString() === sectionId);

    if (!section) {
        return { available: false, reason: "Section not found" };
    }

    return {
        available: section.remaining >= quantity,
        remaining: section.remaining,
        price: section.price,
        sectionName: section.name,
    };
};