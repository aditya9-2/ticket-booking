import type { Request, Response } from "express";
import { randomUUID } from "crypto";
import { createBookingService, getYourBookingsService } from "../services/bookingServices.js";

export const createBookingController = async (req: Request, res: Response) => {
    const userId = req.id;
    const { eventId, sectionId, quantity, idempotencyKey } = req.body;
    const qty = Number(quantity);

    if (!eventId || !sectionId || !qty || qty <= 0 || !idempotencyKey) {
        return res.status(400).json({ message: "All fields are required" });
    }

    const result = await createBookingService({
        userId,
        eventId,
        sectionId,
        quantity: qty,
        idempotencyKey,
    });

    return res.status(result.status).json(result.body);
};

export const getYourBookingController = async (req: Request, res: Response) => {
    try {
        const bookings = await getYourBookingsService(req.id);
        return res.status(200).json({ bookings });
    } catch (err) {
        return res.status(500).json({
            message: "Internal server Error",
            error: err instanceof Error ? err.message : undefined,
        });
    }
};