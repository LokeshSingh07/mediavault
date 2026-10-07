import mongoose from "mongoose";

const shareLinkSchema = new mongoose.Schema({
    token:         { type: String, required: true, unique: true },   // unique already creates the index
    file:          { type: mongoose.Schema.Types.ObjectId, ref: "File", required: true },
    createdBy:     { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    expiresAt:     { type: Date, required: true },
    revoked:       { type: Boolean, default: false },
    allowDownload: { type: Boolean, default: true },
    accessCount:   { type: Number, default: 0 },
}, { timestamps: true });



shareLinkSchema.index({ file: 1, revoked: 1, expiresAt: 1 });

// Auto-delete records 7 days after they expire
shareLinkSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 7 * 24 * 60 * 60 });



export const ShareLink = mongoose.model("ShareLink", shareLinkSchema);