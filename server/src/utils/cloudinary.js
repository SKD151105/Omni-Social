import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';
import { logger } from './logger.js';

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const uploadOnCloudinary = async (localFilePath, options = {}) => {
    if (!localFilePath) return null;

    const opts = { resource_type: 'auto', ...options };
    try {
        const response = await cloudinary.uploader.upload(localFilePath, opts);
        fs.unlinkSync(localFilePath); // remove temp file after successful upload
        return response;
    } catch (error) {
        logger.error("Cloudinary upload failed", { localFilePath, error: error?.message });
        try { fs.unlinkSync(localFilePath); } catch (_) {}
        return null;
    }
};

export const deleteFromCloudinary = async (publicId) => {
    if (!publicId) return;
    try {
        await cloudinary.uploader.destroy(publicId);
    } catch (error) {
        logger.error("Cloudinary delete failed", { publicId, error: error?.message });
    }
};