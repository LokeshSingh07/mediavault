import cron from "node-cron"
import { deleteFromS3 } from "./s3.utils.js";
import { decrementStorage } from "./helper.utils.js";
import { invalidateCloudfrontCache } from "../config/cdn.config.js";
import { File } from "../models/file.model.js";


// delete file from DB every day
export const startTrashCleanupCron = () => {
    // runs every day at midnight
    cron.schedule("0 0 * * *", async() => {
        console.log("[CRON] Running trash cleanup...");
        try{
            const expiredFiles = await File.find({
                isDeleted: true,
                deletedAt: { $lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)}
            });

            console.log(`[CRON] Found ${expiredFiles.length} expired files`);

            for(const file of expiredFiles){
                try{
                    // delete from db  + invalidate cloudfront + s3  + thumbnail 

                    // delete from s3 explicitly although it automatically delete from s3 
                    await deleteFromS3(file.key);
                    await invalidateCloudfrontCache(file.key);

                    if(file.preview?.thumbnailKey){
                        await deleteFromS3(file.preview.thumbnailKey);
                        await invalidateCloudfrontCache(file.preview.thumbnailKey);
                    }

                    await File.findByIdAndDelete(file._id);

                    // decrement storage
                    await decrementStorage(file.uploadedBy, file.size);

                    console.log(`[CRON] Deleted ${file.key}`);

                }
                catch(err){
                    // do not stop -> next file
                    console.error(`[CRON] Failed for ${file.key}:`, err.message);
                }
            }

            console.log("[CRON] Trash cleanup complete");
        } catch (err) {
            console.error("[CRON] Trash cleanup failed:", err.message);
        }
    })
}