import { checkSectionAvailability } from "../../services/eventServices.js";

export interface CheckAvailabilityInput {
    eventId: string;
    sectionId: string;
    quantity: number;
}

export const checkAvailability = async (input: CheckAvailabilityInput) => {
    return checkSectionAvailability(input.eventId, input.sectionId, input.quantity);
};