import type { Request, Response } from "express";
import { RoleId } from "../../types/roleId.js";
import { deletedEventModel, eventModel } from "../../models/eventModel.js";
import { uploadToR2 } from "../../utils/uploadToR2.js";

export const createEvenetController = async (req: Request, res: Response) => {

    try {

        if (req.roleId !== RoleId.Admin) {
            return res.status(403).json({
                message: "Forbidden! Only Admins can create events."
            });
        }

        const { name, date } = req.body;
        let { sections } = req.body;

        if (typeof sections === "string") {
            sections = JSON.parse(sections)
        }

        if (!name || !sections || sections.length === 0) {
            return res.status(400).json({
                message: "All fields are required"
            });
        }

        let posterUrl = "";
        if (req.file) {
            // Upload directly to root
            posterUrl = await uploadToR2(req.file);
        }

        const newEvent = await eventModel.create({
            name,
            date,
            posterUrl,
            sections,
            createdBy: req.id
        });

        return res.status(201).json({
            message: "Event created successfully",
            event: newEvent
        });

    } catch (err) {
        return res.status(500).json({
            message: "Internal server Error",
            error: err instanceof Error ? err.message : undefined
        });
    }
};

export const updateEventController = async (req: Request, res: Response) => {
    try {

        if (req.roleId !== RoleId.Admin) {
            return res.status(403).json({ message: "Forbidden" });
        }

        const eventId = req.params.id;
        const {sectionId, ...updateData} = req.body;

        // 1. Filter out fields we don't want them to update manually
        // e.g., don't let them update 'createdBy' or '_id'
        delete updateData._id;
        delete updateData.createdBy;
        delete updateData.createdAt;

        if (req.file) {
            const posterUrl = await uploadToR2(req.file);
            updateData.posterUrl = posterUrl;
        }

        const updatedEvent = await eventModel.findByIdAndUpdate(
            eventId,
            { $set: updateData },
            { new: true, runValidators: true }
        ).select("-isDeleted -__v -createdBy");

        if (!updatedEvent) {
            return res.status(404).json({ message: "Event not found" });
        }

        return res.status(200).json({
            message: "Event updated successfully",
            event: updatedEvent
        });

    } catch (err) {
        return res.status(500).json({
            message: "Internal Server Error",
            error: err instanceof Error ? err.message : undefined
        });
    }
};

export const deleteEventController = async (req: Request, res: Response) => {
    try {

        if (req.roleId !== RoleId.Admin) {
            return res.status(403).json({
                message: "Forbidden"
            });
        }

        const eventId = req.params.id;

        const event = await eventModel.findById(eventId);

        if (!event) {
            return res.status(404).json({
                message: "Event not found"
            });
        }

        if (event.isDeleted) {
            return res.status(400).json({
                message: "Event is already deleted"
            });
        }

        await deletedEventModel.create({
            originalEventId: event._id,
            deletedBy: req.id,
            originalData: event.toObject()
        });

        event.isDeleted = true;
        await event.save();

        return res.status(200).json({
            message: "Event deleted and archived successfully"
        });

    } catch (err) {
        return res.status(500).json({
            message: "Internal Server Error",
            error: err instanceof Error ? err.message : undefined
        });
    }
};
