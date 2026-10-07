import { GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3"



const requiredEnvVars = ["AWS_REGION"];
for(const key of requiredEnvVars){
  if(!process.env[key]){
    throw new Error(`Missing environment variable: ${key}`);
  }
}

const s3 = new S3Client({
  region: process.env.AWS_REGION,
});



const REGION = process.env.AWS_REGION
const BUCKET = process.env.AWS_BUCKET_NAME;
const CLOUDFRONT_DOMAIN = process.env.CLOUDFRONT_DOMAIN;

// export function buildFileUrl(key) {
//     return `https://${BUCKET}.s3.${REGION}.amazonaws.com/${key}`;
// }
export function buildFileUrl(key) {
    return `https://${CLOUDFRONT_DOMAIN}/${key}`;
}





// Upload buffer to S3
export async function uploadToS3(buffer, key, mimeType){
    const command = new PutObjectCommand({
        Bucket: BUCKET,
        Key: key,
        Body: buffer,
        ContentType: mimeType
    })
    
    await s3.send(command);
    return { key, url: buildFileUrl(key)};
}



// download from s3
export async function downloadFromS3(key) {
    const command = new GetObjectCommand({ 
        Bucket: BUCKET, 
        Key: key 
    });
    
    const response = await s3.send(command);

    // response.Body is a readable stream → convert to buffer
    const chunks = [];
    for await (const chunk of response.Body) {
        chunks.push(chunk);
    }
    
    return Buffer.concat(chunks);
}