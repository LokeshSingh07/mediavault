import { File } from "../models/file.model.js";
import { AIResult } from "../models/aiResult.model.js";
import { downloadFromS3 } from "../utils/s3.utils.js";
import { processVideoWithGroq } from "../utils/groq.utils.js";




export const transcribeFile = async(req, res) => {
    try{
        // take FileId
        // validation
        // create pending record
        // download file from s3
        // transcribe
        // update record

        const { fileId } = req.params;
        if(!fileId){
            return res.status(400).json({success: false, message: "FileId is required"});
        }

        const file = await File.findById(fileId);
        if(!file){
            return res.status(400).json({success: false, message: "File not found"});
        }
        

        // check if already processed
        const existing = await AIResult.findOne({file: file._id}).select("status").lean();
        if(existing){
            if(existing.status === "completed"){
                return res.status(400).json({success: false, message: "Already processed", result: existing});
            } 
            else if(existing.status === "processing"){
                return res.status(400).json({success: false, message:  "File is already being processed, please wait"});
            } 
            else if(existing.status === "pending"){
                return res.status(400).json({success: false, message: "File is queued for processing, please wait"});
            } 
            else if(existing.status === "failed"){
                await AIResult.findOneAndDelete({file: file._id});    
            }
        }


        const aiResult = await AIResult.create({
            file: file._id,
            key: file.key,
            provider: "groq",
            status: "pending",
        });


        // responsd immediately
        res.status(202).json({
            success: true, 
            message: "Processing started", 
            result: {
                _id: aiResult._id,
                status: "pending"
            }
        });

        // run in the background 
        processInBackGround(aiResult, file);


    } catch(err){
        return res.status(500).json({success: false, message: "Internal Server Error", errror: err.message});
    }
}


async function processInBackGround(aiResult, file){
    try{
        // downlaod from s3
        const buffer = await downloadFromS3(file.key);

        aiResult.status = "processing";
        await aiResult.save();

        const result = await processVideoWithGroq(buffer, file.folder);

        
        // save results
        aiResult.status = "completed";
        aiResult.transcript = result.transcript;
        aiResult.language = result.language;
        aiResult.duration = result.duration;
        aiResult.summary = result.summary;
        aiResult.keyPoints = result.keyPoints;
        aiResult.questions = result.questions;
        aiResult.processedAt = new Date();
        await aiResult.save();

        console.log(`✅ Processing completed for file: ${file.originalname}`);
    }
    catch(err){
        aiResult.status = "failed";
        aiResult.error = err.message;
        await aiResult.save();

        console.log(`❌ Processing failed for file: ${file.originalname}`, err.message);
    }
}




export const getAiResult = async(req, res) => {
    try{
        const { fileId } = req.params;
        if(!fileId){
            return res.status(400).json({success: false, message: "FileId is required"});
        }

        const aiResult = await AIResult.findOne({file: fileId}).populate("file", "originalname mimeType url");
        if(!aiResult){ return res.status(400).json({success: false, message: "AI Result not found"}) }

        return res.status(200).json({success: true, message: "AI Result fetched successfully", result: aiResult});
    } catch(err){
        return res.status(500).json({success: false, message: "Internal Server Error", errror: err.message});
    }
}



// GET /api/v1/ai/status/:resultId
export const getAiStatus = async (req, res) => {
    try {
        const { resultId } = req.params;

        const aiResult = await AIResult.findById(resultId)
            .select("status language duration error processedAt");

        if (!aiResult) return res.status(404).json({ success: false, message: "Result not found" });

        return res.status(200).json({ success: true, message: "AI Result fetched successfully", result: aiResult });
    } catch (err) {
        return res.status(500).json({ success: false, message: "Internal Server Error", error: err.message });
    }
}