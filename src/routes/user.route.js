import { Router } from "express";
const userRouter = Router();




import { login, signup, testWelcomeEmail } from "../controllers/user.controller.js";
import { authLimiter } from "../middlewares/rateLimiter.middleware.js";




userRouter.post("/register", authLimiter, signup);
userRouter.post("/login", authLimiter, login);
userRouter.post("/test/welcome-email", testWelcomeEmail);




export default userRouter;