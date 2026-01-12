import express from "express";
import { createBookingController } from "../controller/bookingController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post('/create-booking',authMiddleware, createBookingController);

export default router;