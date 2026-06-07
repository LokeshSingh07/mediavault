import { Router } from "express";
const aiRouter = Router();




import { getAiResult, getAiStatus, transcribeFile } from "../controllers/ai.controller.js";





aiRouter.post("/transcribe/:fileId", transcribeFile);
aiRouter.get("/status/:resultId", getAiStatus);
aiRouter.get("/result/:fileId", getAiResult);






export default aiRouter;