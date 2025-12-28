import mongoose from "mongoose";
import * as VideoRepo from "../repositories/video.repository.js";
import { ApiError } from "../utils/ApiError.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

const ensureId = (id, label) => {
    if (!mongoose.isValidObjectId(id)) {
        throw new ApiError(400, `Invalid ${label} id`);
    }
};

export const getAllVideosService = async ({ page = 1, limit = 10, query, sortBy = "createdAt", sortType = "desc", userId }) => {
    const pageNum = Number(page) || 1;
    const limitNum = Math.min(Number(limit) || 10, 50);
    const skip = (pageNum - 1) * limitNum;

    const filter = {};
    if (query?.trim()) {
        filter.$or = [
            { title: { $regex: query.trim(), $options: "i" } },
            { description: { $regex: query.trim(), $options: "i" } },
        ];
    }
    if (userId) {
        ensureId(userId, "user");
        filter.owner = userId;
    } else {
        filter.isPublished = true;
    }

    const sortDir = sortType === "asc" ? 1 : -1;
    const sort = { [sortBy]: sortDir };

    const [items, total] = await Promise.all([
        VideoRepo.findAllVideos(filter, { sort, skip, limit: limitNum }),
        VideoRepo.countVideos(filter),
    ]);
    return {
        items,
        page: pageNum,
        total,
        totalPages: Math.ceil(total / limitNum) || 1,
    };
};

export const publishVideoService = async ({ ownerId, title, description, duration, videoFilePath, thumbnailPath }) => {
    if (![title, description, duration, videoFilePath, thumbnailPath].every(Boolean)) {
        throw new ApiError(400, "title, description, video file, thumbnail, and extracted duration are required");
    }
    try {
        return await VideoRepo.createVideo({
            title: title.trim(),
            description: description.trim(),
            duration: Number(duration),
            videoFile: videoFilePath,
            thumbnail: thumbnailPath,
            owner: ownerId,
        });
    } catch (err) {
        throw err;
    }
};

export const getVideoByIdService = async ({ videoId }) => {
    ensureId(videoId, "video");
    const video = await VideoRepo.findVideoById(videoId);
    // Populate owner if needed (can be handled in repo if preferred)
    if (video && video.populate) {
        await video.populate({ path: "owner", select: "username fullName avatar" });
    }
    if (!video) {
        throw new ApiError(404, "Video not found");
    }
    return video;
};

export const updateVideoService = async ({ videoId, ownerId, title, description, thumbnailPath }) => {
    ensureId(videoId, "video");
    const video = await VideoRepo.findVideoById(videoId);
    if (!video) {
        throw new ApiError(404, "Video not found");
    }
    if (String(video.owner?._id || video.owner) !== String(ownerId)) {
        throw new ApiError(403, "Not allowed to update this video");
    }

    if (title?.trim()) video.title = title.trim();
    if (description?.trim()) video.description = description.trim();

    if (thumbnailPath) {
        const thumbUpload = await uploadOnCloudinary(thumbnailPath);
        if (!thumbUpload) {
            throw new ApiError(500, "Failed to upload thumbnail");
        }
        video.thumbnail = thumbUpload.url;
    }

    await video.save();
    return video;
};

export const deleteVideoService = async ({ videoId, ownerId }) => {
    ensureId(videoId, "video");
    const video = await VideoRepo.findVideoById(videoId);
    if (!video) {
        throw new ApiError(404, "Video not found");
    }
    if (String(video.owner?._id || video.owner) !== String(ownerId)) {
        throw new ApiError(403, "Not allowed to delete this video");
    }

    await VideoRepo.deleteVideoById(videoId);
    return true;
};

export const togglePublishStatusService = async ({ videoId, ownerId }) => {
    ensureId(videoId, "video");
    const video = await VideoRepo.findVideoById(videoId);
    if (!video) {
        throw new ApiError(404, "Video not found");
    }
    if (String(video.owner?._id || video.owner) !== String(ownerId)) {
        throw new ApiError(403, "Not allowed to update this video");
    }

    const updated = await VideoRepo.togglePublishStatus(videoId, !video.isPublished);
    return updated;
};
