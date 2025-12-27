import mongoose from "mongoose";
import { Video } from "../models/video.model.js";
import { Like } from "../models/like.model.js";
import { Subscription } from "../models/subscription.model.js";
import { Playlist } from "../models/playlist.model.js";
import { Comment } from "../models/comment.model.js";
import { Tweet } from "../models/tweet.model.js";
import { ApiError } from "../utils/ApiError.js";

const ensureUserId = (userId) => {
    if (!mongoose.isValidObjectId(userId)) {
        throw new ApiError(400, "Invalid user id");
    }
};

export const getDashboardService = async ({ userId }) => {
    ensureUserId(userId);

    // Fetch basic aggregates in parallel
    const [
        videos,
        subscriberCount,
        subscriptionCount,
        playlistCount,
        commentCount,
        tweetCount,
        likedVideosCount,
    ] = await Promise.all([
        Video.find({ owner: userId }).select("_id views createdAt title thumbnail isPublished").lean(),
        Subscription.countDocuments({ channel: userId }),
        Subscription.countDocuments({ subscriber: userId }),
        Playlist.countDocuments({ owner: userId }),
        Comment.countDocuments({ author: userId }),
        Tweet.countDocuments({ author: userId }),
        Like.countDocuments({ targetType: "Video", likedBy: userId }),
    ]);

    const videoIds = videos.map(v => v._id);
    const totalVideos = videos.length;
    const totalViews = videos.reduce((sum, v) => sum + (v.views || 0), 0);
    const totalLikes = videoIds.length
        ? await Like.countDocuments({ targetType: "Video", target: { $in: videoIds } })
        : 0;

    const recentVideos = videos
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 5);

    const recentTweets = await Tweet.find({ author: userId })
        .sort({ createdAt: -1 })
        .limit(5)
        .lean();

    const recentPlaylists = await Playlist.find({ owner: userId })
        .sort({ createdAt: -1 })
        .limit(3)
        .select("name description createdAt")
        .lean();

    return {
        summary: {
            totalVideos,
            totalViews,
            totalLikes,
            subscriberCount,
            subscriptionCount,
            playlistCount,
            commentCount,
            tweetCount,
            likedVideosCount,
        },
        recent: {
            videos: recentVideos,
            tweets: recentTweets,
            playlists: recentPlaylists,
        },
    };
};
