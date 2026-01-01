import crypto from "crypto";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import {
    registerUserService,
    loginUserService,
    logoutUserService,
    refreshAccessTokenService,
    changePasswordService,
    getCurrentUserService,
    updateAccountDetailsService,
    updateUserProfileService,
    getUserChannelProfileService,
    getWatchHistoryService,
} from "../services/user.service.js";

const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
};

const csrfCookieOptions = {
    httpOnly: false,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
};

const CSRF_HEADER = "x-csrf-token";
const generateCsrfToken = () => crypto.randomBytes(24).toString("hex");

const setSessionCookies = (res, refreshToken) => {
    const csrfToken = generateCsrfToken();
    res.cookie("refreshToken", refreshToken, cookieOptions);
    res.cookie("csrfToken", csrfToken, csrfCookieOptions);
    return csrfToken;
};

const assertCsrf = (req) => {
    const headerToken = req.get(CSRF_HEADER);
    const cookieToken = req.cookies?.csrfToken;
    if (!headerToken || !cookieToken || headerToken !== cookieToken) {
        throw new ApiError(403, "CSRF token missing or invalid");
    }
};

// Either export at the end or inline (but do it everywhere consistently)
// export const registerUser = asyncHandler(async (req, res) => {
const registerUser = asyncHandler(async (req, res) => {
    const usernameNormalized = req.body?.username?.trim().toLowerCase();
    const emailNormalized = req.body?.email?.trim().toLowerCase();
    const fullName = req.body?.fullName?.trim();
    const password = req.body?.password;
    const avatarLocalPath = req.files?.avatar?.[0]?.path;
    const coverImageLocalPath = req.files?.coverImage?.[0]?.path;

    const savedUser = await registerUserService({
        fullName,
        email: emailNormalized,
        username: usernameNormalized,
        password,
        avatarLocalPath,
        coverImageLocalPath,
    });

    res.status(201).json(new ApiResponse(201, savedUser, "User registered successfully"));
});

const loginUser = asyncHandler(async (req, res) => {
    const emailInput = req.body?.email?.trim().toLowerCase();
    const usernameInput = req.body?.username?.trim().toLowerCase();
    const { password } = req.body;

    if (!emailInput && !usernameInput) {
        throw new ApiError(400, "Email or username is required");
    }

    const { safeUser, accessToken, refreshToken } = await loginUserService({ emailInput, usernameInput, password });

    setSessionCookies(res, refreshToken);

    res
        .status(200)
        .json(new ApiResponse(200, { user: safeUser, accessToken }, "User logged in successfully"));
});

const logoutUser = asyncHandler(async (req, res) => {
    const refreshToken = req.cookies?.refreshToken;
    const { userCleared } = await logoutUserService({ refreshToken, currentUserId: req.user?._id });

    res
        .status(200)
        .clearCookie("refreshToken", cookieOptions)
        .clearCookie("csrfToken", csrfCookieOptions)
        .json(new ApiResponse(200, null, userCleared ? "Logged out" : "Logged out"));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
    assertCsrf(req);
    const incomingRefreshToken = req.cookies?.refreshToken;
    const { accessToken, refreshToken } = await refreshAccessTokenService({ incomingRefreshToken });

    setSessionCookies(res, refreshToken);

    return res
        .status(200)
        .json(new ApiResponse(200, { accessToken }, "Access token refreshed successfully"));
});

const changeCurrentPassword = asyncHandler(async (req, res) => {
    const { oldPassword, newPassword } = req.body;
    await changePasswordService({ userId: req.user._id, oldPassword, newPassword });
    res
        .status(200)
        .json(new ApiResponse(200, null, "Password changed successfully"));
});

const getCurrentUser = asyncHandler(async (req, res) => {
    const currentUser = await getCurrentUserService({ currentUser: req.user });
    res
        .status(200)
        .json(new ApiResponse(200, currentUser, "Current user fetched successfully"));
});

const updateAccountDetails = asyncHandler(async (req, res) => {
    const fullName = req.body?.fullName?.trim();
    const emailNormalized = req.body?.email?.trim().toLowerCase();
    const updatedUser = await updateAccountDetailsService({ userId: req.user._id, fullName, email: emailNormalized });

    res
        .status(200)
        .json(new ApiResponse(200, updatedUser, "Account details updated successfully"));
});

// Combined profile update: optional avatar, cover image, fullName, email
const updateUserProfile = asyncHandler(async (req, res) => {
    const fullName = req.body?.fullName?.trim();
    const emailNormalized = req.body?.email?.trim()?.toLowerCase();
    const avatarLocalPath = req.files?.avatar?.[0]?.path;
    const coverImageLocalPath = req.files?.coverImage?.[0]?.path;
    const safeUser = await updateUserProfileService({
        userId: req.user?._id,
        fullName,
        email: emailNormalized,
        avatarLocalPath,
        coverImageLocalPath,
    });

    return res
        .status(200)
        .json(new ApiResponse(200, safeUser, "Profile updated successfully"));
});

const getUserChannelProfile = asyncHandler(async (req, res) => {
    const { username } = req.params;
    const channel = await getUserChannelProfileService({
        username: username?.trim().toLowerCase(),
        subscriberId: req.user?._id,
    });

    res
        .status(200)
        .json(new ApiResponse(200, channel, "Channel profile fetched successfully"));
});

const getWatchHistory = asyncHandler(async (req, res) => {
    const history = await getWatchHistoryService({ userId: req.user?._id });

    res
        .status(200)
        .json(new ApiResponse(200, history, "Watch history fetched successfully"));
});

export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateAccountDetails,
    updateUserProfile,
    getUserChannelProfile,
    getWatchHistory,
};