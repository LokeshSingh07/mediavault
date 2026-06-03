import path from "path";
import crypto from "crypto";
import dotenv from "dotenv";
dotenv.config();

import fs from "fs";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});


/**
 * Generate secure unique filename
 */
function generateFileName(originalName) {
  const extension = path.extname(originalName);

  const randomName = crypto.randomBytes(32).toString("hex");

  return `${Date.now()}-${randomName}${extension}`;
}


async function uploadFile() {
  try {
    // create sample file if not exists
    const localFilePath = "./hello.txt";

    if (!fs.existsSync(localFilePath)) {
      fs.writeFileSync(
        localFilePath,
        "Hello from Node.js to AWS S3"
      );
    }

    const fileContent = fs.readFileSync(localFilePath);

    /**
     * Secure file name
     */
    const fileName = generateFileName("hello.txt");

    /**
     * Better folder structure
     */
    const key = `uploads/text/${fileName}`;


    const command = new PutObjectCommand({
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: key,
      Body: fileContent,
      ContentType: "text/plain",
    //   ACL: "public-read",
    });

    const response = await s3.send(command);

    console.log("Upload Success");
    console.log(response);

    
    const fileUrl = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;

    console.log("File URL: ", fileUrl);

  } catch (error) {
    console.error("Upload Error:");
    console.error(error);
  }
}

uploadFile();