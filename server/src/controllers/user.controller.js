import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";

// Helper to generate fresh tokens for a user
const generateAuthTokens = (user) => {
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();
    return { accessToken, refreshToken };
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

    // 5. upload them to cloudinary and get the URLs
    const avatarUrl = await uploadOnCloudinary(avatarLocalPath);
    let coverImageUrl;
    if (coverImageLocalPath) {
        coverImageUrl = await uploadOnCloudinary(coverImageLocalPath);
    }

    if (!avatarUrl) {
        throw new ApiError(500, "Failed to upload avatar image");
    }

    // 6. create a new user object and save to DB
    const user = await User.create({
        username: usernameNormalized,
        email: emailNormalized,
        fullName,
        password,
        avatar: avatarUrl.url,
        coverImage: coverImageUrl?.url || ""
    });

    // 7. respond with success message (without password and refresh token fields) or errors
    const savedUser = await User.findById(user._id).select("-password -refreshToken");

    if (!savedUser) {
        throw new ApiError(500, "Failed to register user");
    }

    res.status(201).json(new ApiResponse(201, savedUser, "User registered successfully"));

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

export { registerUser, loginUser, logoutUser, refreshAccessToken };