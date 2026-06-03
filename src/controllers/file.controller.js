import { invalidateCloudfrontCache } from "../config/cdn.config.js";
import { File } from "../models/file.model.js";
import { validateKey } from "../utils/helper.utils.js";
import { deleteFromS3, getObjectSignedUrl, getObjectUrl, moveToTrash, removeTagS3ObjectAsDeleted, restoreFromTrashAndMoveToUpload, tagS3ObjectAsDeleted } from "../utils/s3.utils.js";



// const userId = "6a12b96ed296c385de6a2059";


export const getFileList = async(req, res) => {
    try{
        const user = req.user?.id;

        const files = await File.find({ uploadedBy: user, isDeleted: false })

        // group by folder
        const groupedFiles = files.reduce((acc, file) => {
            if(!acc[file.folder]){
                acc[file.folder] = [];
            }
            acc[file.folder].push(file);
            return acc;
        }, {});

        return res.status(200).json({
            success: true, 
            message: "Files fetched successfully", 
            meta: {
                total: files.length,
                folders: Object.fromEntries(
                    Object.entries(groupedFiles).map(([folder, files]) => [folder, files.length])
                )
            },
            folders: groupedFiles,
        });
    } catch(err){
        return res.status(500).json({success: false, message: "Internal Server Error", errror: err.message});
    }
}



export const getDeletedFileList = async(req, res) => {
    try{
        const user = req.user?.id;

        const files = await File.find({ uploadedBy: user, isDeleted: true })

        // group by folder
        const groupedFiles = files.reduce((acc, file) => {
            if(!acc[file.folder]){
                acc[file.folder] = [];
            }
            acc[file.folder].push(file);
            return acc;
        }, {});

        return res.status(200).json({
            success: true, 
            message: "Files fetched successfully", 
            meta: {
                total: files.length,
                folders: Object.fromEntries(
                    Object.entries(groupedFiles).map(([folder, files]) => [folder, files.length])
                )
            },
            folders: groupedFiles,
        });
    } catch(err){
        return res.status(500).json({success: false, message: "Internal Server Error", errror: err.message});
    }
}



export const getFileUrl = async(req, res) => {
    try{
        const { key } = req.query;
        if(!validateKey(key, res)) return;

        const result = await getObjectUrl(key);

        return res.status(200).json({success: true, message: "Get URL generated successfully", result});
    } catch(err){
        return res.status(500).json({success: false, message: "Internal Server Error", errror: err.message});
    }
}




export const getFilePresignedUrl = async(req, res) => {
    try{
        const { key } = req.query;
        if(!validateKey(key, res)) return;

        const result = await getObjectSignedUrl(key);

        return res.status(200).json({success: true, message: "Get Presigned URL generated successfully", result});
    } catch(err){
        return res.status(500).json({success: false, message: "Internal Server Error", errror: err.message});
    }
}




export const hardDeleteFile = async(req, res) => {
    try{
        const { key } = req.query;
        if(!validateKey(key, res)) return;

        const file = await File.findOne({ key });
        if (!file) return res.status(404).json({ success: false, message: "File not found" });

        // delete from S3 & Cloudfront(invalidate so deleted file stops being served)
        await deleteFromS3(key);
        await invalidateCloudfrontCache(key);

        // delete thumbnail if exists
        if (file.preview?.thumbnailKey) {
            await deleteFromS3(file.preview.thumbnailKey);
            await invalidateCloudfrontCache(file.preview.thumbnailKey);
        }
        
        // delete from DB
        await File.findOneAndDelete({ key });

        return res.status(200).json({success: true, message: "File deleted successfully"});
    }
    catch(err){
        console.log("error", err);
        return res.status(500).json({success: false, message: "Internal Server Error", errror: err.message});
    }
}


export const softDeleteFile = async(req, res) => {
    try{
        const { key } = req.query;
        const isMoveToTrash = req.query.isMoveToTrash === "true";

        const file = await File.findOne({ key, isDeleted: false });
        if(!file) return res.status(400).json({ success: false, message: "File not found" });

        if(!isMoveToTrash){
            // ─── Option A: tag in S3 ──────────────────────────
            await tagS3ObjectAsDeleted(key);

            if (file.preview?.thumbnailKey) {
                await tagS3ObjectAsDeleted(file.preview.thumbnailKey);
            }

        } else {
            // ─── Option B: move to trash ──────────────────────
            const { trashKey } = await moveToTrash(key);
            await deleteFromS3(key);
            file.key = trashKey;
            file.url = buildFileUrl(trashKey);
            
            if(file.preview?.thumbnailKey){
                const { trashKey:  thumbnailTrashKey } = await moveToTrash(file.preview.thumbnailKey);
                await deleteFromS3(file.preview.thumbnailKey);
                file.preview.thumbnailKey = thumbnailTrashKey;
                file.preview.thumbnailUrl = buildFileUrl(thumbnailTrashKey);
            }
        }

        file.isDeleted = true;
        file.deletedAt = new Date();

        await file.save();

        return res.status(200).json({ success: true, message: "File deleted successfully", file });
    } catch(err){
        return res.status(500).json({ success: false, message: "Internal Server Error", error: err.message });
    }
}



export const restoreDeleteFile = async(req, res) => {
    try{
        const { key } = req.query;

        const restore = await File.findOne({ key, isDeleted: true });
        if(!restore) return res.status(400).json({ success: false, message: "File not found" });

        // ─── check if older than 30 days ─────────────────────
        // S3 already deleted it via lifecycle, just clean up MongoDB
        const deletedAt = new Date(restore.deletedAt);
        const now  = new Date();
        const diffInDays = Math.floor((now - deletedAt) / (1000 * 60 * 60 * 24));

        if(diffInDays > 30){
            // Best-effort S3 cleanup in case lifecycle hasn't run yet
            await deleteFromS3(restore.key).catch(() => {});
            if(restore.preview?.thumbnailKey){
                await deleteFromS3(restore.preview.thumbnailKey).catch(() => {});
            }

            await File.deleteOne({ key });
            
            return res.status(400).json({ 
                success: false, 
                message: "File permanently deleted — older than 30 days" 
            });
        } 

        // If file is in trash -> move back to upload
        if(restore.folder === "trash"){
            const { key: restoredKey } = await restoreFromTrashAndMoveToUpload(restore.key);
            await deleteFromS3(restore.key);
            restore.key = restoredKey;
            restore.url = buildFileUrl(restoredKey);

            if(restore.preview?.thumbnailKey){
                const { key: thumbnailKey } = await restoreFromTrashAndMoveToUpload(restore.preview.thumbnailKey);
                await deleteFromS3(restore.preview.thumbnailKey);
                restore.preview.thumbnailKey = thumbnailKey;
                restore.preview.thumbnailUrl = buildFileUrl(thumbnailKey);
            }
        }
        else{
            // else aready in upload just remove the tagg (deleted)
            await removeTagS3ObjectAsDeleted(restore.key);

            if(restore.preview?.thumbnailKey){
                await removeTagS3ObjectAsDeleted(restore.preview?.thumbnailKey);
            }
        }


        restore.isDeleted = false;
        restore.deletedAt = null;
        await restore.save();


        return res.status(200).json({ success: true, message: "File restored successfully", restore });
    } catch(err){
        return res.status(500).json({ success: false, message: "Internal Server Error", error: err.message });
    }
}