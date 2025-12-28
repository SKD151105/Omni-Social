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
    const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query;
    const result = await getAllVideosService({ page, limit, query, sortBy, sortType, userId });
    res.status(200).json(new ApiResponse(200, result, "Videos fetched"));
});

export const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description } = req.body;
    if (!req.user?._id) {
        throw new ApiError(401, "Unauthorized");
    }

    const videoFilePath = req.files?.videoFile?.[0]?.path;
    const thumbnailPath = req.files?.thumbnail?.[0]?.path;
    // Extract duration from video file
    const { getVideoDuration } = await import("../utils/videoMeta.js");
    let duration;
    try {
        duration = await getVideoDuration(videoFilePath);
    } catch (err) {
        throw new ApiError(500, "Failed to extract video duration");
    }

    const video = await publishVideoService({
        ownerId: req.user._id,
        title,
        description,
        duration,
        videoFilePath,
        thumbnailPath,
    });

    res.status(201).json(new ApiResponse(201, video, "Video published"));
});

export const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    const video = await getVideoByIdService({ videoId });
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
