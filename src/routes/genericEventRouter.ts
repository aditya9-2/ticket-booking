import express from "express";
import { getEventController, seeAllEvenetsController } from "../controller/eventController.js";

const router = express.Router();

router.get('/all', seeAllEvenetsController);
router.get('/:id', getEventController);
export default router;