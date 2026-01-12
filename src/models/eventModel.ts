import mongoose, { Schema, Document } from "mongoose";

interface ISection {
    name: string;
    price: number;
    capacity: number;
    _id?: string;
}

export interface IEvent extends Document {
    name: string;
    sections: ISection[];
    createdBy: mongoose.Types.ObjectId; 
    isDeleted: boolean;
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
    },
    isDeleted: {
        type: Boolean,
        default: false 
    }
}, { timestamps: true });

const deletedEventSchema = new Schema({
    originalEventId: { 
        type: Schema.Types.ObjectId, 
        required: true 
    },
    deletedBy: { 
        type: Schema.Types.ObjectId, 
        ref: "User" 
    },
    originalData: { 
        type: Object, 
        required: true 
    },
    deletedAt: { 
        type: Date, 
        default: Date.now 
    }
});

export const eventModel = mongoose.model<IEvent>("Event", eventSchema);
export const deletedEventModel = mongoose.model("DeletedEvent", deletedEventSchema);