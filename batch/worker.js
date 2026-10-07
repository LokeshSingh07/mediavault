import { connectDB } from "./utils/db.js";
import { File } from "./models/file.model.js";
import { downloadFromS3, uploadToS3, buildFileUrl } from "./utils/s3.js";
import { generateThumbnail, generateBlurhash } from "./utils/image.js";
import { processVideo } from "./utils/video.js";
import { buildThumbnailKey } from "./utils/helper.js";

async function main() {
    console.log("=== Batch Video Processing Job Started ===");

    const fileId = process.env.FILE_ID || process.env.AI_RESULT_ID;
    const fileKey = process.env.FILE_KEY || process.env.KEY;

    console.log("FILE_ID / AI_RESULT_ID:", fileId);
    console.log("FILE_KEY:", fileKey);

    if (!fileId && !fileKey) {
        console.error("❌ Missing FILE_ID / AI_RESULT_ID or FILE_KEY environment variables.");
        process.exit(1);
    }

    let file = null;

    try {
        // 1. Connect to MongoDB
        await connectDB();

        // 2. Fetch File record from DB
        if (fileId) {
            file = await File.findById(fileId);
        }
        if (!file && fileKey) {
            file = await File.findOne({ key: fileKey });
        }

        if (!file) {
            console.error(`❌ File record not found for fileId=${fileId}, key=${fileKey}`);
            process.exit(1);
        }

        console.log(`✅ File found: id=${file._id}, key=${file.key}, mimetype=${file.mimetype}`);


        // 3. Security check: skip if thumbnail or already processed
        if (file.key.startsWith("thumbnails/") || file.key.includes("_thumb")) {
            console.log("⚠️ File is already a thumbnail. Skipping processing.");
            process.exit(0);
        }

        if (file.preview && file.preview?.thumbnailKey && file.preview?.blurhash) {
            console.log("⚠️ Preview already exists for this file. Skipping processing.");
            process.exit(0);
        }


        // 4. Update status to 'processing'
        file.status = "processing";
        await file.save();
        

        // 5. Download original video file from S3
        console.log(`📥 Downloading video from S3: ${file.key}`);
        const videoBuffer = await downloadFromS3(file.key);
        console.log(`✅ Download complete (${videoBuffer.length} bytes)`);

        // 6. Process Video (Metadata extraction & thumbnail frame capture)
        console.log("🎬 Extracting metadata and video frame via FFmpeg...");
        const { metadata, thumbnailBuffer } = await processVideo(videoBuffer);
        console.log("✅ Metadata extracted:", metadata);

        // 7. Generate Thumbnail & BlurHash from extracted frame
        console.log("🖼️ Generating optimized JPEG thumbnail and BlurHash...");
        const [{ data, info }, blurhash] = await Promise.all([
            generateThumbnail(thumbnailBuffer),
            generateBlurhash(thumbnailBuffer)
        ]);
        console.log(`✅ Thumbnail generated (size: ${info.size} bytes), blurhash: ${blurhash}`);

        // 8. Upload thumbnail to S3
        const thumbnailKey = buildThumbnailKey(file.key);
        console.log(`📤 Uploading thumbnail to S3: ${thumbnailKey}`);
        await uploadToS3(data, thumbnailKey, "image/jpeg");
        console.log("✅ Thumbnail uploaded to S3 successfully");

        // 9. Update DB with Preview, Metadata, and set status to 'completed'
        file.preview = {
            blurhash,
            thumbnailKey,
            thumbnailUrl: buildFileUrl(thumbnailKey),
            thumbnailSize: info.size,
            generatedAt: new Date().toISOString()
        };

        file.metadata = metadata;
        file.status = "completed";
        await file.save();

        console.log("🎉 Batch video processing completed successfully!");
        process.exit(0);

    } catch (err) {
        console.error("❌ Error in Batch video processing worker:", err);

        if (file) {
            try {
                file.status = "failed";
                await file.save();
                console.log("Updated file status to 'failed' in DB.");
            } catch (dbErr) {
                console.error("Failed to update file status to 'failed':", dbErr);
            }
        }

        process.exit(1);
    }
}

main();