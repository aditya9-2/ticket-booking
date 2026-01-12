import userModel from "../models/userModel.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
export const signupController = async (req, res) => {
    try {
        const { name, email, password, roleId } = req.body;
        if (!name || !email || !password) {
            return res.status(400).json({
                message: "All fields are required"
            });
        }
        const checkUser = await userModel.findOne({ email });
        if (checkUser) {
            return res.status(411).json({
                message: "user already exists"
            });
        }
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        await userModel.create({
            name,
            email,
            password: hashedPassword,
            roleId
        });
        return res.status(201).json({
            message: "user created successfully"
        });
    }
    catch (err) {
        return res.status(500).json({
            message: "Internal server Error",
            error: err instanceof Error ? err.message : undefined
        });
    }
};
export const signinController = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({
                message: "All fields are required"
            });
        }
        const checkUser = await userModel.findOne({ email });
        if (!checkUser) {
            return res.status(411).json({
                message: "user not found, signup first!"
            });
        }
        const checkPassword = await bcrypt.compare(password, checkUser.password);
        if (!checkPassword) {
            return res.status(401).json({
                message: "unauthorized! enter correct password"
            });
        }
        const token = jwt.sign({
            id: checkUser?._id,
            roleId: checkUser?.roleId
        }, process.env.JWT_TOKEN);
        return res.status(200).json({
            message: "login success",
            token
        });
    }
    catch (err) {
        return res.status(500).json({
            message: "Internal server Error",
            error: err instanceof Error ? err.message : undefined
        });
    }
};
//# sourceMappingURL=authController.js.map