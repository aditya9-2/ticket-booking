import crypto from "crypto";
import { razorpay } from "../config/razorpay.js";
import { paymentModel } from "../models/paymentModel.js";
import { eventModel } from "../models/eventModel.js";
import { createBookingService } from "./bookingServices.js";

export const createOrderService = async (userId: string, eventId: string, sectionId: string, quantity: number) => {
    const event = await eventModel.findOne({ _id: eventId, isDeleted: false });
    if (!event) throw new Error("Event not found");

    const section = event.sections.find((s) => s._id?.toString() === sectionId);
    if (!section) throw new Error("Section not found");
    if (section.remaining < quantity) throw new Error("Not enough seats available");

    const amount = section.price * quantity * 100;

    const order = await razorpay.orders.create({
        amount,
        currency: "INR",
        receipt: `rcpt_${Date.now()}`,
    });

    await paymentModel.create({
        userId,
        razorpayOrderId: order.id,
        amount: amount / 100,
        status: "created",
    });

    return { orderId: order.id, amount, currency: "INR", keyId: process.env.RAZORPAY_ID_KEY };
};

export const verifyAndBookService = async (params: {
    userId: string;
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
    eventId: string;
    sectionId: string;
    quantity: number;
}) => {
    const { userId, razorpay_order_id, razorpay_payment_id, razorpay_signature, eventId, sectionId, quantity } = params;

    const expectedSignature = crypto
        .createHmac("sha256", process.env.RAZORPAY_SECRET_KEY!)
        .update(`${razorpay_order_id}|${razorpay_payment_id}`)
        .digest("hex");

    if (expectedSignature !== razorpay_signature) {
        await paymentModel.findOneAndUpdate({ razorpayOrderId: razorpay_order_id }, { status: "failed" });
        return { status: 400, body: { message: "Payment verification failed" } };
    }

    
    const bookingResult = await createBookingService({
        userId,
        eventId,
        sectionId,
        quantity,
        idempotencyKey: razorpay_order_id,
    });

    if (bookingResult.status === 201 || bookingResult.status === 200) {
        await paymentModel.findOneAndUpdate(
            { razorpayOrderId: razorpay_order_id },
            {
                status: "paid",
                razorpayPaymentId: razorpay_payment_id,
                razorpaySignature: razorpay_signature,
                bookingId: bookingResult.body.booking?._id,
            }
        );
    } else {
        // Booking failed (e.g. sold out between order creation and payment) —
        // mark payment failed. TODO: trigger a Razorpay refund here before going live.
        await paymentModel.findOneAndUpdate({ razorpayOrderId: razorpay_order_id }, { status: "failed" });
    }

    return bookingResult;
};