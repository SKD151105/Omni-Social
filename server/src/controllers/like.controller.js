import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
    toggleVideoLikeService,
    toggleCommentLikeService,
    toggleTweetLikeService,
    getLikedVideosService,
} from "../services/like.service.js";

export const toggleVideoLike = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    if (!req.user?._id) {
        throw new ApiError(401, "Unauthorized");
    }

    const result = await toggleVideoLikeService({ videoId, userId: req.user._id });
    res.status(200).json(new ApiResponse(200, result, result.liked ? "Liked" : "Unliked"));
});

export const toggleCommentLike = asyncHandler(async (req, res) => {
    const { commentId } = req.params;
    if (!req.user?._id) {
        throw new ApiError(401, "Unauthorized");
    }

    const result = await toggleCommentLikeService({ commentId, userId: req.user._id });
    res.status(200).json(new ApiResponse(200, result, result.liked ? "Liked" : "Unliked"));
});

export const toggleTweetLike = asyncHandler(async (req, res) => {
    const { tweetId } = req.params;
    if (!req.user?._id) {
        throw new ApiError(401, "Unauthorized");
    }

    const result = await toggleTweetLikeService({ tweetId, userId: req.user._id });
    res.status(200).json(new ApiResponse(200, result, result.liked ? "Liked" : "Unliked"));
});

export const getLikedVideos = asyncHandler(async (req, res) => {
    if (!req.user?._id) {
        throw new ApiError(401, "Unauthorized");
    }

    const videos = await getLikedVideosService({ userId: req.user._id });
    res.status(200).json(new ApiResponse(200, videos, "Liked videos fetched"));
});
