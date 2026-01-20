import express from "express";
import { createBookingController, getYourBookingController } from "../controller/bookingController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post('/create-booking',authMiddleware, createBookingController);
router.get('/your-booking', authMiddleware, getYourBookingController);

export default router;