import type { Request, Response } from "express";
import { eventModel } from "../models/eventModel.js";
import { bookingModel } from "../models/bookingModel.js";
import mongoose from "mongoose";

export const createBookingController = async (req: Request, res: Response) => {

    const session = await mongoose.startSession();

    try {
        session.startTransaction();

        const userId = req.id;
        const { eventId, sectionId, quantity, idempotencyKey } = req.body;
        const qty = Number(quantity);

        if (!eventId || !sectionId || !qty || qty <= 0 || !idempotencyKey) {
            await session.abortTransaction();
            return res.status(400).json({ message: "All fields are required" });
        }

        const existingBooking = await bookingModel.findOne(
            { idempotencyKey },
            null,
            { session }
        );

        if (existingBooking) {
            await session.abortTransaction();
            return res.status(200).json({
                message: "Booking already processed",
                booking: existingBooking
            });
        }

        const updatedEvent = await eventModel.findOneAndUpdate(
            {
                _id: eventId,
                "sections._id": sectionId,
                "sections.remaining": { $gte: qty }
            },
            {
                $inc: { "sections.$.remaining": -qty }
            },
            { new: true, session }
        );

        if (!updatedEvent) {
            await session.abortTransaction();
            return res.status(400).json({ message: "not enough seats available" });
        }

        const section = updatedEvent.sections.find((s) => s._id?.toString() === sectionId);

        if (!section) {
            await session.abortTransaction();
            return res.status(500).json({ message: "Section not found" });
        }

        const [booking] = await bookingModel.create([{
            userId,
            eventId,
            sectionId,
            quantity: qty,
            priceAtBooking: section.price,
            idempotencyKey
        }], { session });

        await session.commitTransaction();

        return res.status(201).json({
            message: "Booking successful",
            booking
        });

    } catch (err) {

        await session.abortTransaction();
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
                $addFields: {
                    section: {
                        $first: {
                            $filter: {
                                input: "$event.sections",
                                as: "sec",
                                cond: {
                                    $eq: ["$$sec._id", "$sectionId"],
                                },
                            },
                        },
                    },
                },
            },
            {
                $project: {
                    _id: 1,
                    eventName: "$event.name",
                    sectionName: "$section.name",
                    quantity: 1,
                    priceAtBooking: 1,
                    createdAt: 1,
                },
            },
            { $sort: { createdAt: -1 } },
        ]);

        return res.status(200).json({
            bookings,
        });

    } catch (err) {

        return res.status(500).json({
            message: "Internal server Error",
            error: err instanceof Error ? err.message : undefined
        });


    }

}