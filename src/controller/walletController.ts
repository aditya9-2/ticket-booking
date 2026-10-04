import type { Request, Response } from "express";
import { getOrCreateWallet, createRechargeOrderService, verifyAndCreditWalletService } from "../services/walletServices.js";

export const getWalletController = async (req: Request, res: Response) => {
    try {
        const wallet = await getOrCreateWallet(req.id);
        return res.status(200).json({ balance: wallet.balance });
    } catch (err) {
        return res.status(500).json({ message: "Could not fetch wallet", error: err instanceof Error ? err.message : undefined });
    }
};

export const createRechargeOrderController = async (req: Request, res: Response) => {
    try {
        const { amount } = req.body;
        if (!amount) return res.status(400).json({ message: "amount is required" });

        const order = await createRechargeOrderService(req.id, Number(amount));
        return res.status(200).json(order);
    } catch (err) {
        return res.status(400).json({ message: err instanceof Error ? err.message : "Could not create order" });
    }
};

export const verifyRechargeController = async (req: Request, res: Response) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature, amount } = req.body;
        if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !amount) {
            return res.status(400).json({ message: "Missing required fields" });
        }

        const result = await verifyAndCreditWalletService({
            userId: req.id,
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature,
            amount: Number(amount),
        });

        return res.status(200).json(result);
    } catch (err) {
        return res.status(400).json({ message: err instanceof Error ? err.message : "Verification failed" });
    }
};