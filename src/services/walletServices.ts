import mongoose from "mongoose";
import crypto from "crypto";
import { walletModel, walletTransactionModel } from "../models/walletModel.js";
import { razorpay } from "../config/razorpay.js";

export const getOrCreateWallet = async (userId: string) => {
    let wallet = await walletModel.findOne({ userId });
    if (!wallet) {
        wallet = await walletModel.create({ userId, balance: 0 });
    }
    return wallet;
};

export const createRechargeOrderService = async (userId: string, amountInRupees: number) => {
    if (!Number.isFinite(amountInRupees) || amountInRupees < 10) {
        throw new Error("Minimum recharge amount is ₹10");
    }
    if (amountInRupees > 50000) {
        throw new Error("Maximum recharge amount is ₹50,000");
    }

    const amountInPaise = Math.round(amountInRupees * 100);
    const order = await razorpay.orders.create({
        amount: amountInPaise,
        currency: "INR",
        receipt: `wallet_${Date.now()}`,
    });

    return { orderId: order.id, amount: amountInPaise, currency: "INR", keyId: process.env.RAZORPAY_ID_KEY };
};

export const verifyAndCreditWalletService = async (params: {
    userId: string;
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
    amount: number;
}) => {
    const { userId, razorpay_order_id, razorpay_payment_id, razorpay_signature, amount } = params;

    const expectedSignature = crypto
        .createHmac("sha256", process.env.RAZORPAY_SECRET_KEY!)
        .update(`${razorpay_order_id}|${razorpay_payment_id}`)
        .digest("hex");

    if (expectedSignature !== razorpay_signature) {
        throw new Error("Payment verification failed");
    }

    // Idempotency
    const existing = await walletTransactionModel.findOne({ razorpayOrderId: razorpay_order_id });
    if (existing) {
        const wallet = await getOrCreateWallet(userId);
        return { message: "Already processed", balance: wallet.balance };
    }

    const session = await mongoose.startSession();
    try {
        let newBalance = 0;
        await session.withTransaction(async () => {
            const wallet = await walletModel.findOneAndUpdate(
                { userId },
                { $inc: { balance: amount } },
                { new: true, upsert: true, session }
            );
            newBalance = wallet.balance;

            await walletTransactionModel.create(
                [
                    {
                        userId,
                        type: "credit",
                        amount,
                        reason: "recharge",
                        razorpayOrderId: razorpay_order_id,
                        razorpayPaymentId: razorpay_payment_id,
                    },
                ],
                { session }
            );
        });
        return { message: "Wallet recharged successfully", balance: newBalance };
    } finally {
        await session.endSession();
    }
};

export class InsufficientBalanceError extends Error {
    constructor(public balance: number, public required: number) {
        super(`Insufficient wallet balance. You have ₹${balance}, need ₹${required}.`);
    }
}

export const debitWalletService = async (userId: string, amount: number, reason: "ai_booking", bookingId?: string) => {
    const session = await mongoose.startSession();
    try {
        let result: { balance: number } | null = null;
        await session.withTransaction(async () => {
            const wallet = await walletModel.findOneAndUpdate(
                { userId, balance: { $gte: amount } },
                { $inc: { balance: -amount } },
                { new: true, session }
            );

            if (!wallet) {
                const current = await walletModel.findOne({ userId }, null, { session });
                throw new InsufficientBalanceError(current?.balance ?? 0, amount);
            }

            await walletTransactionModel.create(
                [{ userId, type: "debit", amount, reason, ...(bookingId ? { bookingId } : {}) }],
                { session }
            );

            result = { balance: wallet.balance };
        });
        return result!;
    } finally {
        await session.endSession();
    }
};

export const creditWalletService = async (userId: string, amount: number, reason: "refund", bookingId?: string) => {
    const wallet = await walletModel.findOneAndUpdate(
        { userId },
        { $inc: { balance: amount } },
        { new: true, upsert: true }
    );
    await walletTransactionModel.create({
        userId,
        type: "credit",
        amount,
        reason,
        ...(bookingId ? { bookingId } : {}),
    });
    return wallet;
};