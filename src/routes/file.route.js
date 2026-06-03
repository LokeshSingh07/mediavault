import { Router } from "express";
const fileRouter = Router();



// import controllers
import { 
    getDeletedFileList,
    getFileList,
    getFilePresignedUrl, 
    getFileUrl, 
    hardDeleteFile,
    restoreDeleteFile,
    softDeleteFile, 
} from "../controllers/file.controller.js";





// ======================== API ROUTES ======================== 

// get File List of user
fileRouter.get("/get-all-files", getFileList)

// get Deleted File List of user
fileRouter.get("/get-deleted-files", getDeletedFileList)

// get-url using object key
fileRouter.get("/get-url", getFileUrl)

// get presigned url using object key
fileRouter.get("/get-presigned-url", getFilePresignedUrl)


// delete File (object key) ->> hard delete
fileRouter.delete("/hard-delete", hardDeleteFile)

// delete File (object key) ->> soft delete, restore 
fileRouter.delete("/soft-delete", softDeleteFile)
fileRouter.patch("/restore-delete", restoreDeleteFile)

// bulk trash-empty, restore, hard delete
// fileRouter.delete("/trash-empty", emptyTrash)

//  Cron job — expired trash cleanup







export default fileRouter;
