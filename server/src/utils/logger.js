const levels = ["error", "warn", "info", "debug"];

const configured = process.env.LOG_LEVEL || "info";
const threshold = levels.indexOf(configured) >= 0 ? levels.indexOf(configured) : levels.indexOf("info");

function log(level, message, meta) {
    const idx = levels.indexOf(level);
    if (idx < 0 || idx > threshold) return;
    const ts = new Date().toISOString();
    const base = `${ts} [${level.toUpperCase()}] ${message}`;
    if (meta) {
        console[level] ? console[level](base, meta) : console.log(base, meta);
    } else {
        console[level] ? console[level](base) : console.log(base);
    }
}

export const logger = {
    error: (msg, meta) => log("error", msg, meta),
    warn: (msg, meta) => log("warn", msg, meta),
    info: (msg, meta) => log("info", msg, meta),
    debug: (msg, meta) => log("debug", msg, meta),
};
