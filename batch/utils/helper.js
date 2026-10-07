export function buildThumbnailKey(originalKey) {
    return originalKey
        .replace("uploads/", "thumbnails/")
        .replace(/\.[^.]+$/, ".jpg");
}