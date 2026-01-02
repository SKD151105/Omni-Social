import { http } from "../lib/http.js";

// User-related API calls mapped to backend routes under /api/v1/user
export const registerUser = (formData) => http.post("/user/register", { body: formData });
export const loginUser = (payload) => http.post("/user/login", { body: payload });
export const logoutUser = () => http.post("/user/logout");
export const refreshToken = () => http.post("/user/refresh-token");
export const changePassword = (payload) => http.post("/user/change-password", { body: payload });
export const getCurrentUser = () => http.get("/user/current-user");
export const updateAccount = (payload) => http.patch("/user/update-account", { body: payload });
export const updateUserProfile = (formData) => http.patch("/user/profile", { body: formData });
export const getUserChannelProfile = (username) => http.get(`/user/c/${username}`);
export const getWatchHistory = () => http.get("/user/history");
