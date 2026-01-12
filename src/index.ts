import dotenv from "dotenv";
dotenv.config();

import express from "express";

import cors from "cors";
import authRouter  from "./routes/authRouter.js";
import eventRouter from "./routes/eventRouter.js";
import { connectDB } from "./config/db.js";

dotenv.config();

const port = process.env.PORT || 3000;

const app = express();


app.use(express.json());
app.use(cors());


app.use('/v1/auth', authRouter);

// Admin Router for create event
app.use('/v1/admin', eventRouter);


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
