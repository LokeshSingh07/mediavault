import { SQSClient, SendMessageCommand } from "@aws-sdk/client-sqs";
import dotenv from "dotenv";

dotenv.config({ path: `${process.cwd()}/.env` });

const REGION = process.env.AWS_REGION;
const SQS_QUEUE_URL = process.env.SQS_QUEUE_URL;
const MOCK_SEND = process.env.MOCK_SEND === "true";

const sqs = new SQSClient({
  region: REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

export async function sendSQSJob(payload) {
  if (!SQS_QUEUE_URL) {
    throw new Error("SQS_QUEUE_URL is not configured");
  }

  if (MOCK_SEND) {
    console.log("[SQS] MOCK_SEND job:", payload);
    return;
  }

  const command = new SendMessageCommand({
    QueueUrl: SQS_QUEUE_URL,
    MessageBody: JSON.stringify(payload),
  });

  return sqs.send(command);
}
