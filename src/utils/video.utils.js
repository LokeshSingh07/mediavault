import path from "node:path";
import fs from "node:fs/promises";
import os from "node:os";
import crypto from "node:crypto";
import { exec } from "node:child_process"
import { promisify } from "node:util"


const execAsync = promisify(exec)


// generate generateVideoThumbnail using ffmpeg
export async function generateVideoThumbnail(videoBuffer){
    try{
        // const tempDir = os.tmpdir();
        const tempVideoDirectory = path.join(process.cwd() , "/temp/videos");
        const tempThumbnailDirectory = path.join(process.cwd() , "/temp/thumbnails");

        await fs.mkdir(tempVideoDirectory, { recursive: true });
        await fs.mkdir(tempThumbnailDirectory, { recursive: true });

        // console.log("tempDir", tempDir);
        const hex = crypto.randomBytes(4).toString("hex");

        const videoPath = path.join(tempVideoDirectory, `video-${hex}.mp4`);
        const thumbnailPath = path.join(tempThumbnailDirectory, `thumbnail-${hex}.jpg`);
        
        // console.log("videoPath", videoPath);
        // console.log("thumbnailPath", thumbnailPath);
        // console.log("isBuffer : ", Buffer.isBuffer(videoBuffer));
        // console.log("size : ", videoBuffer.byteLength);


        await fs.writeFile(videoPath, videoBuffer);

        // const stats = await fs.stat(videoPath);
        // console.log("File exists:", stats.size);

        // take a thumbnail screenshot
        await execAsync(`ffmpeg -i "${videoPath}" -ss 00:00:01 -frames:v 1 "${thumbnailPath}" -y`);

        // read the thumbnail
        const thumbnailBuffer = await fs.readFile(thumbnailPath);
        
        // clean up
        await Promise.all([
            await fs.unlink(videoPath),
            await fs.unlink(thumbnailPath),
        ])

        return thumbnailBuffer;
    }
    catch(err){
        console.error("Error generating video thumbnail:", err);
        throw err;
    }
}




// export async function generateVideoThumbnail(videoBuffer) {
//     const tempDir = os.tmpdir();

//     const videoPath = path.join(tempDir, `video-${Date.now()}.mp4`);
//     const thumbnailPath = path.join(tempDir, `thumb-${Date.now()}.jpg`);

//     await fs.writeFile(videoPath, videoBuffer);

//     await execAsync(
//         `ffmpeg -i "${videoPath}" -ss 00:00:01 -frames:v 1 "${thumbnailPath}" -y`
//     );

//     const thumbnailBuffer = await fs.readFile(thumbnailPath);

//     await fs.unlink(videoPath);
//     await fs.unlink(thumbnailPath);

//     return thumbnailBuffer;
// }






















// Testing code
// console.log("os.tmpdir() => ", os.tmpdir());
// await fs.mkdir("./tmp", { recursive: true });

// unlink -> delete file
// rm -> delete folder
