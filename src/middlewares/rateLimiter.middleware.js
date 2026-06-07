import { rateLimit } from 'express-rate-limit'

const createLimiter = (windowMs, max, message)=> rateLimit({
	windowMs,
	limit: max,
	standardHeaders: 'draft-8',
	legacyHeaders: false,
	// ipv6Subnet: 56, 
    message: { success: false, message },
})



// ==================================== Limiter ====================================

// Auth -> prevent brute force
export const authLimiter = createLimiter(
    15*60*1000, 
    10,                 // 10 requests in 15 minutes
    "Too many login attempts. Try again after 15 minutes."
);

// Direct upload (multer) => heavy, restrict hard
export const uploadLimiter = createLimiter(
    60*1000,
    10,                 // 10 requests/min
    "Upload limit reached. Try again after 1 minute."
);


// presigned / multipart initiate -> lighter but still limit
export const presignedLimiter = createLimiter(
    60 * 1000,
    60,                 // 30 requests/min
    "Too many requests. Try again after 1 minute."
);


// generate file limiter
export const fileLimiter = createLimiter(
    60 * 1000,
    60,              // 60 requests/min
    "Too many requests. Try again after 1 minute."
);

