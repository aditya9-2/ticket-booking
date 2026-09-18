import mongoose from "mongoose";
import { eventModel } from "../models/eventModel.js";
import { bookingModel } from "../models/bookingModel.js";

export class BookingError extends Error {
    constructor(public status: number, message: string) {
        super(message);
    }
}

export interface CreateBookingInput {
    userId: string;
    eventId: string;
    sectionId: string;
    quantity: number;
    idempotencyKey: string;
}

export const createBookingService = async ({
    userId,
    eventId,
    sectionId,
    quantity,
    idempotencyKey,
}: CreateBookingInput) => {
    const session = await mongoose.startSession();
    let result: { status: number; body: any } | null = null;

    try {
        await session.withTransaction(async () => {
            const existingBooking = await bookingModel.findOne(
                { idempotencyKey },
                null,
                { session }
            );

            if (existingBooking) {
                result = {
                    status: 200,
                    body: { message: "Booking already processed", booking: existingBooking },
                };
                return;
            }

            const updatedEvent = await eventModel.findOneAndUpdate(
                {
                    _id: eventId,
                    "sections._id": sectionId,
                    "sections.remaining": { $gte: quantity },
                },
                { $inc: { "sections.$.remaining": -quantity } },
                { new: true, session }
            );

            if (!updatedEvent) {
                throw new BookingError(409, "Not enough seats available");
            }

            const section = updatedEvent.sections.find(
                (s) => s._id?.toString() === sectionId
            );

            if (!section) {
                throw new BookingError(500, "Section not found");
            }

            const [booking] = await bookingModel.create(
                [
                    {
                        userId,
                        eventId,
                        sectionId,
                        quantity,
                        priceAtBooking: section.price,
                        idempotencyKey,
                    },
                ],
                { session }
            );

            result = { status: 201, body: { message: "Booking successful", booking } };
        });

        return result!;
    } catch (err: any) {
        if (err instanceof BookingError) {
            return { status: err.status, body: { message: err.message } };
        }

        if (err?.code === 11000) {
            const booking = await bookingModel.findOne({ idempotencyKey });
            return { status: 200, body: { message: "Booking already processed", booking } };
        }

        return {
            status: 500,
            body: {
                message: "Internal server Error",
                error: err instanceof Error ? err.message : undefined,
            },
        };
    } finally {
        await session.endSession();
    }
};

export const getYourBookingsService = async (userId: string) => {
    const now = new Date();

    return bookingModel.aggregate([
        { $match: { userId: new mongoose.Types.ObjectId(userId) } },
        {
            $lookup: {
                from: "events",
                localField: "eventId",
                foreignField: "_id",
                as: "event",
            },
        },
        { $unwind: "$event" },
        { $match: { "event.date": { $gte: now } } },
        {
            $addFields: {
                section: {
                    $first: {
                        $filter: {
                            input: "$event.sections",
                            as: "sec",
                            cond: { $eq: ["$$sec._id", "$sectionId"] },
                        },
                    },
                },
            },
        },
        {
            $project: {
                _id: 1,
                eventName: "$event.name",
                eventDate: "$event.date",
                sectionName: "$section.name",
                quantity: 1,
                priceAtBooking: 1,
                createdAt: 1,
            },
        },
        { $sort: { eventDate: 1 } },
    ]);
};