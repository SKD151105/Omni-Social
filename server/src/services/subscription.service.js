import mongoose from "mongoose";
import { Subscription } from "../models/subscription.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";

const ensureId = (id, label) => {
    if (!mongoose.isValidObjectId(id)) {
        throw new ApiError(400, `Invalid ${label} id`);
    }
};

export const toggleSubscriptionService = async ({ channelId, subscriberId }) => {
    ensureId(channelId, "channel");
    if (String(channelId) === String(subscriberId)) {
        throw new ApiError(400, "Cannot subscribe to yourself");
    }

    const channelExists = await User.exists({ _id: channelId });
    if (!channelExists) {
        throw new ApiError(404, "Channel not found");
    }

    const existing = await Subscription.findOne({ channel: channelId, subscriber: subscriberId });
    if (existing) {
        await existing.deleteOne();
        return { subscribed: false };
    }

    await Subscription.create({ channel: channelId, subscriber: subscriberId });
    return { subscribed: true };
};

export const getUserChannelSubscribersService = async ({ channelId }) => {
    ensureId(channelId, "channel");
    const subs = await Subscription.find({ channel: channelId })
        .populate({ path: "subscriber", select: "username fullName avatar" })
        .lean();

    return subs.map(s => s.subscriber).filter(Boolean);
};

export const getSubscribedChannelsService = async ({ subscriberId }) => {
    ensureId(subscriberId, "subscriber");
    const subs = await Subscription.find({ subscriber: subscriberId })
        .populate({ path: "channel", select: "username fullName avatar" })
        .lean();

    return subs.map(s => s.channel).filter(Boolean);
};
