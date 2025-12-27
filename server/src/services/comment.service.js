import mongoose from "mongoose";
import { Comment } from "../models/comment.model.js";
import { Video } from "../models/video.model.js";
import { ApiError } from "../utils/ApiError.js";

export const getVideoCommentsService = async ({ videoId, page = 1, limit = 10 }) => {
    if (!mongoose.isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video id");
    }

    const videoExists = await Video.exists({ _id: videoId });
    if (!videoExists) {
        throw new ApiError(404, "Video not found");
    }

    const pageNum = Number(page) || 1;
    const limitNum = Math.min(Number(limit) || 10, 50);
    const skip = (pageNum - 1) * limitNum;

    const [items, total] = await Promise.all([
        Comment.find({ video: videoId })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limitNum)
            .populate({ path: "author", select: "username fullName avatar" })
            .lean(),
        Comment.countDocuments({ video: videoId }),
    ]);

    return {
        items,
        page: pageNum,
        total,
        totalPages: Math.ceil(total / limitNum) || 1,
    };
};

export const addCommentService = async ({ videoId, authorId, content }) => {
    if (!mongoose.isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video id");
    }
    if (!content?.trim()) {
        throw new ApiError(400, "Content is required");
    }

    const videoExists = await Video.exists({ _id: videoId });
    if (!videoExists) {
        throw new ApiError(404, "Video not found");
    }

    const comment = await Comment.create({
        content: content.trim(),
        video: videoId,
        author: authorId,
    });

    return Comment.findById(comment._id).populate({ path: "author", select: "username fullName avatar" });
};

export const updateCommentService = async ({ commentId, authorId, content }) => {
    if (!mongoose.isValidObjectId(commentId)) {
        throw new ApiError(400, "Invalid comment id");
    }
    if (!content?.trim()) {
        throw new ApiError(400, "Content is required");
    }

    const comment = await Comment.findById(commentId);
    if (!comment) {
        throw new ApiError(404, "Comment not found");
    }
    if (String(comment.author) !== String(authorId)) {
        throw new ApiError(403, "Not allowed to update this comment");
    }

    comment.content = content.trim();
    await comment.save();

    return Comment.findById(comment._id).populate({ path: "author", select: "username fullName avatar" });
};

export const deleteCommentService = async ({ commentId, authorId }) => {
    if (!mongoose.isValidObjectId(commentId)) {
        throw new ApiError(400, "Invalid comment id");
    }

    const comment = await Comment.findById(commentId);
    if (!comment) {
        throw new ApiError(404, "Comment not found");
    }
    if (String(comment.author) !== String(authorId)) {
        throw new ApiError(403, "Not allowed to delete this comment");
    }

    await comment.deleteOne();
    return true;
};
