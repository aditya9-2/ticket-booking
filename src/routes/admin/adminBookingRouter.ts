import express from "express";
import { authMiddleware } from "../../middleware/authMiddleware.js";
import { getBookingsForAdminController } from "../../controller/admin/adminBookingController.js";

const router = express.Router();

router.get('/all-bookings', authMiddleware, getBookingsForAdminController);

export default router;