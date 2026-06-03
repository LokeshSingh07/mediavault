import { S3Client } from "@aws-sdk/client-s3"
import dotenv from "dotenv";
dotenv.config();

const requiredEnvVars = ["AWS_REGION", "AWS_ACCESS_KEY_ID", "AWS_SECRET_ACCESS_KEY"];
for(const key of requiredEnvVars){
  if(!process.env[key]){
    throw new Error(`Missing environment variable: ${key}`);
  }
}

const s3 = new S3Client({
  region: process.env.AWS_REGION,
  requestChecksumCalculation: "WHEN_REQUIRED",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
  // Add timeout
  requestHandler: {
    requestTimeout: 30000,    // 30 seconds
    connectionTimeout: 5000,
  }
});

export { s3 };
