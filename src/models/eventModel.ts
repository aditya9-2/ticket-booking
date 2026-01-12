import mongoose, { Schema, Document } from "mongoose";

interface ISection {
    name: string;
    price: number;
    capacity: number;
}

export interface IEvent extends Document {
    name: string;
    sections: ISection[];
    createdBy: mongoose.Types.ObjectId; 
}

const eventSchema = new Schema<IEvent>({
    name: {
        type: String,
        required: true,
        trim: true
    },
    sections: [{
        name: { type: String, required: true },
        price: { type: Number, required: true },
        capacity: { type: Number, required: true }
    }],
    createdBy: {
        type: Schema.Types.ObjectId,
        ref: "User" 
    }
}, { timestamps: true });

export const eventModel = mongoose.model<IEvent>("Event", eventSchema);