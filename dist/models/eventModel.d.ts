import mongoose, { Document } from "mongoose";
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
export declare const eventModel: mongoose.Model<IEvent, {}, {}, {}, mongoose.Document<unknown, {}, IEvent, {}, mongoose.DefaultSchemaOptions> & IEvent & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
} & {
    id: string;
}, any, IEvent>;
export {};
//# sourceMappingURL=eventModel.d.ts.map