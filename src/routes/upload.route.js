
import { Router } from "express";
const uploadRouter = Router();



// import controllers
import {
    abortMultipartUpload,
    completeMultipartUpload,
    confirmUploadFileUsingPresignedUrl,
    getMultipartPresignedUrl,
    initiateMultipartUpload,
    uploadFile, 
    uploadFileUsingPresignedUrl
} from "../controllers/upload.controller.js";
import  upload, { checkFileSize }  from "../middlewares/multer.middleware.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";








// ======================== API ROUTES ======================== 



// upload File (multer)
// uploadRouter.post("/server-side-upload", upload.single("file"), uploadFile)
uploadRouter.post("/server-side-upload",authMiddleware,  upload.array("files", 20), checkFileSize, uploadFile)

// upload File (generate presigned url)
uploadRouter.post("/upload-presigned-url", uploadFileUsingPresignedUrl)
uploadRouter.post("/confirm-presigned-url", confirmUploadFileUsingPresignedUrl)



// multipart upload 3 steps (initiate, upload, complete, abort)
uploadRouter.post("/multipart/initiate", initiateMultipartUpload);
uploadRouter.get("/multipart/presigned-url", getMultipartPresignedUrl);
uploadRouter.post("/multipart/complete", completeMultipartUpload);
uploadRouter.delete("/multipart/abort", abortMultipartUpload);







export default uploadRouter;
