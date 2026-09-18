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