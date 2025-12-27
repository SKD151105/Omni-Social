import express from "express";
import cors from "cors";
import crypto from "crypto";
import { logger } from "./utils/logger.js";
import cookieParser from "cookie-parser";
import { asyncHandler } from "./utils/asyncHandler.js";
import { ApiError } from "./utils/ApiError.js";
import { rateLimiter } from "./middlewares/rateLimiter.middleware.js";
import { requestLogger } from "./middlewares/requestLogger.middleware.js";
import userRouter from "./routes/user.route.js";
import commentRouter from "./routes/comment.route.js";
import likeRouter from "./routes/like.route.js";
import playlistRouter from "./routes/playlist.route.js";
import subscriptionRouter from "./routes/subscription.route.js";
import tweetRouter from "./routes/tweet.route.js";
import videoRouter from "./routes/video.route.js";
import channelRouter from "./routes/channel.route.js";
import dashboardRouter from "./routes/dashboard.route.js";

const app = express();

const corsOptions = {
    origin: process.env.CORS_ORIGIN || "*",
    credentials: true,
};

// Correlation ID middleware
app.use((req, _res, next) => {
    req.requestId = req.headers["x-request-id"] || crypto.randomUUID();
    next();
});

app.use(requestLogger);
app.use(rateLimiter);
app.use(cors(corsOptions));
app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(cookieParser());
app.use(express.static("public"));

// Basic healthcheck
app.get("/healthcheck", asyncHandler(async (req, res) => {
    res.status(200).json({ status: "ok", uptime: process.uptime(), requestId: req.requestId });
}));

app.use("/api/v1/user", userRouter);
app.use("/api/v1/tweets", tweetRouter);
app.use("/api/v1/subscriptions", subscriptionRouter);
app.use("/api/v1/videos", videoRouter);
app.use("/api/v1/comments", commentRouter);
app.use("/api/v1/likes", likeRouter);
app.use("/api/v1/playlists", playlistRouter);
app.use("/api/v1/channels", channelRouter);
app.use("/api/v1/dashboard", dashboardRouter);

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