import mongoose from "mongoose";
import { BookingStatus } from "../types/bookingStatus.js";

const Schema = mongoose.Schema;

export interface IBooking extends Document {
    userId: mongoose.Types.ObjectId;
    eventId: mongoose.Types.ObjectId;
    sectionId: mongoose.Types.ObjectId;
    quantity: number;
    priceAtBooking: number;
    status: BookingStatus;
    createdAt: Date;
} 

const bookingSchema = new Schema<IBooking>({
    userId:{
        type: mongoose.Types.ObjectId,
        ref: "User",
        required: true
    },
    eventId: {
        type: mongoose.Types.ObjectId,
        ref: "Event",
        required: true
    }, 
    sectionId :{
        type: mongoose.Types.ObjectId,
        required: true
    },
    quantity: {
        type: Number,
        required: true,
        min: 1
    },
    priceAtBooking: {
        type: Number,
        required: true
    },
    status: {
        type: String,
        enum: Object.values(BookingStatus),
        default: BookingStatus.Booked
    }
},{
    timestamps: true
});

export const bookingModel = mongoose.model<IBooking>("Booking", bookingSchema);

