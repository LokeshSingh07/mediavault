import { s3} from "../config/s3.config.js";
import {
    PutObjectCommand,
    GetObjectCommand,
    DeleteObjectCommand,
    PutObjectTaggingCommand,
    CopyObjectCommand,
    CreateMultipartUploadCommand,
    UploadPartCommand,
    CompleteMultipartUploadCommand,
    AbortMultipartUploadCommand,
} from "@aws-sdk/client-s3";


import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import path from "node:path";
import crypto from "node:crypto";
import { generateBlurhash, generateThumbnail } from "./helper.utils.js";
import { generateVideoThumbnail } from "./video.utils.js";
import dotenv from "dotenv";
dotenv.config();


const requiredEnvVars = ["AWS_BUCKET_NAME", "AWS_REGION"];
for (const key of requiredEnvVars) {
    if (!process.env[key]) {
        throw new Error(`Missing environment variable: ${key}`);
    }
}


const BUCKET = process.env.AWS_BUCKET_NAME;
const REGION = process.env.AWS_REGION;
const CLOUDFRONT_DOMAIN = process.env.CLOUDFRONT_DOMAIN;

const SIGNED_URL_EXPIRES = 60 * 10; // 10 minutes
const MULTIPART_THRESHOLD = 5 * 1024 * 1024; 


// ==================================
// ─── Presigned Upload URL (client-side upload) ───────────────===========================
// Helper functions
// =============================================================
function generateFileName(originalName) {
    const extension = path.extname(originalName);
    const randomName = crypto.randomBytes(4).toString("hex");
    return `${randomName}${extension}`;
}

