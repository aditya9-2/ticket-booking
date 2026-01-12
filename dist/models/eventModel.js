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
export const eventModel = mongoose.model("Event", eventSchema);
export const deletedEventModel = mongoose.model("DeletedEvent", deletedEventSchema);
//# sourceMappingURL=eventModel.js.map