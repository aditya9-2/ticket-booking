import { randomUUID } from "crypto";
import { createBookingService } from "../../services/bookingServices.js";

export interface CreateBookingInput {
    eventId: string;
    sectionId: string;
    quantity: number;
}

export const createBookingTool = async (
    input: CreateBookingInput,
    ctx: { userId: string }
) => {
    const idempotencyKey = randomUUID();

    const result = await createBookingService({
        userId: ctx.userId,
        eventId: input.eventId,
        sectionId: input.sectionId,
        quantity: input.quantity,
        idempotencyKey,
    });

    return result.body;
};