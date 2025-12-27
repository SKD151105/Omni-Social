import mongoose from "mongoose";
import { Like } from "../models/like.model.js";
import { Video } from "../models/video.model.js";
import { Comment } from "../models/comment.model.js";
import { Tweet } from "../models/tweet.model.js";
import { ApiError } from "../utils/ApiError.js";

const ensureObjectId = (id, label) => {
    if (!mongoose.isValidObjectId(id)) {
        throw new ApiError(400, `Invalid ${label} id`);
    }
};

const toggleLike = async ({ targetId, targetType, userId, model }) => {
    ensureObjectId(targetId, targetType.toLowerCase());
    const exists = await model.exists({ _id: targetId });
    if (!exists) {
        throw new ApiError(404, `${targetType} not found`);
    }

    const existing = await Like.findOne({ targetType, target: targetId, likedBy: userId });
    if (existing) {
        await existing.deleteOne();
        return { liked: false };
    }

    await Like.create({ targetType, target: targetId, likedBy: userId });
    return { liked: true };
};

export const toggleVideoLikeService = async ({ videoId, userId }) =>
    toggleLike({ targetId: videoId, targetType: "Video", userId, model: Video });

export const toggleCommentLikeService = async ({ commentId, userId }) =>
    toggleLike({ targetId: commentId, targetType: "Comment", userId, model: Comment });

export const toggleTweetLikeService = async ({ tweetId, userId }) =>
    toggleLike({ targetId: tweetId, targetType: "Tweet", userId, model: Tweet });

export const getLikedVideosService = async ({ userId }) => {
    const likes = await Like.find({ likedBy: userId, targetType: "Video" })
        .populate({ path: "target", model: Video, select: "title thumbnail owner views isPublished" })
        .lean();

    const videos = likes
        .map(like => like.target)
        .filter(Boolean);

    return videos;
};
