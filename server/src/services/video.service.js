import mongoose from "mongoose";
import { Video } from "../models/video.model.js";
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
        Video.find(filter)
            .sort(sort)
            .skip(skip)
            .limit(limitNum)
            .lean(),
        Video.countDocuments(filter),
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
        throw new ApiError(400, "title, description, duration, video file and thumbnail are required");
    }

    const videoUpload = await uploadOnCloudinary(videoFilePath);
    const thumbUpload = await uploadOnCloudinary(thumbnailPath);

    if (!videoUpload || !thumbUpload) {
        throw new ApiError(500, "Failed to upload media");
    }

    const video = await Video.create({
        title: title.trim(),
        description: description.trim(),
        duration: Number(duration),
        videoFile: videoUpload.url,
        thumbnail: thumbUpload.url,
        owner: ownerId,
    });

    return video;
};

export const getVideoByIdService = async ({ videoId }) => {
    ensureId(videoId, "video");
    const video = await Video.findById(videoId).populate({ path: "owner", select: "username fullName avatar" });
    if (!video) {
        throw new ApiError(404, "Video not found");
    }
    return video;
};

export const updateVideoService = async ({ videoId, ownerId, title, description, thumbnailPath }) => {
    ensureId(videoId, "video");
    const video = await Video.findById(videoId);
    if (!video) {
        throw new ApiError(404, "Video not found");
    }
    if (String(video.owner) !== String(ownerId)) {
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
    const video = await Video.findById(videoId);
    if (!video) {
        throw new ApiError(404, "Video not found");
    }
    if (String(video.owner) !== String(ownerId)) {
        throw new ApiError(403, "Not allowed to delete this video");
    }

    await video.deleteOne();
    return true;
};

export const togglePublishStatusService = async ({ videoId, ownerId }) => {
    ensureId(videoId, "video");
    const video = await Video.findById(videoId);
    if (!video) {
        throw new ApiError(404, "Video not found");
    }
    if (String(video.owner) !== String(ownerId)) {
        throw new ApiError(403, "Not allowed to update this video");
    }

    video.isPublished = !video.isPublished;
    await video.save();
    return video;
};
