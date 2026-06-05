import { User } from "../models/user.model.js";



export const checkStorageLimit = async (req, res, next) => {
    try{
        const userId = req.user?.id;
        const files = req.files ?? [];

        // icoming files size
        const totalFileSize = files.reduce((acc, curr)=> acc + curr.size, 0)

        // check storage is left / allow upload
        const user = await User.findById(userId).select("storageLimit storageUsed");
        if(!user){
            return res.status(400).json({success: false, message: "User not found"});
        }

        // validation
        if(user.storageUsed + totalFileSize > user.storageLimit){
            return res.status(400).json({
                success: false, 
                message: "Storage limit exceeded",
                used: user.storageUsed,
                limit: user.storageLimit       
            });
        }


        req.incomingSize = totalFileSize;
        next();
    }
    catch(err){
        return res.status(500).json({success: false, message: "Internal Server Error", errror: err.message});
    }
}


