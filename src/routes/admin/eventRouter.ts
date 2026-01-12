import express from "express";
import { createEvenetController, deleteEventController, updateEventController } from "../../controller/admin/adminEventController.js";
import { authMiddleware } from "../../middleware/authMiddleware.js";

const router = express.Router();

router.post('/create-event', authMiddleware, createEvenetController);
router.put('/update-event/:id', authMiddleware, updateEventController);
router.delete('/delete-event/:id', authMiddleware, deleteEventController);

export default router;