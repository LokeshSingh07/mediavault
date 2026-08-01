import ffmpeg from "fluent-ffmpeg";
import fs from "fs/promises";
import os from "os";
import path from "path";

// ffmpeg.setFfmpegPath(ffmpegPath);
// ffmpeg.setFfprobePath(ffprobeStatic.path);

ffmpeg.setFfmpegPath("/usr/local/bin/ffmpeg");
ffmpeg.setFfprobePath("/usr/local/bin/ffprobe");


// main
export async function processVideo(videoBuffer) {
    const tempDir = os.tmpdir();

    const id = Date.now();

    const videoPath = path.join(tempDir, `video-${id}.mp4`);
    const thumbnailPath = path.join(tempDir, `thumb-${id}.jpg`);

    // Save S3 buffer to temp file
    await fs.writeFile(videoPath, videoBuffer);

    // Read metadata
    const metadata = await getVideoMetadata(videoPath);

    // Generate thumbnail
    await generateVideoThumbnail(videoPath, thumbnailPath);

    // Read thumbnail
    const thumbnailBuffer = await fs.readFile(thumbnailPath);

    // Cleanup
    await fs.unlink(videoPath).catch(() => {});
    await fs.unlink(thumbnailPath).catch(() => {});

    return {
        metadata,
        thumbnailBuffer,
    };
}

function getVideoMetadata(videoPath) {
    return new Promise((resolve, reject) => {
        ffmpeg.ffprobe(videoPath, (err, metadata) => {
            if (err) return reject(err);

            const stream = metadata.streams.find(
                (s) => s.codec_type === "video"
            );

            resolve({
                width: stream?.width ?? null,
                height: stream?.height ?? null,
                duration: Number(metadata.format.duration ?? 0),
                bitrate: Number(metadata.format.bit_rate ?? 0),
                codec: stream?.codec_name ?? null,
            });
        });
    });
}

function generateVideoThumbnail(videoPath, thumbnailPath) {
    return new Promise((resolve, reject) => {
        ffmpeg(videoPath)
            .on("end", resolve)
            .on("error", reject)
            .screenshots({
                timestamps: ["10%"],
                filename: path.basename(thumbnailPath),
                folder: path.dirname(thumbnailPath),
                size: "500x?",
            });
    });
}