import { invalidateCloudfrontCache } from "../config/cdn.config.js";
import { File } from "../models/file.model.js";
import { decrementStorage, validateKey } from "../utils/helper.utils.js";
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

export const getFile = async(req, res) => {
    try{
        const userId = req.user?.id;
        const { q:search } = req.query;

        if(!search){
            return res.status(400).json({success: false, message: "File name not found"});
        }

        const files = await File.find({ 
            uploadedBy: userId, 
            isDeleted: false, 
            originalName: { $regex: search, $options: "i" }
        }).limit(10).lean();

        return res.status(200).json({
            success: true, 
            message: "File fetched successfully", 
            total: files.length,
            files
        });
    }
    catch(err){
        return res.status(500).json({success: false, message: "Internal Server Error", errror: err.message});
    }
}


export const getFavouriteFileList = async(req, res) => {
    try{
        const user = req.user?.id;

        const files = await File.find({ uploadedBy: user, isDeleted: false, isFavorite: true });

        if(!files.length){
            return res.status(200).json({
                success: true, 
                message: "Files fetched successfully", 
                meta: {
                    total: 0,
                },
                files: [],
            });
        }

        return res.status(200).json({
            success: true, 
            message: "Files fetched successfully", 
            meta: {
                total: files.length,
            },
            files,
        });
    } catch(err){
        return res.status(500).json({success: false, message: "Internal Server Error", errror: err.message});
    }
}

export const toggleFavouriteFile = async(req, res) => {
    try{
        const user = req.user?.id;
        const { key } = req.query;
        if(!validateKey(key, res)) return;

        // find the file
        const file = await File.findOne({ key, uploadedBy: user, isDeleted: false });

        if(!file){
            return res.status(404).json({success: false, message: "File not found"});
        }

        file.isFavorite = !file.isFavorite;
        await file.save();

        return res.status(200).json({success: true, message: "File favourited successfully", isFavorite: file.isFavorite});

    } catch(err){
        return res.status(500).json({success: false, message: "Internal Server Error", errror: err.message});
    }
}



// export const getFileUrl = async(req, res) => {
//     try{
//         const { key } = req.query;
//         if(!validateKey(key, res)) return;

//         // find the file
//         const file = await File.findOne({ key, uploadedBy: userId});
//         if (!file) return res.status(404).json({ success: false, message: "File not found" });

//         const result = await getObjectUrl(key);

//         return res.status(200).json({success: true, message: "Get URL generated successfully", result});
//     } catch(err){
//         return res.status(500).json({success: false, message: "Internal Server Error", errror: err.message});
//     }
// }




// getFilePresignedUrl -> Share link
// export const getShareableLink = async(req, res) => {
//     try{
//         const userId = req.user?.id;
//         const { key } = req.query;   // expires in second
//         if(!validateKey(key, res)) return;

//         // find the file
//         const file = await File.findOne({ key, uploadedBy: userId});
//         if (!file) return res.status(404).json({ success: false, message: "File not found" });

//         return res.status(200).json({
//             success: true,
//             message: "Shareable link generated",
//             sharedLink: file.sharedLink,
//             expiresAt: file.sharedLinkExpiry,
//         });
//     } catch(err){
//         return res.status(500).json({success: false, message: "Internal Server Error", errror: err.message});
//     }
// }

export const generateShareableLink = async(req, res) => {
    try{
        const userId = req.user?.id;
        const { key, expiresIn } = req.query;   // expires in second
        if(!validateKey(key, res)) return;

        // find the file
        const file = await File.findOne({ key, uploadedBy: userId});
        if (!file) return res.status(404).json({ success: false, message: "File not found" });

        const expiry = Number(expiresIn) || 60 * 60;
        const { signedUrl } = await getObjectSignedUrl(key, expiry);
        const expiresAt = new Date(Date.now() + expiry * 1000);

        // update in db
        file.isPublic = true;
        file.sharedLinkExpiry = expiresAt;
        file.sharedLink = signedUrl;
        await file.save();

        return res.status(200).json({
            success: true,
            message: "Shareable link generated",
            sharedLink: signedUrl,
            expiresAt: sharedLinkExpiry,
        });
    } catch(err){
        return res.status(500).json({success: false, message: "Internal Server Error", errror: err.message});
    }
}



export const revokeSharedLink = async(req, res) => {
    try{
        const userId = req.user?.id;
        const { key } = req.query;
        if(!validateKey(key, res)) return;

        // find the file
        const file = await File.findOne({ key, uploadedBy: userId});
        if (!file) return res.status(404).json({ success: false, message: "File not found" });

        // update in db
        file.isPublic = false;
        file.sharedLinkExpiry = null;
        file.sharedLink = null;
        await file.save();

        return res.status(200).json({ success: true, message: "Shared link revoked" });
    } catch(err){
        return res.status(500).json({success: false, message: "Internal Server Error", errror: err.message});
    }
}


export const toggleFileVisibility = async(req, res) => {
    try{
        const userId = req.user?.id;
        const { key } = req.query;
        if(!validateKey(key, res)) return;  

        // find the file
        const file = await File.findOne({ key, uploadedBy: userId});
        if (!file) return res.status(404).json({ success: false, message: "File not found" });

        // update in db
        file.isPublic = !file.isPublic;

        if(!file.isPublic){
            file.sharedLinkExpiry = null;
            file.sharedLink = null;
        }

        await file.save();

        return res.status(200).json({ success: true, message: "File visibility toggled" });
    }
    catch(err){
        return res.status(500).json({success: false, message: "Internal Server Error", errror: err.message});
    }
}



export const hardDeleteFile = async(req, res) => {
    try{
        const userId = req.user?.id;
        const { key } = req.query;
        if(!validateKey(key, res)) return;

        const file = await File.findOne({ key, uploadedBy: userId, isDeleted: false});
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
        await decrementStorage(file.uploadedBy, file.size);

        return res.status(200).json({success: true, message: "File deleted successfully"});
    }
    catch(err){
        console.log("error", err);
        return res.status(500).json({success: false, message: "Internal Server Error", errror: err.message});
    }
}


export const softDeleteFile = async(req, res) => {
    try{
        const userId = req.user?.id;
        const { key } = req.query;
        const isMoveToTrash = req.query.isInTrash === "true";

        const file = await File.findOne({ key, uploadedBy: userId, isDeleted: false });
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
        const userId = req.user?.id;
        const { key } = req.query;

        const restore = await File.findOne({ key, uploadedBy: userId, isDeleted: true });
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
        if(restore.key.startsWith("trash/")){
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



