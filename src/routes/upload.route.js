
import { Router } from "express";
const uploadRouter = Router();



// import controllers
import {
    abortMultipartUpload,
    completeMultipartUpload,
    confirmUploadFileUsingPresignedUrl,
    getMultipartPresignedUrl,
    getStorageInfo,
    initiateMultipartUpload,
    uploadFile, 
    uploadFileUsingPresignedUrl
} from "../controllers/upload.controller.js";
import  upload, { checkFileSize }  from "../middlewares/multer.middleware.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { checkStorageLimit } from "../middlewares/storageLimit.middleware.js";
import { presignedLimiter, uploadLimiter } from "../middlewares/rateLimiter.middleware.js";








// ======================== API ROUTES ======================== 



// upload File (multer)
// uploadRouter.post("/server-side-upload", upload.single("file"), uploadFile)
uploadRouter.post("/server-side-upload", uploadLimiter, authMiddleware, upload.array("files", 20), checkFileSize, checkStorageLimit, uploadFile)

// upload File (generate presigned url)
uploadRouter.post("/upload-presigned-url", presignedLimiter, authMiddleware, uploadFileUsingPresignedUrl)
uploadRouter.post("/confirm-presigned-url", presignedLimiter, authMiddleware, confirmUploadFileUsingPresignedUrl)



// multipart upload 3 steps (initiate, upload, complete, abort)
uploadRouter.post("/multipart/initiate", presignedLimiter, authMiddleware, initiateMultipartUpload);
uploadRouter.get("/multipart/presigned-url", presignedLimiter, authMiddleware, getMultipartPresignedUrl);
uploadRouter.post("/multipart/complete", presignedLimiter, authMiddleware, completeMultipartUpload);
uploadRouter.delete("/multipart/abort", presignedLimiter, authMiddleware, abortMultipartUpload);


uploadRouter.get("/storage-info", authMiddleware, getStorageInfo)




export default uploadRouter;
