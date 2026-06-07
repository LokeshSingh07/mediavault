import mongoose from "mongoose";

const aiResultSchema = new mongoose.Schema({
    file: { type: mongoose.Schema.Types.ObjectId, ref: "File", required: true },
    key: { type: String, required: true },

    // Transcription
    transcript: { type: String, default: null },
    language: { type: String, default: null },
    duration: { type: Number, default: null },

    // AI Processing
    summary: { type: String, default: null },
    keyPoints: [{ type: String, default: null }],
    questions:  [{ type: String, default: null }],

    // Meta
    provider: {
        type: String,
        enum: ["openai", "groq", "aws"],
        default: "groq",
    },
    status: {
        type: String,
        enum: ["pending", "processing", "completed", "failed"],
        default: "pending",
    },
    error: { type: String, default: null },
    processedAt: { type: Date, default: null },

}, { timestamps: true });

export const AIResult = mongoose.model("AiResult", aiResultSchema);
