import mongoose from "mongoose";
import * as TweetRepo from "../repositories/tweet.repository.js";
import { ApiError } from "../utils/ApiError.js";

export const createTweetService = async ({ authorId, content }) => {
    if (!content?.trim()) {
        throw new ApiError(400, "Content is required");
    }
    return TweetRepo.createTweet({ content: content.trim(), author: authorId });
};

export const getUserTweetsService = async ({ userId }) => {
    if (!mongoose.isValidObjectId(userId)) {
        throw new ApiError(400, "Invalid user id");
    }
    return TweetRepo.findTweetsByUser(userId);
};

export const updateTweetService = async ({ tweetId, authorId, content }) => {
    if (!mongoose.isValidObjectId(tweetId)) {
        throw new ApiError(400, "Invalid tweet id");
    }
    if (!content?.trim()) {
        throw new ApiError(400, "Content is required");
    }
    const tweet = await TweetRepo.findTweetById(tweetId);
    if (!tweet) {
        throw new ApiError(404, "Tweet not found");
    }
    if (String(tweet.author) !== String(authorId)) {
        throw new ApiError(403, "Not allowed to update this tweet");
    }
    return TweetRepo.updateTweetById(tweetId, { content: content.trim() });
};

export const deleteTweetService = async ({ tweetId, authorId }) => {
    if (!mongoose.isValidObjectId(tweetId)) {
        throw new ApiError(400, "Invalid tweet id");
    }
    const tweet = await TweetRepo.findTweetById(tweetId);
    if (!tweet) {
        throw new ApiError(404, "Tweet not found");
    }
    if (String(tweet.author) !== String(authorId)) {
        throw new ApiError(403, "Not allowed to delete this tweet");
    }
    await TweetRepo.deleteTweetById(tweetId);
    return true;
};
