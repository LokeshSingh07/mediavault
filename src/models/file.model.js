import mongoose from "mongoose";



const fileSchema = new mongoose.Schema({
    originalname: { type: String, required: true },
    mimetype: { type: String, required: true },
    key: { type: String, required: true, unique: true },
    url: { type: String, required: true, unique: true },
    size: { type: Number, required: true },     // bytes
    
    folder: { type: String, enum: ["images", "videos", "audios", "pdfs", "zips", "docs", "excels", "presentations", "texts", "csvs", "others"], required: true },
    uploadType: { type: String, enum:["direct", "presigned", "multipart"], required: true },
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    
    status: { type: String, enum: ["queued", "processing", "completed", "failed"] },

    isFavorite: { type: Boolean, default: false },
    
    // Convenience flag only. ShareLink is the source of truth for access.
    isPublic: { type: Boolean, default: false },


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

    // TODO: HLS (video only, written by the Batch worker)
    // hls: {
    //     masterKey: { type: String, default: null },
    //     masterUrl: { type: String, default: null },
    //     renditions: { type: [String], default: [] },   // e.g. ["720p", "480p"]
    //     generatedAt: { type: Date, default: null },
    // },


    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date, default: null },
}, { timestamps: true });

fileSchema.index({ uploadedBy: 1, isDeleted: 1, createdAt: -1 });
fileSchema.index({ uploadedBy: 1, isFavorite: 1, isDeleted: 1 });
fileSchema.index({ isDeleted: 1, deletedAt: 1,  });


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




/*
// My uploaded files
File.find({
    uploadedBy: userId
});

// Files shared with me
File.find({
    "sharedWith.user": userId
});

*/