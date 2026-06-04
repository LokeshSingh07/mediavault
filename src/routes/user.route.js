import { Router } from "express";
const userRouter = Router();




import { login, signup } from "../controllers/user.controller.js";




userRouter.post("/register", signup);
userRouter.post("/login", login);




export default userRouter;