import multer from "multer";

const ALLOWED_MIME_TYPES = {
    // images — 10MB
    "image/jpeg":   10 * 1024 * 1024,
    "image/png":    10 * 1024 * 1024,
    "image/webp":   10 * 1024 * 1024,
    "image/gif":    10 * 1024 * 1024,

    // video — 500MB
    "video/mp4":    500 * 1024 * 1024,
    "video/webm":   500 * 1024 * 1024,
    
    // docs — 25MB
    "application/pdf":          25 * 1024 * 1024,
    "application/msword":       25 * 1024 * 1024,
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": 25 * 1024 * 1024,
    
    // zip
    "application/zip": 25 * 1024 * 1024,
    "application/x-zip-compressed": 25 * 1024 * 1024,

    // spreadsheets — 25MB
    "application/vnd.ms-excel": 25 * 1024 * 1024,
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet":       25 * 1024 * 1024,
    
    // text — 5MB
    "text/plain":   5 * 1024 * 1024,
    "text/csv":     5 * 1024 * 1024,
    "text/html":    5 * 1024 * 1024,
    "text/javascript": 5 * 1024 * 1024,
    "text/typescript": 5 * 1024 * 1024,
    "text/markdown": 5 * 1024 * 1024,
    "text/yaml": 5 * 1024 * 1024,
    "text/x-c": 5 * 1024 * 1024,
    "text/x-c++": 5 * 1024 * 1024,
    "application/x-python-code":    5 * 1024 * 1024,
    "text/x-python":                5 * 1024 * 1024,


    // audio — 20MB
    "audio/mpeg":   20 * 1024 * 1024

};


const fileFilter = (req, file, cb) => {
    if ( file.mimetype in ALLOWED_MIME_TYPES) {
        cb(null, true);
    } else {
        cb(new Error(`File type not allowed: ${file.mimetype}`), false);
    }
};


// Set multer's hard limit to the largest allowed size
const MAX_SIZE = Math.max(...Object.values(ALLOWED_MIME_TYPES));

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: MAX_SIZE },
    fileFilter
})


// Per-type size check (multer limits can't do per-type)
export function checkFileSize(req, res, next) {
    const files = req.files ?? [];
    for(const file of files){
        const limit = ALLOWED_MIME_TYPES[file?.mimetype];
        if (file.size > limit) {
            return res.status(400).json({
                error: `File too large. Max size for ${file.mimetype} is ${limit / (1024 * 1024)}MB`,
            });
        }
    }
    next();
}

export default upload;