import mongoose from "mongoose";

export const connectDB = async () => {

    try {

        await mongoose.connect(process.env.MONGO_URI!);
        console.log(`DB connected`);
        
    } catch (err) {
        throw new Error(`DB connection failed: ${err instanceof Error ? err.message : undefined}`);
    }

}