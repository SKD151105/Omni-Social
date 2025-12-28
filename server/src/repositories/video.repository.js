import { Video } from "../models/video.model.js";
import mongoose from "mongoose";

export const findAllVideos = async (filter = {}, options = {}) => {
    return Video.find(filter, null, options).lean();
};

export const countVideos = async (filter = {}) => {
    return Video.countDocuments(filter);
};

export const findVideoById = async (id) => {
    return Video.findById(id);
};

export const createVideo = async (data) => {
    return Video.create(data);
};

export const updateVideoById = async (id, update, options = {}) => {
    return Video.findByIdAndUpdate(id, update, { new: true, ...options });
};

export const deleteVideoById = async (id) => {
    return Video.findByIdAndDelete(id);
};

export const togglePublishStatus = async (id, isPublished) => {
    return Video.findByIdAndUpdate(id, { isPublished }, { new: true });
};
