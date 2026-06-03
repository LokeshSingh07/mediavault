import { 
    CloudFrontClient,
    CreateInvalidationCommand
} from "@aws-sdk/client-cloudfront";


// check env vars
const requiredEnvVars = ["AWS_BUCKET_NAME", "AWS_REGION", "CLOUDFRONT_DOMAIN", "CLOUDFRONT_DISTRIBUTION_ID"];
for (const key of requiredEnvVars) {
    if (!process.env[key]) {
        throw new Error(`Missing environment variable: ${key}`);
    }
}



const REGION = process.env.AWS_REGION;
// const CLOUDFRONT_DOMAIN = process.env.CLOUDFRONT_DOMAIN;
const CLOUDFRONT_DISTRIBUTION_ID = process.env.CLOUDFRONT_DISTRIBUTION_ID;


// configure cloudfront
const cloudfrontClient = new CloudFrontClient({
    region: REGION
});




// Invlaidate Cloudfront cache
export async function invalidateCloudfrontCache(key){
    const command =  new CreateInvalidationCommand({
        DistributionId: CLOUDFRONT_DISTRIBUTION_ID,
        InvalidationBatch: {
            Paths: {
                Quantity: 1,
                Items: [`/${key}`]
            },
            CallerReference: Date.now().toString()
        }
    })

    await cloudfrontClient.send(command);

    return { invalidated: true };

}