import mongoose from "mongoose";

let isConnected = false;

mongoose.connection.on("connected", () => {
    console.log("✅ MongoDB Connected");
});

mongoose.connection.on("error", (err) => {
    console.error("❌ MongoDB Error:", err);
});

mongoose.connection.on("disconnected", () => {
    console.log("⚠️ MongoDB Disconnected");
});

export async function connectDB() {
    if (isConnected) {
        console.log("♻️ Using existing MongoDB connection");
        return;
    }

    try {
        const mongoURI =
            process.env.MONGODB_URI ||
            `${process.env.MONGO_URL}/${process.env.MONGO_DB}`;

        if (!mongoURI) {
            throw new Error("MongoDB connection string is missing.");
        }

        await mongoose.connect(mongoURI, {
            serverSelectionTimeoutMS: 5000,
        });

        isConnected = true;

        console.log("✅ Connected to MongoDB");
    } catch (err) {
        console.error("❌ Failed to connect to MongoDB:", err);
        throw err;
    }
}