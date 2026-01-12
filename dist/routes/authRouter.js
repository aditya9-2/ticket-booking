import express from "express";
import { signinController, signupController } from "../controller/authController.js";
const router = express.Router();
router.post('/signup', signupController);
router.post('/signin', signinController);
export default router;
//# sourceMappingURL=authRouter.js.map