import { randomUUID } from "crypto";
import { createBookingService, type CreateBookingInput } from "../../services/bookingServices.js";
import { debitWalletService, creditWalletService, InsufficientBalanceError } from "../../services/walletServices.js";
import { checkSectionAvailability } from "../../services/eventServices.js";

export const createBookingTool = async (input: CreateBookingInput, ctx: { userId: string }) => {
    const { eventId, sectionId, quantity } = input;

    const availability = await checkSectionAvailability(eventId, sectionId, quantity);
    if (!availability.available || availability.price === undefined) {
        return { error: availability.reason ?? "Not enough seats available" };
    }

    const totalAmount = availability.price * quantity;

    let debitResult;
    try {
        debitResult = await debitWalletService(ctx.userId, totalAmount, "ai_booking");
    } catch (err) {
        if (err instanceof InsufficientBalanceError) {
            return {
                error: "insufficient_balance",
                message: err.message,
                balance: err.balance,
                required: err.required,
                hint: "Ask the user to recharge their wallet before booking.",
            };
        }
        throw err;
    }

    const idempotencyKey = randomUUID();
    const result = await createBookingService({
        userId: ctx.userId,
        eventId,
        sectionId,
        quantity,
        idempotencyKey,
    });

    if (result.status !== 201 && result.status !== 200) {
        await creditWalletService(ctx.userId, totalAmount, "refund");
        return { error: result.body.message ?? "Booking failed, wallet refunded" };
    }

    return { ...result.body, walletBalanceAfter: debitResult.balance };
};