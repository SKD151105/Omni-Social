import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
    createTweetService,
    getUserTweetsService,
    updateTweetService,
    deleteTweetService,
} from "../services/tweet.service.js";

export const createTweet = asyncHandler(async (req, res) => {
    const { content } = req.body;
    if (!req.user?._id) {
        throw new ApiError(401, "Unauthorized");
    }

    const tweet = await createTweetService({ authorId: req.user._id, content });
    res.status(201).json(new ApiResponse(201, tweet, "Tweet created"));
});

export const getUserTweets = asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const tweets = await getUserTweetsService({ userId });
    res.status(200).json(new ApiResponse(200, tweets, "Tweets fetched"));
});

export const updateTweet = asyncHandler(async (req, res) => {
    const { tweetId } = req.params;
    const { content } = req.body;
    if (!req.user?._id) {
        throw new ApiError(401, "Unauthorized");
    }

    const tweet = await updateTweetService({ tweetId, authorId: req.user._id, content });
    res.status(200).json(new ApiResponse(200, tweet, "Tweet updated"));
});

export const deleteTweet = asyncHandler(async (req, res) => {
    const { tweetId } = req.params;
    if (!req.user?._id) {
        throw new ApiError(401, "Unauthorized");
    }

    await deleteTweetService({ tweetId, authorId: req.user._id });
    res.status(200).json(new ApiResponse(200, null, "Tweet deleted"));
});
