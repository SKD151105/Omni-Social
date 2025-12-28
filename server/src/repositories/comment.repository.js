import { Comment } from "../models/comment.model.js";

export const findCommentsByVideo = async (videoId, options = {}) => {
    return Comment.find({ video: videoId }, null, options)
        .sort({ createdAt: -1 })
        .populate({ path: "author", select: "username fullName avatar" })
        .lean();
};

export const countCommentsByVideo = async (videoId) => {
    return Comment.countDocuments({ video: videoId });
};

export const createComment = async (data) => {
    return Comment.create(data);
};

export const findCommentById = async (id) => {
    return Comment.findById(id).populate({ path: "author", select: "username fullName avatar" });
};

export const updateCommentById = async (id, update, options = {}) => {
    return Comment.findByIdAndUpdate(id, update, { new: true, ...options });
};

export const deleteCommentById = async (id) => {
    return Comment.findByIdAndDelete(id);
};
