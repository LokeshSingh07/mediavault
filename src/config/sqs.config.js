import { DeleteMessageCommand, SendMessageCommand, SQSClient} from "@aws-sdk/client-sqs";
import dotenv from "dotenv";
dotenv.config();


const requiredEnvVars = ["AWS_REGION", "AWS_ACCESS_KEY_ID", "AWS_SECRET_ACCESS_KEY", "SQS_QUEUE_URL"];
for(const key of requiredEnvVars){
    if(!process.env[key]){
        throw new Error(`Missing environment variable: ${key}`);
    }
}

const REGION = process.env.AWS_REGION;
const SQS_QUEUE_URL= process.env.SQS_QUEUE_URL;
const MOCK_SEND = process.env.MOCK_SEND === "true";



export const sqs = new SQSClient({ 
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


export async function deleteFromQueue(receiptHandle){
    if(MOCK_SEND){
        console.log("MOCK_DELETE: ", receiptHandle);
        return;
    }
    const command = new DeleteMessageCommand({
        QueueUrl: SQS_QUEUE_URL,
        ReceiptHandle: receiptHandle,
    });
    await sqs.send(command);

}