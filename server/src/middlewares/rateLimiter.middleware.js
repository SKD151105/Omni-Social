// In-memory rate limiter (default/fallback)
import { ApiError } from "../utils/ApiError.js";
import { logger } from "../utils/logger.js";
const WINDOW_MS = 15 * 60 * 1000;
const MAX_REQUESTS = Number(process.env.RATE_LIMIT_MAX) || 100;
const hits = new Map();
function cleanupStaleEntries() {
    const now = Date.now();
    for (const [ip, arr] of hits.entries()) {
        if (!arr.length || arr[arr.length - 1] < now - WINDOW_MS) {
            hits.delete(ip);
        }
    }
}
setInterval(cleanupStaleEntries, WINDOW_MS);
export const memoryRateLimiter = (req, res, next) => {
    const ip = req.ip || req.headers["x-forwarded-for"] || req.connection?.remoteAddress || "unknown";
    const now = Date.now();
    const windowStart = now - WINDOW_MS;
    let timestamps = hits.get(ip) || [];
    timestamps = timestamps.filter(ts => ts > windowStart);
    timestamps.push(now);
    hits.set(ip, timestamps);
    const remaining = Math.max(0, MAX_REQUESTS - timestamps.length);
    const reset = timestamps[0] ? Math.ceil((timestamps[0] + WINDOW_MS - now) / 1000) : WINDOW_MS / 1000;
    const retryAfterMs = timestamps.length > MAX_REQUESTS ? (timestamps[0] + WINDOW_MS - now) : 0;
    res.setHeader("X-RateLimit-Limit", String(MAX_REQUESTS));
    res.setHeader("X-RateLimit-Remaining", String(Math.max(0, remaining)));
    res.setHeader("X-RateLimit-Reset", String(Math.ceil(now / 1000) + reset));
    if (retryAfterMs > 0) {
        res.setHeader("Retry-After", String(Math.ceil(retryAfterMs / 1000)));
        return next(new ApiError(429, "Too many requests"));
    }
    return next();
};

// Redis-based rate limiter (for production)
import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import Redis from 'ioredis';
// Only use Redis if USE_REDIS env var is set to 'true'
let redisRateLimiter = null;
let redisClient;
if (process.env.USE_REDIS === 'true') {
    try {
        redisClient = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
        redisRateLimiter = rateLimit({
            store: new RedisStore({
                sendCommand: (...args) => redisClient.call(...args),
                passIfNotConnected: true,
            }),
            windowMs: parseInt(process.env.RATE_LIMIT_WINDOW, 10) || 15 * 60 * 1000,
            max: parseInt(process.env.RATE_LIMIT_MAX, 10) || 100,
            message: 'Too many requests, please try again later.',
            standardHeaders: true,
            legacyHeaders: false,
        });
        // Add global error handler for redis client
        redisClient.on('error', (err) => {
            console.error('Global Redis client error (non-fatal):', err.message);
        });
    } catch (e) {
        redisRateLimiter = null;
        redisClient = null;
    }
}
export { redisRateLimiter };

// Patch: Graceful fallback to memory limiter if Redis is unavailable
let useRedis = !!redisRateLimiter;
let loggedMode = false;
if (redisRateLimiter && redisRateLimiter.store && redisRateLimiter.store.client) {
    try {
        redisRateLimiter.store.client.on('error', (err) => {
            useRedis = false;
            console.error('Redis unavailable, falling back to in-memory rate limiter:', err.message);
        });
        redisRateLimiter.store.client.on('connect', () => {
            useRedis = true;
        });
    } catch (e) {
        useRedis = false;
        console.error('Redis unavailable, falling back to in-memory rate limiter:', e.message);
    }
}
export function getRateLimiter() {
    const usingRedis = (useRedis && redisRateLimiter);
    if (!loggedMode) {
        logger.info("Rate limiter selected", { mode: usingRedis ? "redis" : "memory" });
        loggedMode = true;
    }
    return usingRedis ? redisRateLimiter : memoryRateLimiter;
}

// Usage: import { memoryRateLimiter, redisRateLimiter } and use redisRateLimiter if available, else fallback to memoryRateLimiter.
