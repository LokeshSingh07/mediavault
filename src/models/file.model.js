import mongoose from "mongoose";



const fileSchema = new mongoose.Schema({
    originalname: { type: String, required: true },
    mimetype: { type: String, required: true },
    key: { type: String, required: true },
    url: { type: String, required: true },
    size: { type: Number, required: true },     // bytes
    
    folder: { type: String, enum: ["images", "videos", "audios", "pdfs", "zips", "docs", "excels", "presentations", "texts", "csvs", "others"], required: true },
    uploadType: { type: String, enum:["direct", "presigned", "multipart"], required: true },
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    // ─── Preview / Thumbnail ──────────────────────────────────
    preview: {
        blurhash: { type: String, default: null },
        thumbnailKey: { type: String, default: null },
        thumbnailUrl: { type: String, default: null },
        thumbnailSize: { type: Number, default: null },
        generatedAt: { type: Date, default: null },
    },

    // Media Metadata
    metadata: {
        width: { type: Number, default: null },     // px
        height: { type: Number, default: null },    // px
        duration: { type: Number, default: null }   // sec (video and audio only)
    },

    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date, default: null },
}, { timestamps: true });



// methods -> soft delete
// methods -> restore
// methods -> hard delete
fileSchema.methods.softDelete = async function() {
    this.isDeleted = true;
    this.deletedAt = new Date();
    return this.save();
}

fileSchema.methods.restore = async function() {
    this.isDeleted = false;
    this.deletedAt = null;
    return this.save();
}

fileSchema.methods.hardDelete = async function() {
    return this.deleteOne();
}





export const File =  mongoose.model("File", fileSchema);