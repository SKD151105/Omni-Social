import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary, deleteFromCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";
import fs from "fs";
import mongoose from "mongoose";

// Helper to generate fresh tokens for a user
const generateAuthTokens = (user) => {
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();
    return { accessToken, refreshToken };
};

// Best-effort local file cleanup (temp uploads)
const safeUnlink = (filePath) => {
    if (!filePath) return;
    try {
        fs.unlinkSync(filePath);
    } catch (_err) {
        // swallow cleanup errors
    }
};

// Either export at the end or inline (but do it everywhere consistently)
// export const registerUser = asyncHandler(async (req, res) => {
const registerUser = asyncHandler(async (req, res) => {
    // BREAK THE BUSINESS LOGIC INTO STEPS:

    // 1. take user data from req.body (from frontend)
    const usernameNormalized = req.body?.username?.trim().toLowerCase();
    const emailNormalized = req.body?.email?.trim().toLowerCase();
    const fullName = req.body?.fullName?.trim();
    const password = req.body?.password;
    console.log("Registering user:", { fullName, email: emailNormalized });

    // 2. validate the data - not empty, valid email, strong password, etc.
    if ([fullName, emailNormalized, usernameNormalized, password].some(field => !field || field?.trim() === "")) {
        throw new ApiError(400, "All fields are required");
    }

    // 3. check if user with the same email/username already exists (check with both username and email)
    const existedUser = await User.findOne({
        $or: [{ email: emailNormalized }, { username: usernameNormalized }]
    })

    if (existedUser) {
        throw new ApiError(409, "User with the same email or username already exists");
    }

    // 4. check for images (avatar) in req.files
    const avatarLocalPath = req.files?.avatar?.[0]?.path;
    const coverImageLocalPath = req.files?.coverImage?.[0]?.path;

    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar image is required");
    }

    try {
        // 5. upload them to cloudinary and get the URLs
        const avatarUpload = await uploadOnCloudinary(avatarLocalPath);
        let coverImageUpload;
        if (coverImageLocalPath) {
            coverImageUpload = await uploadOnCloudinary(coverImageLocalPath);
        }

        if (!avatarUpload) {
            throw new ApiError(500, "Failed to upload avatar image");
        }

        // 6. create a new user object and save to DB
        const user = await User.create({
            username: usernameNormalized,
            email: emailNormalized,
            fullName,
            password,
            avatar: avatarUpload.url,
            avatarId: avatarUpload.public_id,
            coverImage: coverImageUpload?.url || "",
            coverImageId: coverImageUpload?.public_id || ""
        });

        // 7. respond with success message (without password and refresh token fields) or errors
        const savedUser = await User.findById(user._id).select("-password -refreshToken");

        if (!savedUser) {
            throw new ApiError(500, "Failed to register user");
        }

        res.status(201).json(new ApiResponse(201, savedUser, "User registered successfully"));
    } finally {
        // Ensure temp files are removed even if validation/upload fails
        safeUnlink(avatarLocalPath);
        safeUnlink(coverImageLocalPath);
    }

    // Use this for testing route setup when no Business logic is present yet
    // res.status(201).json({
    //     message: "User registered successfully"
    // });
});

const loginUser = asyncHandler(async (req, res) => {
    // 1) Extract and normalize credentials
    const emailInput = req.body?.email?.trim().toLowerCase();
    const usernameInput = req.body?.username?.trim().toLowerCase();
    const { password } = req.body;

    // 2) Validate required fields
    if ((!emailInput && !usernameInput) || !password?.trim()) {
        throw new ApiError(400, "Username/email and password are required");
    }

    // 3) Look up user by username OR email
    const query = [];
    if (emailInput) query.push({ email: emailInput });
    if (usernameInput) query.push({ username: usernameInput });

    const user = await User.findOne({ $or: query });
    if (!user) {
        throw new ApiError(404, "User not found");
    }

    // 4) Verify password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
        throw new ApiError(401, "Invalid credentials");
    }

    // 5) Generate tokens
    const { accessToken, refreshToken } = generateAuthTokens(user);

    // 6) Persist refresh token
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    // 7) Prepare safe user object
    const safeUser = await User.findById(user._id).select("-password -refreshToken");

    // 8) Set refresh token cookie and respond with access token + user
    const cookieOptions = {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
    };

    // 9) Send response
    res
        .status(200)
        .cookie("refreshToken", refreshToken, cookieOptions)
        .json(new ApiResponse(200, { user: safeUser, accessToken }, "User logged in successfully"));
});

const logoutUser = asyncHandler(async (req, res) => {
    const refreshToken = req.cookies?.refreshToken;

    if (!refreshToken) {
        throw new ApiError(400, "Refresh token not found");
    }

    // Find the user with this refresh token
    const user = await User.findOne({ refreshToken });
    if (!user) {
        // Even if not found, clear cookie to force re-login
        return res
            .status(200)
            .clearCookie("refreshToken", {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: "lax",
            })
            .json(new ApiResponse(200, null, "Logged out"));
    }

    // Enforce ownership when request is authenticated: the token must belong to the current user
    if (req.user && String(req.user._id) !== String(user._id)) {
        throw new ApiError(403, "Token does not belong to this user");
    }

    // Invalidate stored refresh token
    user.refreshToken = undefined;
    await user.save({ validateBeforeSave: false });

    // Clear cookie and respond
    res
        .status(200)
        .clearCookie("refreshToken", {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
        })
        .json(new ApiResponse(200, null, "Logged out"));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
    const incomingRefreshToken = req.cookies?.refreshToken || req.body?.refreshToken;

    if (!incomingRefreshToken) {
        throw new ApiError(400, "Refresh token not found");
    }

    try {
        const decoded = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET);
        const user = await User.findById(decoded?.id);
        if (!user || user.refreshToken !== incomingRefreshToken) {
            throw new ApiError(401, "Refresh token does not match");
        }
        const { accessToken, refreshToken } = generateAuthTokens(user);

        // Update stored refresh token
        user.refreshToken = refreshToken;
        await user.save({ validateBeforeSave: false });

        const cookieOptions = {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
        };

        return res
            .status(200)
            .cookie("refreshToken", refreshToken, cookieOptions)
            .json(new ApiResponse(200, { accessToken }, "Access token refreshed successfully"));

    } catch (err) {
        if (err instanceof ApiError) {
            throw err;
        }
        throw new ApiError(401, "Invalid or expired refresh token");
    }
});

