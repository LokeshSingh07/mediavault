import { SQSClient, SendMessageCommand } from "@aws-sdk/client-sqs";

const sqs = new SQSClient({});
const VIDEO_QUEUE_URL = process.env.VIDEO_QUEUE_URL;


export async function addJobToQueue(payload){
    try{
        const command = new SendMessageCommand({
            QueueUrl: VIDEO_QUEUE_URL,
            MessageBody: JSON.stringify(payload),       // SQS takes a string
        });


        const response = await sqs.send(command);
        console.log("SQS message sent:", response.MessageId);

        return response;
    } catch(err){
        console.error("SQS error:", err);
        throw err;
    }
}
