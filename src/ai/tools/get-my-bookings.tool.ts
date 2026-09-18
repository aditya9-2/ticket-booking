import { getYourBookingsService } from "../../services/bookingServices.js";

export const getMyBookings = async (_args: {}, ctx: { userId: string }) => {
    return getYourBookingsService(ctx.userId);
};