import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { getChannelStatsService, getChannelVideosService } from "../services/channel.service.js";

export const getChannelStats = asyncHandler(async (req, res) => {
    const { channelId } = req.params;
    if (!channelId) {
        throw new ApiError(400, "channelId is required");
    }
    const stats = await getChannelStatsService({ channelId });
    res.status(200).json(new ApiResponse(200, stats, "Channel stats fetched"));
});

export const getChannelVideos = asyncHandler(async (req, res) => {
    const { channelId } = req.params;
    const { page = 1, limit = 10 } = req.query;
    if (!channelId) {
        throw new ApiError(400, "channelId is required");
    }

    const result = await getChannelVideosService({ channelId, page, limit });
    res.status(200).json(new ApiResponse(200, result, "Channel videos fetched"));
});
