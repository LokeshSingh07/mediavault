import mongoose from "mongoose";

const fileSchema = new mongoose.Schema(
  {
    originalname: { type: String, required: true },
    mimetype: { type: String, required: true },
    key: { type: String, required: true, unique: true },
    url: { type: String, required: true, unique: true },
    size: { type: Number, required: true },

    folder: {
      type: String,
      enum: [
        "images",
        "videos",
        "audios",
        "pdfs",
        "zips",
        "docs",
        "excels",
        "presentations",
        "texts",
        "csvs",
        "others",
      ],
      required: true,
    },

    uploadType: {
      type: String,
      enum: ["direct", "presigned", "multipart"],
      required: true,
    },

    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    status: {
      type: String,
      enum: ["queued", "processing", "completed", "failed"],
    },

    isFavorite: {
      type: Boolean,
      default: false,
    },

    isPublic: {
      type: Boolean,
      default: false,
    },

    sharedLink: {
      type: String,
      default: null,
    },

    sharedLinkExpiry: {
      type: Date,
      default: null,
    },

    preview: {
      blurhash: { type: String, default: null },
      thumbnailKey: { type: String, default: null },
      thumbnailUrl: { type: String, default: null },
      thumbnailSize: { type: Number, default: null },
      generatedAt: { type: Date, default: null },
    },

    metadata: {
      width: { type: Number, default: null },
      height: { type: Number, default: null },
      duration: { type: Number, default: null },
    },

    isDeleted: {
      type: Boolean,
      default: false,
    },

    deletedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

fileSchema.index({
  uploadedBy: 1,
  isDeleted: 1,
  createdAt: -1,
});

fileSchema.index({
  uploadedBy: 1,
  isFavorite: 1,
  isDeleted: 1,
});

fileSchema.index({
  isDeleted: 1,
  deletedAt: 1,
});

// Prevent model overwrite in Lambda warm starts
const File = mongoose.models.File || mongoose.model("File", fileSchema);

export { File };