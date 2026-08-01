import { SQSClient, SendMessageCommand } from "@aws-sdk/client-sqs";

const sqs = new SQSClient({});
const VIDEO_QUEUE_URL = process.env.VIDEO_QUEUE_URL;


export async function addJobToQueue(payload){
    try{
        const command = new SendMessageCommand({
            QueueUrl: VIDEO_QUEUE_URL,
            MessageBody: JSON.stringify(payload),       // SQS takes a string
        });
        
        return sqs.send(command);
    } catch(err){
        console.log(err);
    }
}
