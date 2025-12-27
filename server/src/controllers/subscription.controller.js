import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
    toggleSubscriptionService,
    getUserChannelSubscribersService,
    getSubscribedChannelsService,
} from "../services/subscription.service.js";

export const toggleSubscription = asyncHandler(async (req, res) => {
    const { channelId } = req.params;
    if (!req.user?._id) {
        throw new ApiError(401, "Unauthorized");
    }

    const result = await toggleSubscriptionService({ channelId, subscriberId: req.user._id });
    res.status(200).json(new ApiResponse(200, result, result.subscribed ? "Subscribed" : "Unsubscribed"));
});

export const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const { channelId } = req.params;
    const subscribers = await getUserChannelSubscribersService({ channelId });
    res.status(200).json(new ApiResponse(200, subscribers, "Subscribers fetched"));
});

export const getSubscribedChannels = asyncHandler(async (req, res) => {
    const { subscriberId } = req.params;
    const channels = await getSubscribedChannelsService({ subscriberId });
    res.status(200).json(new ApiResponse(200, channels, "Subscribed channels fetched"));
});
