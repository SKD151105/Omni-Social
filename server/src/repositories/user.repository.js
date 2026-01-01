import mongoose from "mongoose";
import { User } from "../models/user.model.js";

const toObjectId = (value) => new mongoose.Types.ObjectId(value);

export const findByEmailOrUsername = async ({ email, username }) => {
    const query = [];
    if (email) query.push({ email });
    if (username) query.push({ username });
    if (!query.length) return null;
    return User.findOne({ $or: query });
};

export const createUser = async (data) => User.create(data);

export const findById = async (id, projection) => User.findById(id).select(projection);

export const findByRefreshTokenId = async (refreshTokenId) => User.findOne({ refreshTokenId });

export const saveRefreshToken = async (user, { tokenHash, tokenId }) => {
    user.refreshTokenHash = tokenHash;
    user.refreshTokenId = tokenId;
    return user.save({ validateBeforeSave: false });
};

export const clearRefreshToken = async (user) => {
    user.refreshTokenHash = undefined;
    user.refreshTokenId = undefined;
    return user.save({ validateBeforeSave: false });
};

export const saveUser = async (user, options = {}) => user.save(options);

export const findByEmailExcludingId = async (email, excludeId) =>
    User.findOne({ email, _id: { $ne: excludeId } });

export const aggregateChannelProfile = async ({ username, subscriberId }) => {
    const subscriberObjectId = subscriberId ? toObjectId(subscriberId) : null;

    return User.aggregate([
        { $match: { username } },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "channel",
                as: "subscribers",
            },
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "subscriber",
                as: "subscriptions",
            },
        },
        {
            $addFields: {
                subscriberCount: { $size: "$subscribers" },
                subscriptionCount: { $size: "$subscriptions" },
                isSubscribed: {
                    $cond: {
                        if: { $in: [subscriberObjectId, "$subscribers.subscriber"] },
                        then: true,
                        else: false,
                    },
                },
            },
        },
        {
            $project: {
                fullName: 1,
                username: 1,
                subscriberCount: 1,
                subscriptionCount: 1,
                isSubscribed: 1,
                avatar: 1,
                coverImage: 1,
                email: 1,
            },
        },
    ]);
};

export const aggregateWatchHistory = async (userId) => {
    const objectId = toObjectId(userId);

    return User.aggregate([
        {
            $match: { _id: objectId },
        },
        {
            $lookup: {
                from: "videos",
                localField: "watchHistory",
                foreignField: "_id",
                as: "watchedHistory",
                pipeline: [
                    {
                        $lookup: {
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "owner",
                            pipeline: [
                                {
                                    $project: {
                                        fullName: 1,
                                        username: 1,
                                        avatar: 1,
                                    },
                                },
                            ],
                        },
                    },
                    {
                        $addFields: {
                            owner: { $first: "$owner" },
                        },
                    },
                ],
            },
        },
    ]);
};
