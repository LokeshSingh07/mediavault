import nodemailer from "nodemailer";
import dotenv from "dotenv";
dotenv.config();


// check env vars
const requiredEnvVars = ["ZOHO_SMTP_HOST", "ZOHO_SMTP_PORT", "ZOHO_SMTP_USER", "ZOHO_SMTP_PASS"];
for (const key of requiredEnvVars) {
    if (!process.env[key]) {
        throw new Error(`Missing environment variable: ${key}`);
    }
}



// Create a transporter using SMTP
export const transporter = nodemailer.createTransport({
  host: process.env.ZOHO_SMTP_HOST,
  port: process.env.ZOHO_SMTP_PORT,
  secure: true,
  auth: {
    user: process.env.ZOHO_SMTP_USER,
    pass: process.env.ZOHO_SMTP_PASS,
  },
});

