import dotenv from "dotenv";
dotenv.config();

import express from "express";

import cors from "cors";

import authRouter from "./routes/authRouter.js";
import eventRouter from "./routes/admin/eventRouter.js";
import genericEventRouter from "./routes/genericEventRouter.js";
import bookingRouter from "./routes/bookingRouter.js";
import adminBookingRouter from "./routes/admin/adminBookingRouter.js";
import aiRouter from "./routes/aiRoutes.js";
import paymentRouter from "./routes/paymentRouter.js";
import { connectDB } from "./config/db.js";

dotenv.config();

const port = process.env.PORT || 3000;

const app = express();


app.use(express.json());
// app.use(cors());


app.get('/v1/health', (_req, res) => {
    res.status(200).json({ status: "ok" });
});

const allowedOrigins = (process.env.CORS_ORIGIN || "").split(",").map((o) => o.trim());

app.use(
    cors({
        origin: (origin, callback) => {
            if (!origin) {
                return callback(null, true);
            }
            // Allow configured cross-origin requests.
            if (allowedOrigins.includes(origin)) {
                return callback(null, true);
            }
            return callback(new Error("Not allowed by CORS"));
        },
        credentials: true,
    })
);



app.use('/v1/auth', authRouter);

// Admin Router for create event
app.use('/v1/admin', eventRouter);
//  -----------
app.use('/v1/event', genericEventRouter);
app.use('/v1/bookings', bookingRouter);

// Admin Router for see all the bookings
app.use('/v1/admin', adminBookingRouter)
//  -----------------

// AI
app.use('/v1/ai', aiRouter);

// razorpay
app.use('/v1/payments', paymentRouter);


app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    if (err.message === "Not allowed by CORS") {
        return res.status(403).json({ message: "Origin not allowed" });
    }
    console.error(err);
    return res.status(500).json({ message: "Internal server error" });
});

const startServer = async () => {

    try {

        await connectDB();

        app.listen(port, () => {
            console.log(`Listening on port ${port}`);
        });

    } catch (err) {
        console.error("Server failed to start:", err);
        process.exit(1);
    }
};

startServer();
