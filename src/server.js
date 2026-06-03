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



const app = express();

// middleware
app.use(express.json());
app.use(cookieParser());
app.use(cors({
    origin: "*",
    credentials: true
}));
app.use(compression());
// app.use(helmet());
// app.use(morgan("dev"));





// API ROUTES
app.use("/api/v1/user", userRouter);
app.use("/api/v1/upload", uploadRouter);
app.use("/api/v1/file", fileRouter);






// ─── Health check ─────────────────────────────────────────────
app.get("/", (req, res) => 
    res.status(200).send("OK")
);



// ─────────────────────────────────────────────
// Start Server
// ─────────────────────────────────────────────
const PORT = process.env.PORT || 3000;

;(async () => {
    try{
        await connectDB();

        app.listen(PORT, '0.0.0.0', () => { 
            console.log(`✅ Server running on port ${PORT}`);
        });

    } catch(err){
        console.log("❌ Server startup failed", err);
        process.exit(1);
    }
})()

