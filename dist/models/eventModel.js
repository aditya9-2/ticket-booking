import mongoose, { Schema, Document } from "mongoose";
const eventSchema = new Schema({
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
export const eventModel = mongoose.model("Event", eventSchema);
//# sourceMappingURL=eventModel.js.map