import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
    getVideoCommentsService,
    addCommentService,
    updateCommentService,
    deleteCommentService,
} from "../services/comment.service.js";

export const getVideoComments = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const result = await getVideoCommentsService({ videoId, page, limit });
    res.status(200).json(new ApiResponse(200, result, "Comments fetched"));
});

export const addComment = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    const { content } = req.body;
    if (!req.user?._id) {
        throw new ApiError(401, "Unauthorized");
    }

    const comment = await addCommentService({ videoId, authorId: req.user._id, content });
    res.status(201).json(new ApiResponse(201, comment, "Comment added"));
});

export const updateComment = asyncHandler(async (req, res) => {
    const { commentId } = req.params;
    const { content } = req.body;
    if (!req.user?._id) {
        throw new ApiError(401, "Unauthorized");
    }

    const updated = await updateCommentService({ commentId, authorId: req.user._id, content });
    res.status(200).json(new ApiResponse(200, updated, "Comment updated"));
});

export const deleteComment = asyncHandler(async (req, res) => {
    const { commentId } = req.params;
    if (!req.user?._id) {
        throw new ApiError(401, "Unauthorized");
    }

    await deleteCommentService({ commentId, authorId: req.user._id });
    res.status(200).json(new ApiResponse(200, null, "Comment deleted"));
});
