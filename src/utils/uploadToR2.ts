import { PutObjectCommand } from "@aws-sdk/client-s3";
import { r2 } from "./r2.js";
import crypto from "crypto";

export const uploadToR2 = async (file: Express.Multer.File) => {
    console.log("Attempting upload to bucket:", process.env.R2_BUCKET);
    
    const ext = file.originalname.split(".").pop();
    const key = `events/${crypto.randomUUID()}.${ext}`;

    try {
        await r2.send(new PutObjectCommand({
            Bucket: process.env.R2_BUCKET!,
            Key: key,
            Body: file.buffer,
            ContentType: file.mimetype
        }));
        return `${process.env.R2_PUBLIC_URL}/${key}`;
    } catch (err) {
        console.error("R2 Upload Error Detail:", err);
        throw err;
    }
}