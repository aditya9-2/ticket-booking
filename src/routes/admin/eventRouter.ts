import express from "express";
import { createEvenetController, deleteEventController, updateEventController } from "../../controller/admin/adminEventController.js";
import { authMiddleware } from "../../middleware/authMiddleware.js";
import { upload } from "../../middleware/uploadMiddleware.js";

const router = express.Router();

router.post('/create-event', authMiddleware, upload.single("posters"), createEvenetController);
router.put('/update-event/:id', authMiddleware, upload.single("posters"),updateEventController);
router.delete('/delete-event/:id', authMiddleware, deleteEventController);

export default router;