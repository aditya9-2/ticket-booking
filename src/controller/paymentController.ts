import type { Request, Response } from "express";
import { createOrderService, verifyAndBookService } from "../services/paymentServices.js";

export const createOrderController = async (req: Request, res: Response) => {
    try {
        const { eventId, sectionId, quantity } = req.body;
        if (!eventId || !sectionId || !quantity) {
            return res.status(400).json({ message: "eventId, sectionId and quantity are required" });
        }

        const order = await createOrderService(req.id, eventId, sectionId, Number(quantity));
        return res.status(200).json(order);
    } catch (err) {
        return res.status(400).json({
            message: err instanceof Error ? err.message : "Could not create order",
        });
    }
};

export const verifyPaymentController = async (req: Request, res: Response) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature, eventId, sectionId, quantity } = req.body;

        if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !eventId || !sectionId || !quantity) {
            return res.status(400).json({ message: "Missing required fields" });
        }

        const result = await verifyAndBookService({
            userId: req.id,
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature,
            eventId,
            sectionId,
            quantity: Number(quantity),
        });

        return res.status(result.status).json(result.body);
    } catch (err) {
        return res.status(500).json({
            message: "Payment verification error",
            error: err instanceof Error ? err.message : undefined,
        });
    }
};