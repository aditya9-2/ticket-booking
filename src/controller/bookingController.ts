import type { Request, Response } from "express";
import { eventModel } from "../models/eventModel.js";
import { bookingModel } from "../models/bookingModel.js";
import mongoose from "mongoose";

class BookingError extends Error {
    constructor(public status: number, message: string) {
        super(message);
    }
}

export const createBookingController = async (req: Request, res: Response) => {
    const userId = req.id;
    const { eventId, sectionId, quantity, idempotencyKey } = req.body;
    const qty = Number(quantity);

    if (!eventId || !sectionId || !qty || qty <= 0 || !idempotencyKey) {
        return res.status(400).json({ message: "All fields are required" });
    }

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
                    body: { message: "Booking already processed", booking: existingBooking }
                };
                return;
            }

            const updatedEvent = await eventModel.findOneAndUpdate(
                {
                    _id: eventId,
                    "sections._id": sectionId,
                    "sections.remaining": { $gte: qty }
                },
                { $inc: { "sections.$.remaining": -qty } },
                { new: true, session }
            );

            if (!updatedEvent) {
                throw new BookingError(409, "Not enough seats available");
            }

            const section = updatedEvent.sections.find((s) => s._id?.toString() === sectionId);

            if (!section) {
                throw new BookingError(500, "Section not found");
            }

            const [booking] = await bookingModel.create([{
                userId,
                eventId,
                sectionId,
                quantity: qty,
                priceAtBooking: section.price,
                idempotencyKey
            }], { session });

            result = {
                status: 201,
                body: { message: "Booking successful", booking }
            };
        });

        return res.status(result!.status).json(result!.body);

    } catch (err: any) {
        if (err instanceof BookingError) {
            return res.status(err.status).json({ message: err.message });
        }

        if (err?.code === 11000) {
            const booking = await bookingModel.findOne({ idempotencyKey });
            return res.status(200).json({
                message: "Booking already processed",
                booking
            });
        }

        return res.status(500).json({
            message: "Internal server Error",
            error: err instanceof Error ? err.message : undefined
        });

    } finally {
        await session.endSession();
    }
}

export const getYourBookingController = async (req: Request, res: Response) => {
    try {
        const userId = req.id;
        const now = new Date();

        const bookings = await bookingModel.aggregate([
            {
                $match: {
                    userId: new mongoose.Types.ObjectId(userId),
                },
            },
            {
                $lookup: {
                    from: "events",
                    localField: "eventId",
                    foreignField: "_id",
                    as: "event",
                },
            },
            { $unwind: "$event" },
            {
                $match: {
                    "event.date": { $gte: now }
                }
            },
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

        return res.status(200).json({ bookings });
    } catch (err) {
        return res.status(500).json({
            message: "Internal server Error",
            error: err instanceof Error ? err.message : undefined
        });
    }
}