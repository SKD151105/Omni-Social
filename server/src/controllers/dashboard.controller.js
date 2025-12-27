import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { getDashboardService } from "../services/dashboard.service.js";

export const getDashboard = asyncHandler(async (req, res) => {
    if (!req.user?._id) {
        throw new ApiError(401, "Unauthorized");
    }

    const data = await getDashboardService({ userId: req.user._id });
    res.status(200).json(new ApiResponse(200, data, "Dashboard fetched"));
});
