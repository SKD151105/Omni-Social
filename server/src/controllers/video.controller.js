import fs from "fs";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
    getAllVideosService,
    publishVideoService,
    getVideoByIdService,
    updateVideoService,
    deleteVideoService,
    togglePublishStatusService,
} from "../services/video.service.js";

export const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy, sortType, userId, includeUnpublished } = req.query;
    const includeDrafts = String(includeUnpublished).toLowerCase() === "true";
    const result = await getAllVideosService({ page, limit, query, sortBy, sortType, userId, includeUnpublished: includeDrafts, requester: req.user });
    res.status(200).json(new ApiResponse(200, result, "Videos fetched"));
});

export const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description } = req.body;
    if (!req.user?._id) {
        throw new ApiError(401, "Unauthorized");
    }

    const videoFilePath = req.files?.videoFile?.[0]?.path;
    const thumbnailPath = req.files?.thumbnail?.[0]?.path;
    const { uploadOnCloudinary, deleteFromCloudinary } = await import("../utils/cloudinary.js");
    // Helper to safely delete temp files
    const safeUnlink = (filePath) => {
        if (!filePath) return;
        try { fs.unlinkSync(filePath); } catch (_) {}
    };

    let videoUpload = null, thumbUpload = null;
    try {
        videoUpload = await uploadOnCloudinary(videoFilePath, { resource_type: "video" });
        thumbUpload = await uploadOnCloudinary(thumbnailPath);
    } catch (e) {
        safeUnlink(videoFilePath);
        safeUnlink(thumbnailPath);
        throw new ApiError(500, "Failed to upload media");
    }
    if (!videoUpload || !thumbUpload) {
        safeUnlink(videoFilePath);
        safeUnlink(thumbnailPath);
        throw new ApiError(500, "Failed to upload media");
    }
    const duration = videoUpload.duration;

    try {
        const video = await publishVideoService({
            ownerId: req.user._id,
            title,
            description,
            duration,
            videoFilePath: videoUpload.url,
            thumbnailPath: thumbUpload.url,
            videoPublicId: videoUpload.public_id,
            thumbnailPublicId: thumbUpload.public_id,
        });

        res.status(201).json(new ApiResponse(201, video, "Video published"));
    } catch (err) {
        // Clean up remote uploads if DB save fails
        if (videoUpload?.public_id) await deleteFromCloudinary(videoUpload.public_id);
        if (thumbUpload?.public_id) await deleteFromCloudinary(thumbUpload.public_id);
        throw err;
    } finally {
        safeUnlink(videoFilePath);
        safeUnlink(thumbnailPath);
    }
});

export const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    const video = await getVideoByIdService({ videoId, requester: req.user });
    res.status(200).json(new ApiResponse(200, video, "Video fetched"));
});

export const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    const { title, description } = req.body;
    if (!req.user?._id) {
        throw new ApiError(401, "Unauthorized");
    }

    const thumbnailPath = req.files?.thumbnail?.[0]?.path;

    const video = await updateVideoService({ videoId, ownerId: req.user._id, title, description, thumbnailPath });
    res.status(200).json(new ApiResponse(200, video, "Video updated"));
});

export const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    if (!req.user?._id) {
        throw new ApiError(401, "Unauthorized");
    }

    await deleteVideoService({ videoId, ownerId: req.user._id });
    res.status(200).json(new ApiResponse(200, null, "Video deleted"));
});

export const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    if (!req.user?._id) {
        throw new ApiError(401, "Unauthorized");
    }

    const video = await togglePublishStatusService({ videoId, ownerId: req.user._id });
    res.status(200).json(new ApiResponse(200, video, "Publish status updated"));
});
