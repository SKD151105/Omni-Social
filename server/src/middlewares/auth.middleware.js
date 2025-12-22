import jwt from "jsonwebtoken";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";

// Verify access token from Authorization header; attach user to req
export const verifyJWT = asyncHandler(async (req, _res, next) => {
    const authHeader = req.header("Authorization");
    const tokenFromHeader = authHeader?.startsWith("Bearer ") ? authHeader.substring(7) : null;
    const token = tokenFromHeader; // access tokens are expected in the Authorization header

    if (!token) {
        throw new ApiError(401, "Unauthorized");
    }

    let decoded;
    try {
        decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    } catch (_err) {
        throw new ApiError(401, "Invalid or expired access token");
    }

    const user = await User.findById(decoded?.id).select("-password -refreshToken");
    if (!user) {
        throw new ApiError(401, "User not found for this token");
    }

    req.user = user;
    next();
});