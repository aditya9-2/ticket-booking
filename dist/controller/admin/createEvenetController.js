import { RoleId } from "../../types/roleId.js";
import { eventModel } from "../../models/eventModel.js";
export const createEvenetController = async (req, res) => {
    try {
        if (req.roleId !== RoleId.Admin) {
            return res.status(403).json({
                message: "Forbidden! Only Admins can create events."
            });
        }
        const { name, sections } = req.body;
        if (!name || !sections || sections.length === 0) {
            return res.status(400).json({
                message: "All fields are required"
            });
        }
        const newEvent = await eventModel.create({
            name,
            sections,
            createdBy: req.id
        });
        return res.status(201).json({
            message: "Event created successfully",
            event: newEvent
        });
    }
    catch (err) {
        return res.status(500).json({
            message: "Internal server Error",
            error: err instanceof Error ? err.message : undefined
        });
    }
};
//# sourceMappingURL=createEvenetController.js.map