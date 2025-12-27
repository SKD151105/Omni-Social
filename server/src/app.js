import express from "express";
import cors from "cors";
import crypto from "crypto";
import { logger } from "./utils/logger.js";
import cookieParser from "cookie-parser";
import { asyncHandler } from "./utils/asyncHandler.js";
import { ApiError } from "./utils/ApiError.js";
import userRouter from "./routes/user.route.js";

const app = express();

const corsOptions = {
    origin: process.env.CORS_ORIGIN || "*",
    credentials: true,
};

app.use(cors(corsOptions));
app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(cookieParser());
app.use(express.static("public"));

// Correlation ID middleware
app.use((req, _res, next) => {
    req.requestId = req.headers["x-request-id"] || crypto.randomUUID();
    next();
});

/*
 * Simple request logger.
 * Records method, URL, status, duration, IP, user-agent, and response size.
 * Runs on the "finish" event so timing and status are accurate.
 * Lightweight enough for dev; useful for basic observability in prod.
*/
app.use((req, res, next) => {
    const start = process.hrtime.bigint(); // high precision timer

    res.on("finish", () => {
        const end = process.hrtime.bigint();
        const durationMs = Number(end - start) / 1_000_000; // convert ns → ms

        logger.info("HTTP", {
            method: req.method,
            path: req.originalUrl,
            status: res.statusCode,
            durationMs: durationMs.toFixed(2),
            ip: req.ip || req.connection.remoteAddress,
            userAgent: req.headers["user-agent"],
            contentLength: res.get("Content-Length") || 0,
            timestamp: new Date().toISOString(),
            requestId: req.requestId,
            userId: req.user?._id,
        });
    });

    next();
});

// Basic healthcheck
app.get("/healthz", asyncHandler(async (req, res) => {
    res.status(200).json({ status: "ok", uptime: process.uptime(), requestId: req.requestId });
}));

app.use("/api/v1/user", userRouter);

// Fallback for unmatched routes: forward to centralized error handler
app.use((req, res, next) => {
    next(new ApiError(404, "Not found"));
});

// Centralized error handler
// Using _next to indicate we are not using the next parameter to avoid linting issues
app.use((err, req, res, _next) => {
    const statusCode = err?.statusCode || err?.status || 500;
    const message = err?.message || "Internal server error";
    const errors = err?.errors || [];
    const data = err?.data ?? null;

    logger.error("Unhandled error", { error: message, stack: err?.stack, statusCode, requestId: req.requestId, userId: req.user?._id });

    res.status(statusCode).json({ success: false, message, errors, data, requestId: req.requestId });
});

export default app;