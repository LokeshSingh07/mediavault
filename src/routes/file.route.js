import { Router } from "express";
const fileRouter = Router();



// import controllers
import { 
    accessShareLink,
    emptyTrash,
    generateShareableLink,
    getDeletedFileList,
    getFavouriteFileList,
    getFile,
    getFileList,
    hardDeleteFile,
    restoreAllTrash,
    restoreDeleteFile,
    revokeSharedLink,
    softDeleteFile,
    toggleFavouriteFile,
    toggleFileVisibility, 
} from "../controllers/file.controller.js";
import { fileLimiter } from "../middlewares/rateLimiter.middleware.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";

// ======================== API ROUTES ======================== 

// get File List of user
fileRouter.get("/get-all-files", fileLimiter, authMiddleware,  getFileList)

// get Deleted File List of user
fileRouter.get("/get-deleted-files", authMiddleware, getDeletedFileList)

// get-url using object key
// fileRouter.get("/get-url",  getFileUrl)

fileRouter.get("/search", authMiddleware, getFile)

// delete File (object key) ->> hard delete
fileRouter.delete("/hard-delete", authMiddleware, hardDeleteFile)

// delete File (object key) ->> soft delete, restore 
fileRouter.delete("/soft-delete", authMiddleware, softDeleteFile)
fileRouter.patch("/restore-delete", authMiddleware, restoreDeleteFile)

// bulk trash operations
fileRouter.delete("/empty-trash", authMiddleware, emptyTrash);
fileRouter.patch("/restore-all-trash", authMiddleware, restoreAllTrash);

//  Cron job — expired trash cleanup




// get All Favourite Files
fileRouter.get("/favourites", authMiddleware, getFavouriteFileList)
// toggleFavourite
fileRouter.patch("/toggle-favourite", authMiddleware, toggleFavouriteFile)


// search 




// ======================== SHARE LINKS ROUTES ========================
// fileRouter.geet("/share", fileLimiter, authMiddleware, getShareableLink);
fileRouter.post("/share", fileLimiter, authMiddleware, generateShareableLink);
fileRouter.get("/s/:token", fileLimiter, accessShareLink);
fileRouter.patch("/revoke-share", fileLimiter, authMiddleware, revokeSharedLink);
fileRouter.patch("/toggle-visibility", fileLimiter, authMiddleware, toggleFileVisibility);






export default fileRouter;
