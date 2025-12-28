import mongoose from "mongoose";
import * as CommentRepo from "../repositories/comment.repository.js";
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
        CommentRepo.findCommentsByVideo(videoId, { skip, limit: limitNum }),
        CommentRepo.countCommentsByVideo(videoId),
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

    const comment = await CommentRepo.createComment({
        content: content.trim(),
        video: videoId,
        author: authorId,
    });
    return CommentRepo.findCommentById(comment._id);
};

export const updateCommentService = async ({ commentId, authorId, content }) => {
    if (!mongoose.isValidObjectId(commentId)) {
        throw new ApiError(400, "Invalid comment id");
    }
    if (!content?.trim()) {
        throw new ApiError(400, "Content is required");
    }

    const comment = await CommentRepo.findCommentById(commentId);
    if (!comment) {
        throw new ApiError(404, "Comment not found");
    }
    if (String(comment.author) !== String(authorId)) {
        throw new ApiError(403, "Not allowed to update this comment");
    }

    const updated = await CommentRepo.updateCommentById(commentId, { content: content.trim() });
    return CommentRepo.findCommentById(updated._id);
};

export const deleteCommentService = async ({ commentId, authorId }) => {
    if (!mongoose.isValidObjectId(commentId)) {
        throw new ApiError(400, "Invalid comment id");
    }

    const comment = await CommentRepo.findCommentById(commentId);
    if (!comment) {
        throw new ApiError(404, "Comment not found");
    }
    if (String(comment.author) !== String(authorId)) {
        throw new ApiError(403, "Not allowed to delete this comment");
    }

    await CommentRepo.deleteCommentById(commentId);
    return true;
};
