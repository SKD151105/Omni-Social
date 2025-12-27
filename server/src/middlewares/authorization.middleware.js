import { ApiError } from "../utils/ApiError.js";

export const authorizeRoles = (...allowedRoles) => (req, res, next) => {
    const role = req.user?.role;
    if (!role) {
        return next(new ApiError(401, "Unauthorized"));
    }
    if (!allowedRoles.includes(role)) {
        return next(new ApiError(403, "Forbidden"));
    }
    return next();
};
