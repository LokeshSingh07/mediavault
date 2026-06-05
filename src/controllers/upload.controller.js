import { abortMultipartUploadS3, buildFileUrl, completeMultipartUploadS3, generateUploadSignedUrl, getFolderByMimeType, getMultipartPresignedUrlS3, multipartUploadS3, uploadToS3 } from "../utils/s3.utils.js";
import { File } from "../models/file.model.js";
import { incrementStorage } from "../utils/helper.utils.js";


// const userId = "6a12b96ed296c385de6a2059";


export const uploadFile = async(req, res) => {
    try{
        const userId = req.user?.id;

        if(!req.files?.length){
            return res.status(400).json({success: false, message: "File not found"});
        }

        // upload to S3
        const result = await Promise.all(req.files.map(async (file) => {
            const { key, url, preview, metadata} = await uploadToS3(file);
            const folder = getFolderByMimeType(file.mimetype);

            // save to DB
            const fileObj = {
                originalname: file.originalname,
                mimetype: file.mimetype,
                key,
                url,
                size: file.size,
                folder,
                uploadType: "direct",
                uploadedBy: userId,

                // ─── Preview / Thumbnail ──────────────────────────────────
                preview: {
                    blurhash: preview?.blurhash,
                    thumbnailKey: preview?.thumbnailKey,
                    thumbnailUrl: preview?.thumbnailUrl,
                    thumbnailSize: preview?.thumbnailSize,
                    generatedAt: preview?.generatedAt,
                },

                // Media Metadata
                metadata: {
                    width: metadata?.width,
                    height: metadata?.height,
                    duration: metadata?.duration
                }
            }

            console.log("fileObj => ", fileObj);
            return File.create(fileObj);
        }));

        // after successfull upload to s3 -> update the storage
        await incrementStorage(userId, req.incomingSize);

        return res.status(200).json({
            success: true, 
            message: "File uploaded successfully", 
            total: result.length,
            files: result
        });
    }
    catch(err){
        return res.status(500).json({success: false, message: "Internal Server Error", errror: err.message});
    }
}


// TODO: save to DB after upload to s3 using put + presigned-upload url
export const uploadFileUsingPresignedUrl = async(req, res) => {
    try{
        const { fileName, contentType } = req.body;

        if(!fileName || !contentType){
            return res.status(400).json({success: false, message: "File name or content type not found"});
        }

        const result = await generateUploadSignedUrl(fileName, contentType);
        
        return res.status(200).json({success: true, message: "Presigned URL generated successfully", result});
    } catch(err){
        console.log("error", err);
        return res.status(500).json({success: false, message: "Internal Server Error", errror: err.message});
    }
}

export const confirmUploadFileUsingPresignedUrl = async(req, res) => {
    try{
        const userId = req.user?.id;
        const { key, originalname, mimetype, size, contentType } = req.body;

        if(!key || !originalname || !mimetype || !size || !contentType){
            return res.status(400).json({success: false, message: "Allf ields are required"});
        }



        const file = {
            originalname,
            mimetype,
            key,
            url: buildFileUrl(key),
            size,
            folder: getFolderByMimeType(mimetype),
            uploadType: "presigned",
            uploadedBy: userId,
            metadata: {},
            preview: {},
        }

        await File.create(file);

        await incrementStorage(userId, size);

        return res.status(200).json({success: true, message: "Presigned URL generated successfully", file});
    } catch(err){
        console.log("error", err);
        return res.status(500).json({success: false, message: "Internal Server Error", errror: err.message});
    }
}





export const initiateMultipartUpload = async (req, res) => {
    try {
        const { fileName, contentType } = req.body;

        if(!fileName || !contentType){
            return res.status(400).json({success: false, message: "File name or content type not found"});
        }

        const { key, uploadId } = await multipartUploadS3(fileName, contentType);
        
        return res.status(200).json({
            success: true,
            message: "File upload initiated successfully", 
            data: { key, uploadId }
        });
    } catch (err) {
        return res.status(500).json({ success: false, message: "Internal Server Error", error: err.message });
    }
}

export const getMultipartPresignedUrl = async (req, res) => {
    try {
        const { uploadId, partNumber, key } = req.query;

        if(!uploadId || !partNumber || !key){
            return res.status(400).json({success: false, message: "All fields are required"});
        }

        const { url } = await getMultipartPresignedUrlS3(uploadId, partNumber, key);
        
        return res.status(200).json({
            success: true,
            message: `File part ${partNumber} uploaded successfully`, 
            data: { key, url }
        });
    } catch (err) {
        return res.status(500).json({ success: false, message: "Internal Server Error", error: err.message });
    }
}

export const completeMultipartUpload = async (req, res) => {
    try {
        const userId = req.user?.id;
        const { uploadId, key, parts, originalname, mimetype, size } = req.body;

        if(!uploadId || !key || !Array.isArray(parts) || !parts.length || !originalname || !mimetype || !size){
            return res.status(400).json({success: false, message: "All fields are required"});
        }

        // complete upload
        const { url } = await completeMultipartUploadS3(uploadId, key, parts);

        // save to DB
        const fileObj = {
            originalname,
            mimetype,
            key,
            size,
            folder: getFolderByMimeType(mimetype), 
            url: buildFileUrl(key),
            uploadType: "multipart",
            uploadedBy: userId,
            preview: {},
            metadata: {}
        }
        await File.create(fileObj);

        await incrementStorage(userId, size);

        
        return res.status(200).json({
            success: true,
            message: "File uploaded successfully", 
            data: { key, url }
        });
    } catch (err) {
        return res.status(500).json({ success: false, message: "Internal Server Error", error: err.message });
    }
}



export const abortMultipartUpload = async (req, res) => {
    try {
        const { uploadId, key } = req.body;

        if(!uploadId || !key){
            return res.status(400).json({success: false, message: "All fields are required"});
        }

        await abortMultipartUploadS3(uploadId, key);

        return res.status(200).json({ success: true, message: "Multipart upload aborted" });
    } catch(err){
        return res.status(200).json({ success: true, message: "Multipart upload aborted" });
    }
}




export const getStorageInfo = async(req, res) => {
    try{
        const userId = req.user?.id;
        
        const user = await User.findById(userId).select("storageUsed storageLimit");

        const result = {
            storageUsed: user.storageUsed,
            storageLimit: user.storageLimit,
        }

        return res.status(200).json({success: true, message: "Storage info fetched successfully", result});
    }
    catch(err){
        return res.status(500).json({success: false, message: "Internal Server Error", errror: err.message});
    }
}