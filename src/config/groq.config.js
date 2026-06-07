import Groq from "groq-sdk";
import dotenv from "dotenv";
dotenv.config();

const requiredEnvVars = ["GROQ_API_KEY"];
for (const key of requiredEnvVars) {
  if (!process.env[key]) {
    throw new Error(`Missing environment variable: ${key}`);
  }
}

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export { groq };