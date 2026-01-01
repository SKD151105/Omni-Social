import mongoose from "mongoose";
import * as VideoRepo from "../repositories/video.repository.js";
import { ApiError } from "../utils/ApiError.js";
import { uploadOnCloudinary, deleteFromCloudinary } from "../utils/cloudinary.js";
import { User } from "../models/user.model.js";

const ensureId = (id, label) => {
    if (!mongoose.isValidObjectId(id)) {
        throw new ApiError(400, `Invalid ${label} id`);
    }
};

export const getAllVideosService = async ({ page = 1, limit = 10, query, sortBy = "createdAt", sortType = "desc", userId, includeUnpublished = false, requester }) => {
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
    }

    const isOwner = requester && userId && String(requester._id) === String(userId);
    const isAdmin = requester?.role === "admin";
    const allowUnpublished = includeUnpublished && (isOwner || isAdmin);

    if (!allowUnpublished) {
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

export const publishVideoService = async ({ ownerId, title, description, duration, videoFilePath, thumbnailPath, videoPublicId, thumbnailPublicId }) => {
    if (![title, description, duration, videoFilePath, thumbnailPath].every(Boolean)) {
        throw new ApiError(400, "title, description, video file, thumbnail, and extracted duration are required");
    }
    try {
        return await VideoRepo.createVideo({
            title: title.trim(),
            description: description.trim(),
            duration: Number(duration),
            videoFile: videoFilePath,
            videoPublicId,
            thumbnail: thumbnailPath,
            thumbnailPublicId,
            owner: ownerId,
        });
    } catch (err) {
        throw err;
    }
};

export const getVideoByIdService = async ({ videoId, requester }) => {
    ensureId(videoId, "video");
    const video = await VideoRepo.findVideoById(videoId);
    if (!video) {
        throw new ApiError(404, "Video not found");
    }

    // Enforce publish visibility: allow owners/admins to view drafts
    const isOwner = requester && String(video.owner?._id || video.owner) === String(requester._id);
    const isAdmin = requester?.role === "admin";
    if (!video.isPublished && !isOwner && !isAdmin) {
        throw new ApiError(403, "Video is not published");
    }

    // Populate owner if needed (can be handled in repo if preferred)
    if (video.populate) {
        await video.populate({ path: "owner", select: "username fullName avatar" });
    }

    // Record watch history for authenticated users when they view a video they can access
    if (requester?._id) {
        await User.updateOne(
            { _id: requester._id },
            { $addToSet: { watchHistory: video._id } }
        );
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
        if (video.thumbnailPublicId) {
            await deleteFromCloudinary(video.thumbnailPublicId);
        }
        video.thumbnail = thumbUpload.url;
        video.thumbnailPublicId = thumbUpload.public_id;
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

    if (video.videoPublicId) {
        await deleteFromCloudinary(video.videoPublicId);
    }
    if (video.thumbnailPublicId) {
        await deleteFromCloudinary(video.thumbnailPublicId);
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
