import { http } from "../lib/http.js";

// Video-related API calls mapped to backend routes under /api/v1/videos
export const listVideos = (query) => http.get("/videos", { query });
export const getVideoById = (videoId) => http.get(`/videos/${videoId}`);
export const publishVideo = (formData) => http.post("/videos", { body: formData });
export const updateVideo = (videoId, formData) => http.patch(`/videos/${videoId}`, { body: formData });
export const deleteVideo = (videoId) => http.delete(`/videos/${videoId}`);
export const togglePublishStatus = (videoId) => http.patch(`/videos/${videoId}/toggle-publish`);
