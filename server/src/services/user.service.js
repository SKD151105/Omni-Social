import jwt from "jsonwebtoken";
import fs from "fs";
import { ApiError } from "../utils/ApiError.js";
import { uploadOnCloudinary, deleteFromCloudinary } from "../utils/cloudinary.js";
import * as userRepository from "../repositories/user.repository.js";

const generateAuthTokens = (user) => {
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();
    return { accessToken, refreshToken };
};

const safeUnlink = (filePath) => {
    if (!filePath) return;
    try {
        fs.unlinkSync(filePath);
    } catch (_err) {
        // swallow cleanup errors
    }
};

export const registerUserService = async ({ fullName, email, username, password, avatarLocalPath, coverImageLocalPath }) => {
    if ([fullName, email, username, password].some(field => !field || field?.trim() === "")) {
        throw new ApiError(400, "All fields are required");
    }

    const existedUser = await userRepository.findByEmailOrUsername({ email, username });
    if (existedUser) {
        throw new ApiError(409, "User with the same email or username already exists");
    }

    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar image is required");
    }

    let avatarUpload, coverImageUpload;
    try {
        avatarUpload = await uploadOnCloudinary(avatarLocalPath);
        if (coverImageLocalPath) {
            coverImageUpload = await uploadOnCloudinary(coverImageLocalPath);
        }

        if (!avatarUpload) {
            throw new ApiError(500, "Failed to upload avatar image");
        }

        try {
            const user = await userRepository.createUser({
                username,
                email,
                fullName,
                password,
                avatar: avatarUpload.url,
                avatarId: avatarUpload.public_id,
                coverImage: coverImageUpload?.url || "",
                coverImageId: coverImageUpload?.public_id || ""
            });

            const savedUser = await userRepository.findById(user._id, "-password -refreshToken");
            if (!savedUser) {
                throw new ApiError(500, "Failed to register user");
            }

            return savedUser;
        } catch (err) {
            // Clean up remote files if DB save fails
            if (avatarUpload?.public_id) await deleteFromCloudinary(avatarUpload.public_id);
            if (coverImageUpload?.public_id) await deleteFromCloudinary(coverImageUpload.public_id);
            throw err;
        }
    } finally {
        safeUnlink(avatarLocalPath);
        safeUnlink(coverImageLocalPath);
    }
};

export const loginUserService = async ({ emailInput, usernameInput, password }) => {
    if ((!emailInput && !usernameInput) || !password?.trim()) {
        throw new ApiError(400, "Username/email and password are required");
    }

    const user = await userRepository.findByEmailOrUsername({ email: emailInput, username: usernameInput });
    if (!user) {
        throw new ApiError(404, "User not found");
    }

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
        throw new ApiError(401, "Invalid credentials");
    }

    const { accessToken, refreshToken } = generateAuthTokens(user);
    await userRepository.saveRefreshToken(user, refreshToken);

    const safeUser = await userRepository.findById(user._id, "-password -refreshToken");

    return { safeUser, accessToken, refreshToken };
};

export const logoutUserService = async ({ refreshToken, currentUserId }) => {
    if (!refreshToken) {
        throw new ApiError(400, "Refresh token not found");
    }

    const user = await userRepository.findByRefreshToken(refreshToken);
    if (!user) {
        return { userCleared: false };
    }

    if (currentUserId && String(user._id) !== String(currentUserId)) {
        throw new ApiError(403, "Token does not belong to this user");
    }

    await userRepository.clearRefreshToken(user);
    return { userCleared: true };
};

export const refreshAccessTokenService = async ({ incomingRefreshToken }) => {
    if (!incomingRefreshToken) {
        throw new ApiError(400, "Refresh token not found");
    }

    try {
        const decoded = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET);
        const user = await userRepository.findById(decoded?.id);
        if (!user || user.refreshToken !== incomingRefreshToken) {
            throw new ApiError(401, "Refresh token does not match");
        }
        const { accessToken, refreshToken } = generateAuthTokens(user);

        await userRepository.saveRefreshToken(user, refreshToken);

        return { accessToken, refreshToken };
    } catch (err) {
        if (err instanceof ApiError) {
            throw err;
        }
        throw new ApiError(401, "Invalid or expired refresh token");
    }
};

