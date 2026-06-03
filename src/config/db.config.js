import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

// mongoDB events
mongoose.connection.on("error", (err) => { console.log("MongoDB Error:", err) });
mongoose.connection.on("disconnected", () => { console.log("MongoDB Disconnected") });
mongoose.connection.on("reconnected", () => { console.log("MongoDB Reconnected") });
mongoose.connection.on("connected", () => { console.log("MongoDB Connected") });


const gracefulShutdown = async(signal)=>{
    console.log(`\n${signal} received. Closing MongoDB connection...`);
    try{
        await mongoose.connection.close();
        console.log("MongoDB connection closed");
        process.exit(0);
    } catch(err){
        console.log("Error closing MongoDB connection", err);
        process.exit(1);
    }
}

process.on("SIGINT",  () => gracefulShutdown("SIGINT"));
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"))




const connectDB = async() =>{
    try{
        if (!process.env.MONGO_URL || !process.env.MONGO_DB) {
            throw new Error("MONGO_URL or MONGO_DB environment variable is missing");
        }
        
        const mongoURI = `${process.env.MONGO_URL}/${process.env.MONGO_DB}`

        const conn = await mongoose.connect(mongoURI, {
            serverSelectionTimeoutMS: 5000,
        });

        const { name, port, host } = conn.connection;
        console.log("✅ Connected to DB");
        console.log(`   Host: ${host}:${port}  |  Database: ${name}`);
    }
    catch(err){
        console.log(" ❌ Error connecting to DB", err);
        throw err;
    }
}

export { connectDB };