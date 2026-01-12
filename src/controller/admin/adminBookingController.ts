import type { Request, Response } from "express";
import { RoleId } from "../../types/roleId.js";
import { bookingModel } from "../../models/bookingModel.js";

export const getBookingsForAdminController = async (req: Request, res: Response) => {
    try {

        if (req.roleId !== RoleId.Admin) {
            return res.status(403).json({
                message: "Forbidden! Only Admins can create events."
            });
        }

        const allBookings = await bookingModel.find().populate("userId", "name email").populate("eventId", "name");

        if(allBookings.length === 0) {
            return res.status(411).json({
                message: "No bookings available"
            });
        }

        return res.status(200).json({
            allBookings
        });


    } catch (err) {

        return res.status(500).json({
            message: "Internal server Error",
            error: err instanceof Error ? err.message : undefined
        });
    }
}