import { invalidateCloudfrontCache } from "../config/cdn.config.js";
import { File } from "../models/file.model.js";
import { ShareLink } from "../models/shareLink.model.js";
import { decrementStorage, validateKey } from "../utils/helper.utils.js";
import { buildFileUrl, deleteFromS3, getObjectSignedUrl, getObjectUrl, moveToTrash, removeTagS3ObjectAsDeleted, restoreFromTrashAndMoveToUpload, tagS3ObjectAsDeleted } from "../utils/s3.utils.js";
import crypto from "node:crypto";


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





// =============================================================
// GENERATE SHAREABLE LINK, ACCESS, REVOKE, TOGGLE FUNCTIONALITY
// =============================================================
export const generateShareableLink = async(req, res) => {
    try{
        const userId = req.user?.id;
        const { key, expiresIn, allowDownload=true } = req.query;   // expires in second
        if(!validateKey(key, res)) return;

        // find the file
        const file = await File.findOne({ key, uploadedBy: userId, isDeleted: false});
        if (!file) return res.status(404).json({ success: false, message: "File not found" });


        const seconds = Math.min(Math.max(Number(expiresIn) || 3600, 60), 30 * 24 * 3600);

        const token = crypto.randomBytes(24).toString("base64url");
        const link = await ShareLink.create({
            token,
            file: file._id,
            createdBy: userId,
            expiresAt: new Date(Date.now() + seconds * 1000),
            allowDownload,
        });

        return res.status(201).json({
            success: true,
            message: "Share link created",
            shareUrl: `${process.env.APP_URL}/file/s/${token}`,
            expiresAt: link.expiresAt,
        });

    } catch(err){
        return res.status(500).json({success: false, message: "Internal Server Error", errror: err.message});
    }
}


