import mongoose, { Schema } from "mongoose";

export interface IWallet extends Document {
    userId: mongoose.Types.ObjectId;
    balance: number;
    updatedAt: Date;
}

const walletSchema = new Schema<IWallet>(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
            unique: true
        },
        balance: {
            type: Number,
            required: true,
            default: 0,
            min: 0
        },
    },
    {
        timestamps: true
    }
);

export const walletModel = mongoose.model<IWallet>("Wallet", walletSchema);

export interface IWalletTransaction extends Document {
    userId: mongoose.Types.ObjectId;
    type: "credit" | "debit";
    amount: number;
    reason: "recharge" | "ai_booking" | "refund";
    razorpayOrderId?: string;
    razorpayPaymentId?: string;
    bookingId?: mongoose.Types.ObjectId;
    createdAt: Date;
}

const walletTransactionSchema = new Schema<IWalletTransaction>(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        type: {
            type: String,
            enum: ["credit", "debit"],
            required: true
        },
        amount: {
            type: Number,
            required: true
        },
        reason: {
            type: String,
            enum: ["recharge", "ai_booking", "refund"],
            required: true
        },
        razorpayOrderId: {
            type: String
        },
        razorpayPaymentId: {
            type: String
        },
        bookingId: {
            type: Schema.Types.ObjectId,
            ref: "Booking"
        },
    },
    { timestamps: true }
);

export const walletTransactionModel = mongoose.model<IWalletTransaction>(
    "WalletTransaction",
    walletTransactionSchema
);