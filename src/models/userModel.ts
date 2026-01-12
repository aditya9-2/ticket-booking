import mongoose  from "mongoose";
import { RoleId } from "../types/roleId.js";

const Schema = mongoose.Schema;


const userSchema = new Schema ({
    name :{
        type : String,
        required: true,
        minLength: 2
    }, 
    email : {
        type: String,
        required: true,
        unique:true,
        minLenght: 3
    },
    password: {
        type: String,
        required: true,
        trim: true,
        minLenght: 6
    },
    roleId: {
        type: Number,
        required: true,
        enum: [RoleId.Admin, RoleId.Normal], 
        default: RoleId.Normal

    }
});

export default mongoose.model("User", userSchema);