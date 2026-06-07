import express from "express";
import cors from "cors";
import compression from "compression";
// import helmet from "helmet";
// import morgan from "morgan";
import { connectDB } from "./config/db.config.js";
import uploadRouter from "./routes/upload.route.js";
import fileRouter from "./routes/file.route.js";
import cookieParser from "cookie-parser";
import userRouter from "./routes/user.route.js";
import { startTrashCleanupCron } from "./utils/cron.utils.js";
import aiRouter from "./routes/ai.routes.js";



const app = express();

// middleware
app.use(express.json());
app.use(cookieParser());
// app.use(cors({
//     origin: "*",
//     credentials: true
// }));
app.use(compression());
// app.use(helmet());
// app.use(morgan("dev"));

const allowedOrigins = [
    "http://localhost:8080",
    "http://localhost:3000"
];

app.use(cors({
    origin: function(origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error("Not allowed by CORS"));
        }
    },
    credentials: true
}));




// API ROUTES
app.use("/api/v1/user", userRouter);
app.use("/api/v1/upload", uploadRouter);
app.use("/api/v1/file", fileRouter);
app.use("/api/v1/ai", aiRouter);






// ─── Health check ─────────────────────────────────────────────
app.get("/", (req, res) => 
    res.status(200).send("OK")
);



// ─────────────────────────────────────────────
// Start Server
// ─────────────────────────────────────────────
const PORT = process.env.PORT || 4002;

;(async () => {
    try{
        await connectDB();

        startTrashCleanupCron();

        app.listen(PORT, '0.0.0.0', () => { 
            console.log(`✅ Server running on port ${PORT}`);
        });

    } catch(err){
        console.log("❌ Server startup failed", err);
        process.exit(1);
    }
})()

