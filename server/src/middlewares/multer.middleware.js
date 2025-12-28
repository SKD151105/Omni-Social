import multer from "multer";


import crypto from "crypto";

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, "./public/temp");
    },
    filename: function (req, file, cb) {
        const ext = file.originalname.split('.').pop();
        const uniqueSuffix = Date.now() + '-' + crypto.randomBytes(6).toString('hex');
        const safeBase = file.originalname.replace(/[^a-zA-Z0-9-_]/g, '').split('.')[0];
        cb(null, `${safeBase}-${uniqueSuffix}.${ext}`);
    }
});

export const upload = multer({ storage: storage });