// helper: simple HTML message page
const renderMessagePage = (res, status, title, message) => {
    res.status(status);
    res.set({
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-store",
    });
    return res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="robots" content="noindex" />
  <title>${title}</title>
  <style>
    body { margin: 0; min-height: 100vh; display: flex; align-items: center; justify-content: center;
           font-family: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif; background: #f5f6f8; color: #1f2937; }
    .card { background: #fff; padding: 40px 32px; border-radius: 12px; max-width: 420px; width: 90%;
            text-align: center; box-shadow: 0 4px 24px rgba(0,0,0,.08); }
    .icon { font-size: 48px; margin-bottom: 12px; }
    h1 { font-size: 20px; margin: 0 0 8px; }
    p { margin: 0; color: #6b7280; font-size: 15px; line-height: 1.5; }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">🔒</div>
    <h1>${title}</h1>
    <p>${message}</p>
  </div>
</body>
</html>`);
};

export const accessShareLink = async (req, res) => {
    try {
        const link = await ShareLink.findOne({ token: req.params.token });

        // same message for every failure so tokens can't be probed
        const invalid = () =>
            renderMessagePage(
                res,
                410,
                "Link unavailable",
                "This link is invalid, has expired, or was revoked by the owner."
            );

        if (!link || link.revoked || link.expiresAt < new Date()) return invalid();

        const file = await File.findById(link.file);
        if (!file || file.isDeleted) return invalid();

        const download = req.query.download === "1" && link.allowDownload;
        const { signedUrl } = await getObjectSignedUrl(file.key, 60, {
            download,
            filename: file.originalname,
        });

        await ShareLink.updateOne({ _id: link._id }, { $inc: { accessCount: 1 } });

        res.set("Cache-Control", "no-store");
        return res.redirect(302, signedUrl);
    } catch (err) {
        console.error("accessShareLink error:", err);
        return renderMessagePage(
            res,
            500,
            "Something went wrong",
            "We couldn't open this link right now. Please try again in a moment."
        );
    }
};


export const revokeSharedLink = async (req, res) => {
    try {
        const token = req.params.token || req.query.token;
        const key = req.query.key || req.body?.key;

        let filter = { createdBy: req.user?.id };
        if (token) {
            filter.token = token;
        } else if (key) {
            const file = await File.findOne({ key, uploadedBy: req.user?.id });
            if (!file) return res.status(404).json({ success: false, message: "File not found" });
            filter.file = file._id;
        } else {
            return res.status(400).json({ success: false, message: "token or key is required" });
        }

        await ShareLink.updateMany(filter, { revoked: true });

        if (filter.file) {
            await File.updateOne({ _id: filter.file }, { isPublic: false });
        }

        return res.json({
            success: true,
            message: "Share link revoked"
        });
    } catch (err) {
        return res.status(500).json({ success: false, message: "Internal Server Error", error: err.message });
    }
};


export const toggleFileVisibility = async (req, res) => {
    try {
        const userId = req.user?.id;
        const { key } = req.query;
        if (!validateKey(key, res)) return;

        const file = await File.findOne({ key, uploadedBy: userId, isDeleted: false });
        if (!file) return res.status(404).json({ success: false, message: "File not found" });

        const now = new Date();
        const activeFilter = { file: file._id, revoked: false, expiresAt: { $gt: now } };
        const hasActiveLinks = await ShareLink.exists(activeFilter);

        // ── Currently shared → make private (revoke all active links) ──
        if (hasActiveLinks) {
            await ShareLink.updateMany(activeFilter, { revoked: true });

            file.isPublic = false;
            await file.save();

            return res.status(200).json({
                success: true,
                message: "File is now private. All share links revoked",
                isPublic: false,
            });
        }

        // ── Currently private → make shared (create a new link) ──
        const seconds = Math.min(
            Math.max(Number(req.query.expiresIn) || 3600, 60),
            30 * 24 * 3600
        ); // 1 min to 30 days, default 1 hour

        const token = crypto.randomBytes(24).toString("base64url");
        const link = await ShareLink.create({
            token,
            file: file._id,
            createdBy: userId,
            expiresAt: new Date(Date.now() + seconds * 1000),
        });

        file.isPublic = true;
        await file.save();

        return res.status(200).json({
            success: true,
            message: "File is now shared",
            isPublic: true,
            shareUrl: `${process.env.APP_URL}/file/s/${token}`,
            expiresAt: link.expiresAt,
        });
    } catch (err) {
        return res.status(500).json({ success: false, message: "Internal Server Error", error: err.message });
    }
};





// =============================================================
// HARD, SOFT, RESTORE DELETE FUNCTIONALITY
// =============================================================
export const hardDeleteFile = async(req, res) => {
    try{
        const userId = req.user?.id;
        const { key } = req.query;
        if(!validateKey(key, res)) return;

        const file = await File.findOne({ key, uploadedBy: userId });
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
        return res.status(500).json({success: false, message: "Internal Server Error", error: err.message});
    }
}


export const softDeleteFile = async(req, res) => {
    try{
        const userId = req.user?.id;
        const { key } = req.query;
        const isMoveToTrash = req.query.isInTrash === "true";
        console.log("key : ", key);

        const file = await File.findOne({ key, uploadedBy: userId, isDeleted: false });
        if(!file) return res.status(400).json({ success: false, message: "File not found" });

        if(!isMoveToTrash){
            // ─── Option A: tag in S3 ──────────────────────────
            await tagS3ObjectAsDeleted(key);

            if (file.preview?.thumbnailKey) {
                await tagS3ObjectAsDeleted(file.preview?.thumbnailKey);
            }

        } else {
            // ─── Option B: move to trash ──────────────────────
            console.log("debug 1");
            const { trashKey } = await moveToTrash(key);
            console.log("debug 2 ");
            await deleteFromS3(key);
            file.key = trashKey;
            file.url = buildFileUrl(trashKey);
            
            console.log("debug 3");
            if(file.preview?.thumbnailKey){
                const { trashKey:  thumbnailTrashKey } = await moveToTrash(file.preview.thumbnailKey);
                await deleteFromS3(file.preview?.thumbnailKey);
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


// =============================================================
// BULK TRASH OPERATIONS: EMPTY TRASH & RESTORE ALL TRASH
// =============================================================

export const emptyTrash = async (req, res) => {
    try {
        const userId = req.user?.id;
        const deletedFiles = await File.find({ uploadedBy: userId, isDeleted: true });

        if (!deletedFiles.length) {
            return res.status(200).json({ success: true, message: "Trash is already empty", totalDeleted: 0 });
        }

        let totalDeleted = 0;

        for (const file of deletedFiles) {
            // Delete main file from S3 & CloudFront
            await deleteFromS3(file.key).catch(() => {});
            await invalidateCloudfrontCache(file.key).catch(() => {});

            // Delete thumbnail if present
            if (file.preview?.thumbnailKey) {
                await deleteFromS3(file.preview.thumbnailKey).catch(() => {});
                await invalidateCloudfrontCache(file.preview.thumbnailKey).catch(() => {});
            }

            // Decrement storage
            await decrementStorage(file.uploadedBy, file.size).catch(() => {});
            totalDeleted++;
        }

        // Delete records from DB
        await File.deleteMany({ uploadedBy: userId, isDeleted: true });

        return res.status(200).json({
            success: true,
            message: "Trash emptied successfully",
            totalDeleted,
        });
    } catch (err) {
        console.error("Error emptying trash:", err);
        return res.status(500).json({ success: false, message: "Internal Server Error", error: err.message });
    }
};


export const restoreAllTrash = async (req, res) => {
    try {
        const userId = req.user?.id;
        const deletedFiles = await File.find({ uploadedBy: userId, isDeleted: true });

        if (!deletedFiles.length) {
            return res.status(200).json({ success: true, message: "No files to restore", totalRestored: 0 });
        }

        let totalRestored = 0;

        for (const file of deletedFiles) {
            if (file.key.startsWith("trash/")) {
                const { key: restoredKey } = await restoreFromTrashAndMoveToUpload(file.key).catch(() => ({ key: file.key }));
                if (restoredKey && restoredKey !== file.key) {
                    await deleteFromS3(file.key).catch(() => {});
                    file.key = restoredKey;
                    file.url = buildFileUrl(restoredKey);
                }

                if (file.preview?.thumbnailKey) {
                    const { key: thumbnailKey } = await restoreFromTrashAndMoveToUpload(file.preview.thumbnailKey).catch(() => ({ key: file.preview.thumbnailKey }));
                    if (thumbnailKey && thumbnailKey !== file.preview.thumbnailKey) {
                        await deleteFromS3(file.preview.thumbnailKey).catch(() => {});
                        file.preview.thumbnailKey = thumbnailKey;
                        file.preview.thumbnailUrl = buildFileUrl(thumbnailKey);
                    }
                }
            } else {
                await removeTagS3ObjectAsDeleted(file.key).catch(() => {});
                if (file.preview?.thumbnailKey) {
                    await removeTagS3ObjectAsDeleted(file.preview?.thumbnailKey).catch(() => {});
                }
            }

            file.isDeleted = false;
            file.deletedAt = null;
            await file.save();
            totalRestored++;
        }

        return res.status(200).json({
            success: true,
            message: "All files restored from trash",
            totalRestored,
        });
    } catch (err) {
        console.error("Error restoring trash:", err);
        return res.status(500).json({ success: false, message: "Internal Server Error", error: err.message });
    }
};



