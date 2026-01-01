import mongoose from "mongoose";
import { Video } from "../models/video.model.js";
import { Subscription } from "../models/subscription.model.js";
import { Like } from "../models/like.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";

export const getChannelStatsService = async ({ channelId }) => {
    if (!mongoose.isValidObjectId(channelId)) {
        throw new ApiError(400, "Invalid channel id");
    }

    const channelExists = await User.exists({ _id: channelId });
    if (!channelExists) {
        throw new ApiError(404, "Channel not found");
    }

    const [videos, subscriberCount] = await Promise.all([
        Video.find({ owner: channelId }).select("_id views"),
        Subscription.countDocuments({ channel: channelId }),
    ]);

    const videoIds = videos.map(v => v._id);
    const totalVideos = videos.length;
    const totalViews = videos.reduce((sum, v) => sum + (v.views || 0), 0);

    const totalLikes = videoIds.length
        ? await Like.countDocuments({ targetType: "Video", target: { $in: videoIds } })
        : 0;

    return { totalVideos, totalViews, subscriberCount, totalLikes };
};

export const getChannelVideosService = async ({ channelId, page = 1, limit = 10 }) => {
    if (!mongoose.isValidObjectId(channelId)) {
        throw new ApiError(400, "Invalid channel id");
    }

    const channelExists = await User.exists({ _id: channelId });
    if (!channelExists) {
        throw new ApiError(404, "Channel not found");
    }

    const pageNum = Number(page) || 1;
    const limitNum = Math.min(Number(limit) || 10, 50);
    const skip = (pageNum - 1) * limitNum;

    const [items, total] = await Promise.all([
        Video.find({ owner: channelId })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limitNum)
            .lean(),
        Video.countDocuments({ owner: channelId }),
    ]);

    return {
        items,
        page: pageNum,
        total,
        totalPages: Math.ceil(total / limitNum) || 1,
    };
};
