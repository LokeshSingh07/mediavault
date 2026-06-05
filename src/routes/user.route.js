import { Router } from "express";
const userRouter = Router();




import { login, signup } from "../controllers/user.controller.js";
import { authLimiter } from "../middlewares/rateLimiter.middleware.js";




userRouter.post("/register", authLimiter, signup);
userRouter.post("/login", authLimiter, login);




export default userRouter;