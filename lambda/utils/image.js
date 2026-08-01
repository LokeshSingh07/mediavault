import sharp from "sharp";
import { encode } from "blurhash";


export async function getMetadata(buffer) {
    const metadata = await sharp(buffer).metadata();

    return {
        width: metadata.width,
        height: metadata.height,
        format: metadata.format,
    };
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