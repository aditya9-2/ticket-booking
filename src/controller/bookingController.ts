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
            return res.status(400).json({
                message: "All fields are required"
            });
        }

        const existingBooking = await bookingModel.findOne(
            { idempotencyKey },
            null,
            { session }
        );

        if (existingBooking) {
            await session.commitTransaction();
            return res.status(200).json({
                message: "Booking already processed",
                booking: existingBooking
            });
        }

        const updatedEvent = await eventModel.findOneAndUpdate(
            {
                _id: eventId,
                "sections._id": sectionId,
                "sections.remaining": { $gte: quantity }
            },
            {
                $inc: { "sections.$.remaining": -quantity }
            },
            { new: true, session }
        );

        if (!updatedEvent) {
            return res.status(400).json({
                message: "not enough seats available"
            });
        }

        const section = updatedEvent.sections.find((s) => s._id?.toString() === sectionId);

        if (!section) {
            return res.status(500).json({
                message: "Section not found"
            });
        }

        const booking = await bookingModel.create([{
            userId,
            eventId,
            sectionId,
            quantity: qty,
            priceAtBooking: section.price,
            idempotencyKey
        }], { session });

        session.commitTransaction();

        return res.status(201).json({
            message: "Booking successful",
            booking
        });

    } catch (err) {

        return res.status(500).json({
            message: "Internal server Error",
            error: err instanceof Error ? err.message : undefined
        });
    }
}