import express from "express";
import { createEvenetController } from "../controller/admin/createEvenetController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post('/create-event', authMiddleware, createEvenetController)
export default router;