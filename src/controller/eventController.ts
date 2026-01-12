import type { Request, Response } from "express";
import { eventModel } from "../models/eventModel.js";

export const seeAllEvenetsController = async (req: Request, res: Response) => {
    
    try {

        const events = await eventModel.find().select("-__v -createdBy"); // hides createdBy

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
        
        if(!eventId) {
            return res.status(400).json({
                message: "Evenet id is required"
            });
        }

        const event  = await eventModel.findById(eventId).select("-__v -createdBy");

        if(!event) {
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