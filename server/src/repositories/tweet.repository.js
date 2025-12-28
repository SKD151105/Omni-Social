import { Tweet } from "../models/tweet.model.js";

export const createTweet = async (data) => {
    return Tweet.create(data);
};

export const findTweetsByUser = async (userId) => {
    return Tweet.find({ author: userId }).sort({ createdAt: -1 }).lean();
};

export const findTweetById = async (id) => {
    return Tweet.findById(id);
};

export const updateTweetById = async (id, update, options = {}) => {
    return Tweet.findByIdAndUpdate(id, update, { new: true, ...options });
};

export const deleteTweetById = async (id) => {
    return Tweet.findByIdAndDelete(id);
};
