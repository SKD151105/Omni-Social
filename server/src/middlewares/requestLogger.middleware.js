import { logger } from "../utils/logger.js";

export const requestLogger = (req, res, next) => {
    const start = process.hrtime.bigint();

    res.on("finish", () => {
        const end = process.hrtime.bigint();
        const durationMs = Number(end - start) / 1_000_000;
        const status = res.statusCode;
        const method = req.method;
        const path = req.originalUrl || req.url;
        const userId = req.user?._id || "anon";

        logger.info("HTTP", {
            method,
            path,
            status,
            durationMs: durationMs.toFixed(2),
            ip: req.ip || req.connection?.remoteAddress,
            userAgent: req.headers["user-agent"],
            contentLength: res.get("Content-Length") || 0,
            requestId: req.requestId,
            userId,
        });
    });

    return next();
};
