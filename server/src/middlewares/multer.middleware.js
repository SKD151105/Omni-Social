import multer from "multer";
import crypto from "crypto";
import fs from "fs";
import path from "path";

const MAX_MB = Number(process.env.FILE_UPLOAD_MAX_MB) || 200; // keep generous for video uploads
const MAX_BYTES = MAX_MB * 1024 * 1024;
const TEMP_DIR = path.join(process.cwd(), "public", "temp");

// Ensure temp directory exists
if (!fs.existsSync(TEMP_DIR)) {
    fs.mkdirSync(TEMP_DIR, { recursive: true });
}

const storage = multer.diskStorage({
    destination: function (_req, _file, cb) {
        cb(null, TEMP_DIR);
    },
    filename: function (req, file, cb) {
        const ext = file.originalname.split('.').pop();
        const uniqueSuffix = Date.now() + '-' + crypto.randomBytes(6).toString('hex');
        const safeBase = file.originalname.replace(/[^a-zA-Z0-9-_]/g, '').split('.')[0];
        cb(null, `${safeBase}-${uniqueSuffix}.${ext}`);
    }
});

const allowedMime = /^(image|video)\//i;

export const upload = multer({
    storage,
    limits: { fileSize: MAX_BYTES },
    fileFilter: (_req, file, cb) => {
        if (!file.mimetype || !allowedMime.test(file.mimetype)) {
            return cb(new Error("Unsupported file type"));
        }
        cb(null, true);
    },
});