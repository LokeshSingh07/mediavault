import jwt from "jsonwebtoken";



export const authMiddleware = (req, res, next) => {
    try{
        const token = req.cookies.accessToken;
        if(!token){
            return res.status(401).json({success: false, message: "Unauthorized"});
        }

        const payload = jwt.verify(token, process.env.JWT_SECRET);
        req.user = payload;
        next();
    }
    catch(err){
        return res.status(500).json({success: false, message: "Internal Server Error", errror: err.message});
    }
}



