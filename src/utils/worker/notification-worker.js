// SendMessageCommand — producer puts a message on the queue
// ReceiveMessageCommand — worker asks "give me some messages"
// DeleteMessageCommand — worker says "I'm done with this one, remove it"

import { SQSClient, SendMessageCommand, ReceiveMessageCommand, DeleteMessageCommand, Message$ } from "@aws-sdk/client-sqs";
import dotenv from "dotenv";
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




async function sendJob(payload){
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
            const job = JSON.parse(msg.Body);

            try{
                await doJob(job);

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





// simulate doing work on a job
async function doJob(job) {
    console.log("Processing job:", job);

    // simulate variable processing time (0.5s - 2s)
    const delay = 500 + Math.random() * 1500;
    await new Promise((resolve) => setTimeout(resolve, delay));

    // simulate occasional failure (~20% of the time)
    if (Math.random() < 0.2) {
        throw new Error(`Simulated failure while processing job ${job.id ?? "unknown"}`);
    }

    console.log(`Job ${job.id ?? "unknown"} completed successfully in ${Math.round(delay)}ms`);
}




// example: send a few jobs, then start the worker
async function main() {
    // await sendJob({ id: 1, task: "resize-image" });
    // await sendJob({ id: 2, task: "send-email" });
    // await sendJob({ id: 3, task: "generate-report" });

    // pollAndProcess(); 
}

main();