const changeCurrentPassword = asyncHandler(async (req, res) => {
    const { oldPassword, newPassword } = req.body;
    if (!oldPassword || !newPassword) {
        throw new ApiError(400, "Old password and new password are required");
    }

    const user = await User.findById(req.user._id);
    if (!user) {
        throw new ApiError(404, "User not found");
    }

    const isOldPasswordValid = await user.comparePassword(oldPassword);
    if (!isOldPasswordValid) {
        throw new ApiError(401, "Old password is incorrect");
    }

    user.password = newPassword;
    await user.save({ validateBeforeSave: false });
    res
        .status(200)
        .json(new ApiResponse(200, null, "Password changed successfully"));
});

const getCurrentUser = asyncHandler(async (req, res) => {
    if (!req.user) {
        throw new ApiError(401, "Unauthorized");
    }

    res
        .status(200)
        .json(new ApiResponse(200, req.user, "Current user fetched successfully"));
});

const updateAccountDetails = asyncHandler(async (req, res) => {
    const fullName = req.body?.fullName?.trim();
    const emailNormalized = req.body?.email?.trim().toLowerCase();

    if (!fullName || !emailNormalized) {
        throw new ApiError(400, "Full name and email are required");
    }

    const user = await User.findById(req.user._id);
    if (!user) {
        throw new ApiError(404, "User not found");
    }

    user.fullName = fullName;
    user.email = emailNormalized;
    await user.save({ validateBeforeSave: false });

    res
        .status(200)
        .json(new ApiResponse(200, user, "Account details updated successfully"));
});

const updateUserAvatar = asyncHandler(async (req, res) => {
    const avatarLocalPath = req.file?.path;

    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is required");
    }

    const user = await User.findById(req.user?._id);
    if (!user) {
        safeUnlink(avatarLocalPath);
        throw new ApiError(404, "User not found");
    }

    try {
        const avatar = await uploadOnCloudinary(avatarLocalPath);
        if (!avatar) {
            throw new ApiError(500, "Failed to upload avatar image");
        }

        // best-effort delete old avatar
        if (user.avatarId) {
            deleteFromCloudinary(user.avatarId);
        }

        user.avatar = avatar.url;
        user.avatarId = avatar.public_id;
        await user.save({ validateBeforeSave: false });

        return res
            .status(200)
            .json(new ApiResponse(200, { avatar: user.avatar }, "Avatar updated successfully"));
    } finally {
        safeUnlink(avatarLocalPath);
    }
});

const updateUserCoverImage = asyncHandler(async (req, res) => {
    const coverImageLocalPath = req.file?.path;

    if (!coverImageLocalPath) {
        throw new ApiError(400, "Cover image file is required");
    }

    const user = await User.findById(req.user?._id);
    if (!user) {
        safeUnlink(coverImageLocalPath);
        throw new ApiError(404, "User not found");
    }

    try {
        const coverImage = await uploadOnCloudinary(coverImageLocalPath);
        if (!coverImage) {
            throw new ApiError(500, "Failed to upload cover image");
        }

        // best-effort delete old cover image
        if (user.coverImageId) {
            deleteFromCloudinary(user.coverImageId);
        }

        user.coverImage = coverImage.url;
        user.coverImageId = coverImage.public_id;
        await user.save({ validateBeforeSave: false });

        return res
            .status(200)
            .json(new ApiResponse(200, { coverImage: user.coverImage }, "Cover image updated successfully"));
    } finally {
        safeUnlink(coverImageLocalPath);
    }
});

const getUserChannelProfile = asyncHandler(async (req, res) => {
    const { username } = req.params;
    if (!username) {
        throw new ApiError(400, "Username parameter is required");
    }

    const subscriberId = req.user?._id ? new mongoose.Types.ObjectId(req.user._id) : null;

    const channel = await User.aggregate([
        { $match: { username: username.trim().toLowerCase() } },
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
                        if: { $in: [subscriberId, "$subscribers.subscriber"] },
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

    if (!channel?.length) {
        throw new ApiError(404, "Channel not found");
    }

    res
        .status(200)
        .json(new ApiResponse(200, channel[0], "Channel profile fetched successfully"));
});

const getWatchHistory = asyncHandler(async (req, res) => {
    if (!req.user?._id) {
        throw new ApiError(401, "Unauthorized");
    }

    const user = await User.aggregate([
        {
            $match: { _id: new mongoose.Types.ObjectId(req.user._id) },
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
                            ]
                        },
                    },
                    {
                        $addFields: {
                            owner: { $first: "$owner" },
                        },
                    },
                ]
            },
        },
    ]);

    const history = user[0]?.watchedHistory || [];

    res
        .status(200)
        .json(new ApiResponse(200, history, "Watch history fetched successfully"));
});

export { registerUser, loginUser, logoutUser, refreshAccessToken, changeCurrentPassword, getCurrentUser, updateAccountDetails, updateUserAvatar, updateUserCoverImage, getUserChannelProfile, getWatchHistory };