export const changePasswordService = async ({ userId, oldPassword, newPassword }) => {
    if (!oldPassword || !newPassword) {
        throw new ApiError(400, "Old password and new password are required");
    }

    const user = await userRepository.findById(userId);
    if (!user) {
        throw new ApiError(404, "User not found");
    }

    const isOldPasswordValid = await user.comparePassword(oldPassword);
    if (!isOldPasswordValid) {
        throw new ApiError(401, "Old password is incorrect");
    }

    user.password = newPassword;
    await userRepository.saveUser(user, { validateBeforeSave: false });
};

export const getCurrentUserService = async ({ currentUser }) => {
    if (!currentUser) {
        throw new ApiError(401, "Unauthorized");
    }
    return currentUser;
};

export const updateAccountDetailsService = async ({ userId, fullName, email }) => {
    if (!fullName || !email) {
        throw new ApiError(400, "Full name and email are required");
    }

    const user = await userRepository.findById(userId);
    if (!user) {
        throw new ApiError(404, "User not found");
    }

    user.fullName = fullName;
    user.email = email;
    await userRepository.saveUser(user, { validateBeforeSave: false });

    return userRepository.findById(user._id, "-password -refreshToken");
};

export const updateUserProfileService = async ({ userId, fullName, email, avatarLocalPath, coverImageLocalPath }) => {
    if (![fullName, email, avatarLocalPath, coverImageLocalPath].some(Boolean)) {
        throw new ApiError(400, "No updates provided");
    }

    const user = await userRepository.findById(userId);
    if (!user) {
        safeUnlink(avatarLocalPath);
        safeUnlink(coverImageLocalPath);
        throw new ApiError(404, "User not found");
    }

    let avatarUpload, coverImageUpload;
    try {
        if (avatarLocalPath) {
            avatarUpload = await uploadOnCloudinary(avatarLocalPath);
            if (!avatarUpload) {
                throw new ApiError(500, "Failed to upload avatar image");
            }
        }
        if (coverImageLocalPath) {
            coverImageUpload = await uploadOnCloudinary(coverImageLocalPath);
            if (!coverImageUpload) {
                throw new ApiError(500, "Failed to upload cover image");
            }
        }

        try {
            if (avatarUpload) {
                if (user.avatarId) {
                    await deleteFromCloudinary(user.avatarId);
                }
                user.avatar = avatarUpload.url;
                user.avatarId = avatarUpload.public_id;
            }
            if (coverImageUpload) {
                if (user.coverImageId) {
                    await deleteFromCloudinary(user.coverImageId);
                }
                user.coverImage = coverImageUpload.url;
                user.coverImageId = coverImageUpload.public_id;
            }
            if (fullName) {
                user.fullName = fullName;
            }
            if (email) {
                user.email = email;
            }
            await userRepository.saveUser(user, { validateBeforeSave: false });
            return userRepository.findById(user._id, "fullName email username avatar coverImage");
        } catch (err) {
            // Clean up remote files if DB save fails
            if (avatarUpload?.public_id) await deleteFromCloudinary(avatarUpload.public_id);
            if (coverImageUpload?.public_id) await deleteFromCloudinary(coverImageUpload.public_id);
            throw err;
        }
    } finally {
        safeUnlink(avatarLocalPath);
        safeUnlink(coverImageLocalPath);
    }
};

export const getUserChannelProfileService = async ({ username, subscriberId }) => {
    if (!username) {
        throw new ApiError(400, "Username parameter is required");
    }

    const channel = await userRepository.aggregateChannelProfile({ username, subscriberId });
    if (!channel?.length) {
        throw new ApiError(404, "Channel not found");
    }

    return channel[0];
};

export const getWatchHistoryService = async ({ userId }) => {
    if (!userId) {
        throw new ApiError(401, "Unauthorized");
    }

    const userHistory = await userRepository.aggregateWatchHistory(userId);
    const history = userHistory[0]?.watchedHistory || [];
    return history;
};
