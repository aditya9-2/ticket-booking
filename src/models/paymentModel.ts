import mongoose, { Schema } from "mongoose";

export interface IPayment extends Document {
    userId: mongoose.Types.ObjectId;
    bookingId: mongoose.Types.ObjectId;
    razorpayOrderId: string;
    razorpayPaymentId: string;
    razorpaySignature: string;
    amount: number;
    currency: string;
    status: "created" | "paid" | "failed";
    createdAt: Date;
}

const paymentSchema = new Schema<IPayment>(
    {
        userId: { 
            type: Schema.Types.ObjectId, 
            ref: "User", 
            required: true 
        },
        bookingId: { 
            type: Schema.Types.ObjectId, 
            ref: "Booking" 
        },
        razorpayOrderId: { 
            type: String, 
            required: true 
        },
        razorpayPaymentId: { 
            type: String 
        },
        razorpaySignature: { 
            type: String 
        },
        amount: { 
            type: Number, 
            required: true 
        },
        currency: { 
            type: String, 
            default: "INR" 
        },
        status: { 
            type: String, 
            enum: ["created", "paid", "failed"], 
            default: "created" 
        },

    },
    { 
        timestamps: true 
    }
);

export const paymentModel = mongoose.model<IPayment>("Payment", paymentSchema);