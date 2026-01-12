import mongoose, { Schema, Document } from "mongoose";

interface ISection {
  _id: mongoose.Types.ObjectId;
  name: string;
  price: number;
  capacity: number;
  remaining: number;
}

export interface IEvent extends Document {
  name: string;
  sections: ISection[];
  createdBy: mongoose.Types.ObjectId;
  isDeleted: boolean;
}

const sectionSchema = new Schema<ISection>(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    price: {
      type: Number,
      required: true,
      min: 0
    },
    capacity: {
      type: Number,
      required: true,
      min: 1
    },
    remaining: {
      type: Number,
      required: true,
      min: 0
    }
  },
  { _id: true }
);

const eventSchema = new Schema<IEvent>(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    sections: {
      type: [sectionSchema],
      required: true
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    isDeleted: {
      type: Boolean,
      default: false
    }
  },
  { timestamps: true }
);


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


eventSchema.index({ "sections._id": 1 });

export const eventModel = mongoose.model<IEvent>("Event", eventSchema);
export const deletedEventModel = mongoose.model("DeletedEvent", deletedEventSchema);