export function getFolderByMimeType(mimeType) {
    if (mimeType.startsWith("image/")) return "images";
    if (mimeType.startsWith("video/")) return "videos";
    if (mimeType.startsWith("audio/")) return "audios";
    if (mimeType === "application/pdf") return "pdfs";
    if (mimeType === "application/zip" || mimeType === "application/x-zip-compressed") return "zips";
    if (mimeType === "application/msword" || 
        mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") return "docs";
    if (mimeType === "application/vnd.ms-excel" || 
        mimeType === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet") return "excels";
    if (mimeType === "application/vnd.ms-powerpoint" || 
        mimeType === "application/vnd.openxmlformats-officedocument.presentationml.presentation") return "presentations";
    if (mimeType === "text/plain") return "texts";
    if (mimeType === "text/csv") return "csvs";
    return "others";
}

function buildKey(mimeType, originalName){
    const filename = generateFileName(originalName);
    let folder = getFolderByMimeType(mimeType);
    return`uploads/${folder}/${filename}`
}

// export function buildFileUrl(key) {
//     return `https://${BUCKET}.s3.${REGION}.amazonaws.com/${key}`;
// }


export function buildFileUrl(key) {
    return `https://${CLOUDFRONT_DOMAIN}/${key}`;
}




// Upload buffer to S3
export async function uploadBufferToS3(buffer, key, mimeType){
    const command = new PutObjectCommand({
        Bucket: BUCKET,
        Key: key,
        Body: buffer,
        ContentType: mimeType
    })
    
    await s3.send(command);
    return { key, url: buildFileUrl(key)};
}






// ─── Upload to S3 ───────────────
export async function uploadToS3(file){
    try{
        const key = buildKey(file.mimetype, file.originalname);
        
        // 1. upload original
        await uploadBufferToS3(file.buffer, key, file.mimetype);

        // 2. generate thumbnail only for images
        let preview = {};
        let metadata = {};

        if(file.mimetype.startsWith("image/")){
            const [{data, info}, blurhash ] = await Promise.all([
                generateThumbnail(file.buffer),
                generateBlurhash(file.buffer)
            ])
            console.log("info", info);
            console.log("data", data);
            

            // 3. If image -> upload thumbnail + get metadata
            const thumbnailKey = `${key}/thumbnail`;
            await uploadBufferToS3(data, thumbnailKey, "image/jpeg");
            
            console.log("blurhash", blurhash);
            
            preview = {
                blurhash,
                thumbnailKey, 
                thumbnailUrl: buildFileUrl(thumbnailKey), 
                thumbnailSize: info. size,
                generatedAt: new Date().toISOString()
            };
            
            metadata = {
                width: info.width,
                height: info.height,
                duration: null
            }
            
        }
        else if(file.mimetype.startsWith("video/")){
            console.log("Generating thumbnail...");
            const thumbnailBuffer = await generateVideoThumbnail(file.buffer);
            console.log("result generateVideoThumbnail => ", thumbnailBuffer);

            const [{data, info}, blurhash ] = await Promise.all([
                generateThumbnail(thumbnailBuffer),
                generateBlurhash(thumbnailBuffer)
            ])
            console.log("info", info);
            console.log("data", data);
            

            // 3. If image -> upload thumbnail + get metadata
            const thumbnailKey = `${key}/thumbnail`;
            await uploadBufferToS3(data, thumbnailKey, "image/jpeg");
            
            console.log("blurhash", blurhash);
            
            preview = {
                blurhash,
                thumbnailKey, 
                thumbnailUrl: buildFileUrl(thumbnailKey), 
                thumbnailSize: info. size,
                generatedAt: new Date().toISOString()
            };
            
            metadata = {
                width: info.width,
                height: info.height,
                duration: null
            }
        }
        
        return { key, url: buildFileUrl(key), preview, metadata };
    } catch(err){
        console.log("error", err);
        throw err;
    }
}









// ─── Get Object URL ───────────────
export function getObjectUrl(key){  
    return { key, url: buildFileUrl(key)}
}




// ─── Get Presigned Object URL ───────────────
export async function getObjectSignedUrl(key){
    const command = new GetObjectCommand({
        Bucket: BUCKET,
        Key: key
    })
    
    const signedUrl = await getSignedUrl(s3, command, {
        expiresIn: SIGNED_URL_EXPIRES
    });

    return { key, expiresIn: SIGNED_URL_EXPIRES, signedUrl }
}




// ─── Presigned Upload URL (client-side upload) ───────────────
export async function generateUploadSignedUrl(fileName, contentType){
    const key = buildKey(contentType, fileName);

    const command = new PutObjectCommand({
        Bucket: BUCKET,
        Key: key,
        ContentType: contentType,
    })


    const uploadUrl = await getSignedUrl(s3, command, { expiresIn: SIGNED_URL_EXPIRES } );

    return { 
        key,
        expiresIn: SIGNED_URL_EXPIRES,
        uploadUrl,
        url: buildFileUrl(key)
    }; 
};




// ─── Delete from S3 ───────────────
export async function deleteFromS3(key){
    const command = new DeleteObjectCommand({
        Bucket: BUCKET,
        Key: key
    })

    await s3.send(command);

    return { deleted:true, key };
}


// ─── Tag S3 object as deleted (auto delete tagged obj after 30 days) ───────────────
export async function tagS3ObjectAsDeleted(key){
    const command  = new PutObjectTaggingCommand({
        Bucket: BUCKET,
        Key: key,
        Tagging: {
            TagSet: [
                { Key: "deleted", Value: "true" },
                { Key: "deletedAt", Value: new Date().toISOString() }
            ]
        }    
    })

    await s3.send(command);

    return { tagged: true, key };
}
export async function removeTagS3ObjectAsDeleted(key){
    const command  = new PutObjectTaggingCommand({
        Bucket: BUCKET,
        Key: key,
        Tagging: {
            TagSet: []
        }    
    })

    await s3.send(command);

    return { tagged: true, key };
}


// ───  (auto delete trash obj after 30 days) ───────────────
export async function moveToTrash(key){
    const trashKey = key.replace("uploads/", "trash/");

    const command = new CopyObjectCommand({
        Bucket: BUCKET,
        Key: trashKey,
        CopySource: `${BUCKET}/${key}`
    })

    await s3.send(command);

    return { movedToTrash: true, trashKey };
}

export async function restoreFromTrashAndMoveToUpload(trashKey){
    const key = trashKey.replace("trash/", "uploads/");

    const command = new CopyObjectCommand({
        Bucket: BUCKET,
        Key: key,
        CopySource: `${BUCKET}/${trashKey}`
    })

    await s3.send(command);

    return { restoredKey: true, key };
}



// ─── Rename (copy + delete) ───────────────────────────────────
// No. Rename not needed. Filename is random (a3f9c1.png) — no original name stored in S3. Renaming random hash makes no sense.















// Advance concept


// ─── Multipart Upload ─────────────────────────────────────────

// TODO: Complete multipart upload -> Frontend via presigned URLs
// initiateMultipartUpload
// getMultipartPresignedUrl
// completeMultipartUpload
// abortMultipartUpload

// ── Step 1: initiate ──────────────────────────────────────────
export async function multipartUploadS3(fileName, contentType){
    const key = buildKey(contentType, fileName);

    const command = new CreateMultipartUploadCommand({
        Bucket: BUCKET,
        Key: key,
        ContentType: contentType
    })

    const { UploadId } = await s3.send(command);

    return { key, uploadId : UploadId };
}


// ── Step 2: get presigned url per chunk ───────────────────────
export async function getMultipartPresignedUrlS3(uploadId, partNumber, key){
    const command = new UploadPartCommand({
        Bucket: BUCKET,
        Key: key,
        UploadId: uploadId,
        PartNumber: Number(partNumber)
    })

    const url = await getSignedUrl(s3, command, { expiresIn: SIGNED_URL_EXPIRES });
    
    return { partNumber, url };
}



// ── Step 3: complete multipart upload ────────────────────────
export async function completeMultipartUploadS3(uploadId, key, parts,){
    const command = new CompleteMultipartUploadCommand({
        Bucket: BUCKET,
        Key: key,
        UploadId: uploadId,
        MultipartUpload: { Parts: parts }
    })

    await s3.send(command);

    return { completed: true, url: buildFileUrl(key) };
}


// ── Step 4: abort multipart upload ───────────────────────────
export async function abortMultipartUploadS3(uploadId, key){
    const command = new AbortMultipartUploadCommand({
        Bucket: BUCKET,
        Key: key,
        UploadId: uploadId
    })

    await s3.send(command);

    return { aborted: true };
}
