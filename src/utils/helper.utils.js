import sharp from "sharp";
import { encode } from "blurhash";
import { User } from "../models/user.model.js";

export function validateKey(key, res) {
    if (!key) {
        res.status(400).json({ success: false, message: "Key is required" });
        return false;
    }
    if (!key.startsWith("uploads/")) {
        res.status(400).json({ success: false, message: "Invalid key" });
        return false;
    }
    return true;
}



// generate the thumbnail buffer + metadata using sharp
export async function generateThumbnail(buffer){
    // buffer means binaey data ->  req.file.buffer
    const { data, info } = await sharp(buffer)
        // .resize({ width: 128, height: 128 })
        // .jpeg({ quality: 80 })
        .withMetadata(false) 
        .toFormat("jpeg", { quality: 65 })
        .toBuffer({ resolveWithObject: true });


    return { data, info };
}
    

// generate blurhash
export async function generateBlurhash(buffer) {
    try{
       const { data, info } = await sharp(buffer)
            .resize(32, 32, { fit: "inside" })
            .ensureAlpha()
            .raw()
            .toBuffer({ resolveWithObject: true });


        const hash = encode(
            new Uint8ClampedArray(data),
            info.width,
            info.height,
            4,
            4
        );

        return hash;
    }
    catch(err){
        console.error("Error generating BlurHash:", err);
        throw err;
    }
}



export async function incrementStorage(userId, sizeInBytes){
    const size = Number(sizeInBytes)
    const user = await User.findByIdAndUpdate(
        userId, 
        { $inc: { storageUsed: size } },
        {new: true}
    )
    return user;
}


export async function decrementStorage(userId, sizeInBytes){
    const size = Number(sizeInBytes)
    const user = await User.findByIdAndUpdate(
        userId, 
        { $inc: { storageUsed: -Math.abs(size) } },
        {new: true}
    )
    return user;
}