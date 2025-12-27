import mongoose from "mongoose";
import { Tweet } from "../models/tweet.model.js";
import { ApiError } from "../utils/ApiError.js";

export const createTweetService = async ({ authorId, content }) => {
    if (!content?.trim()) {
        throw new ApiError(400, "Content is required");
    }

    const tweet = await Tweet.create({ content: content.trim(), author: authorId });
    return tweet;
};

export const getUserTweetsService = async ({ userId }) => {
    if (!mongoose.isValidObjectId(userId)) {
        throw new ApiError(400, "Invalid user id");
    }
    return Tweet.find({ author: userId }).sort({ createdAt: -1 }).lean();
};

export const updateTweetService = async ({ tweetId, authorId, content }) => {
    if (!mongoose.isValidObjectId(tweetId)) {
        throw new ApiError(400, "Invalid tweet id");
    }
    if (!content?.trim()) {
        throw new ApiError(400, "Content is required");
    }

    const tweet = await Tweet.findById(tweetId);
    if (!tweet) {
        throw new ApiError(404, "Tweet not found");
    }
    if (String(tweet.author) !== String(authorId)) {
        throw new ApiError(403, "Not allowed to update this tweet");
    }

    tweet.content = content.trim();
    await tweet.save();
    return tweet;
};

export const deleteTweetService = async ({ tweetId, authorId }) => {
    if (!mongoose.isValidObjectId(tweetId)) {
        throw new ApiError(400, "Invalid tweet id");
    }

    const tweet = await Tweet.findById(tweetId);
    if (!tweet) {
        throw new ApiError(404, "Tweet not found");
    }
    if (String(tweet.author) !== String(authorId)) {
        throw new ApiError(403, "Not allowed to delete this tweet");
    }

    await tweet.deleteOne();
    return true;
};
