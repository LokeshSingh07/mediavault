// SendMessageCommand — producer puts a message on the queue
// ReceiveMessageCommand — worker asks "give me some messages"
// DeleteMessageCommand — worker says "I'm done with this one, remove it"

import { SQSClient, SendMessageCommand, ReceiveMessageCommand, DeleteMessageCommand, Message$ } from "@aws-sdk/client-sqs";
import dotenv from "dotenv";
import { AIResult } from "../../models/aiResult.model.js";
import { File } from "../../models/file.model.js";
dotenv.config({path: "../../../.env"});



const REGION = process.env.AWS_REGION;
const SQS_QUEUE_URL= process.env.SQS_QUEUE_URL;
const POLL_MODE = process.env.POLL_MODE === "short" ? "short" : "long";

const MOCK_SEND = process.env.MOCK_SEND === "true";
const WAIT_TIME_SECONDS = POLL_MODE === "long" ? 20 : 10;



const sqs = new SQSClient({ 
    region: REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
 });




export async function addJobToQueue(payload){
    if(MOCK_SEND){
        console.log("MOCK_SEND: ", payload);
        return;
    }

    const command = new SendMessageCommand({
        QueueUrl: SQS_QUEUE_URL,
        MessageBody: JSON.stringify(payload),       // SQS takes a string
    });

    return sqs.send(command);
}



// receive message from queue
async function pollAndProcess(){
    while(true){
        const command = new ReceiveMessageCommand({
            QueueUrl: SQS_QUEUE_URL,
            MaxNumberOfMessages: 10,
            WaitTimeSeconds: WAIT_TIME_SECONDS,
        });

        const response = await sqs.send(command);
        const Messages = response.Messages;
        if(!Messages) continue;

        // process each message(batch)
        for(const msg of Messages){
            // parse
            const { aiResultId, fileKey } = JSON.parse(msg.Body);

            try{
                await processInBackGround(aiResultId, fileKey);

                // delete after successfull processing
                const command = new DeleteMessageCommand({
                    QueueUrl: SQS_QUEUE_URL,
                    ReceiptHandle: msg.ReceiptHandle,
                });
                await sqs.send(command);
            } catch(err){
                console.error("Job failed, leaving it in queue", err);
            }
        }
    }
}



async function processInBackGround(aiResultId, fileKey){
    const aiResult = await AIResult.findById(aiResultId);
    const file = await File.findById(fileKey);
    try{

        if(!aiResult || !file){
            throw new Error("AI Result or File not found");
        }

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
        console.log(`❌ Processing failed for file: ${file.originalname}`, err.message);
        
        if(aiResult){
            aiResult.status = "failed";
            aiResult.error = err.message;
            await aiResult.save().catch(()=> {});
        }
        else{
            console.log("AI Result not found");
        }
    }
}






// example: send a few jobs, then start the worker
async function main() {
    // pollAndProcess(); 
}

main();