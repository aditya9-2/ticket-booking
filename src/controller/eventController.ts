import type { Request, Response } from "express";
import { getAllEvents, getEventById } from "../services/eventServices.js";
import { EventCategory } from "../types/category.js";

export const seeAllEvenetsController = async (req: Request, res: Response) => {

    try {

        const categoryParam = req.query.category as string | undefined;
        let category: EventCategory | undefined;

        if (categoryParam) {
            if (!Object.values(EventCategory).includes(categoryParam as EventCategory)) {
                return res.status(400).json({
                    message: `Invalid category. Must be one of: ${Object.values(EventCategory).join(", ")}`
                });
            }
            category = categoryParam as EventCategory;
        }

        const events = await getAllEvents(category);

        if (events.length === 0) {
            return res.status(200).json({
                message: "No events found",
                events: []
            });
        }

        return res.status(200).json({
            count: events.length,
            events
        });

    } catch (err) {

        return res.status(500).json({
            message: "Internal server Error",
            error: err instanceof Error ? err.message : undefined
        });
    }
};

export const getEventController = async (req: Request, res: Response) => {

    try {

        const eventId = req.params.id;

        if (!eventId) {
            return res.status(400).json({
                message: "Evenet id is required"
            });
        }

        const event = await getEventById(eventId);

        if (!event) {
            return res.status(404).json({
                message: "Event not found"
            });
        }

        return res.status(200).json({
            event
        });

    } catch (err) {

        return res.status(500).json({
            message: "Internal server Error",
            error: err instanceof Error ? err.message : undefined
        });
    }

}