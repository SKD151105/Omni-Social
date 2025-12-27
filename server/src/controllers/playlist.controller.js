import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
    createPlaylistService,
    getUserPlaylistsService,
    getPlaylistByIdService,
    addVideoToPlaylistService,
    removeVideoFromPlaylistService,
    deletePlaylistService,
    updatePlaylistService,
} from "../services/playlist.service.js";

export const createPlaylist = asyncHandler(async (req, res) => {
    const { name, description } = req.body;
    if (!req.user?._id) {
        throw new ApiError(401, "Unauthorized");
    }

    const playlist = await createPlaylistService({ ownerId: req.user._id, name, description });
    res.status(201).json(new ApiResponse(201, playlist, "Playlist created"));
});

export const getUserPlaylists = asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const playlists = await getUserPlaylistsService({ userId });
    res.status(200).json(new ApiResponse(200, playlists, "Playlists fetched"));
});

export const getPlaylistById = asyncHandler(async (req, res) => {
    const { playlistId } = req.params;
    const playlist = await getPlaylistByIdService({ playlistId });
    res.status(200).json(new ApiResponse(200, playlist, "Playlist fetched"));
});

export const addVideoToPlaylist = asyncHandler(async (req, res) => {
    const { playlistId, videoId } = req.params;
    if (!req.user?._id) {
        throw new ApiError(401, "Unauthorized");
    }

    const playlist = await addVideoToPlaylistService({ playlistId, videoId, ownerId: req.user._id });
    res.status(200).json(new ApiResponse(200, playlist, "Video added to playlist"));
});

export const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    const { playlistId, videoId } = req.params;
    if (!req.user?._id) {
        throw new ApiError(401, "Unauthorized");
    }

    const playlist = await removeVideoFromPlaylistService({ playlistId, videoId, ownerId: req.user._id });
    res.status(200).json(new ApiResponse(200, playlist, "Video removed from playlist"));
});

export const deletePlaylist = asyncHandler(async (req, res) => {
    const { playlistId } = req.params;
    if (!req.user?._id) {
        throw new ApiError(401, "Unauthorized");
    }

    await deletePlaylistService({ playlistId, ownerId: req.user._id });
    res.status(200).json(new ApiResponse(200, null, "Playlist deleted"));
});

export const updatePlaylist = asyncHandler(async (req, res) => {
    const { playlistId } = req.params;
    const { name, description } = req.body;
    if (!req.user?._id) {
        throw new ApiError(401, "Unauthorized");
    }

    const playlist = await updatePlaylistService({ playlistId, ownerId: req.user._id, name, description });
    res.status(200).json(new ApiResponse(200, playlist, "Playlist updated"));
});
