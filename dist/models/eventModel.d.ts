import mongoose, { Document } from "mongoose";
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
export declare const eventModel: mongoose.Model<IEvent, {}, {}, {}, mongoose.Document<unknown, {}, IEvent, {}, mongoose.DefaultSchemaOptions> & IEvent & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
} & {
    id: string;
}, any, IEvent>;
export declare const deletedEventModel: mongoose.Model<{
    originalEventId: mongoose.Types.ObjectId;
    originalData: any;
    deletedAt: NativeDate;
    deletedBy?: mongoose.Types.ObjectId | null;
}, {}, {}, {
    id: string;
}, mongoose.Document<unknown, {}, {
    originalEventId: mongoose.Types.ObjectId;
    originalData: any;
    deletedAt: NativeDate;
    deletedBy?: mongoose.Types.ObjectId | null;
}, {
    id: string;
}, mongoose.DefaultSchemaOptions> & Omit<{
    originalEventId: mongoose.Types.ObjectId;
    originalData: any;
    deletedAt: NativeDate;
    deletedBy?: mongoose.Types.ObjectId | null;
} & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}, "id"> & {
    id: string;
}, mongoose.Schema<any, mongoose.Model<any, any, any, any, any, any, any>, {}, {}, {}, {}, mongoose.DefaultSchemaOptions, {
    originalEventId: mongoose.Types.ObjectId;
    originalData: any;
    deletedAt: NativeDate;
    deletedBy?: mongoose.Types.ObjectId | null;
}, mongoose.Document<unknown, {}, {
    originalEventId: mongoose.Types.ObjectId;
    originalData: any;
    deletedAt: NativeDate;
    deletedBy?: mongoose.Types.ObjectId | null;
}, {
    id: string;
}, mongoose.ResolveSchemaOptions<mongoose.DefaultSchemaOptions>> & Omit<{
    originalEventId: mongoose.Types.ObjectId;
    originalData: any;
    deletedAt: NativeDate;
    deletedBy?: mongoose.Types.ObjectId | null;
} & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}, "id"> & {
    id: string;
}, {
    [path: string]: mongoose.SchemaDefinitionProperty<undefined, any, any>;
} | {
    [x: string]: mongoose.SchemaDefinitionProperty<any, any, mongoose.Document<unknown, {}, {
        originalEventId: mongoose.Types.ObjectId;
        originalData: any;
        deletedAt: NativeDate;
        deletedBy?: mongoose.Types.ObjectId | null;
    }, {
        id: string;
    }, mongoose.ResolveSchemaOptions<mongoose.DefaultSchemaOptions>> & Omit<{
        originalEventId: mongoose.Types.ObjectId;
        originalData: any;
        deletedAt: NativeDate;
        deletedBy?: mongoose.Types.ObjectId | null;
    } & {
        _id: mongoose.Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
}, {
    originalEventId: mongoose.Types.ObjectId;
    originalData: any;
    deletedAt: NativeDate;
    deletedBy?: mongoose.Types.ObjectId | null;
} & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}>, {
    originalEventId: mongoose.Types.ObjectId;
    originalData: any;
    deletedAt: NativeDate;
    deletedBy?: mongoose.Types.ObjectId | null;
} & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}>;
export {};
//# sourceMappingURL=eventModel.d.ts.map