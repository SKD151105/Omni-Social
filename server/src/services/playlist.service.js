import mongoose from "mongoose";
import * as PlaylistRepo from "../repositories/playlist.repository.js";
import { Video } from "../models/video.model.js";
import { ApiError } from "../utils/ApiError.js";

const ensureId = (id, label) => {
    if (!mongoose.isValidObjectId(id)) {
        throw new ApiError(400, `Invalid ${label} id`);
    }
};

export const createPlaylistService = async ({ ownerId, name, description }) => {
    if (!name?.trim()) {
        throw new ApiError(400, "Playlist name is required");
    }

    const playlist = await Playlist.create({
        name: name.trim(),
        description: description?.trim() || "",
        owner: ownerId,
    });

    return playlist;
};

export const getUserPlaylistsService = async ({ userId }) => {
    ensureId(userId, "user");
    return Playlist.find({ owner: userId }).lean();
};

export const getPlaylistByIdService = async ({ playlistId }) => {
    ensureId(playlistId, "playlist");
    const playlist = await Playlist.findById(playlistId).populate({ path: "videos", select: "title thumbnail owner" });
    if (!playlist) {
        throw new ApiError(404, "Playlist not found");
    }
    return playlist;
};

export const addVideoToPlaylistService = async ({ playlistId, videoId, ownerId }) => {
    ensureId(playlistId, "playlist");
    ensureId(videoId, "video");

    const [playlist, videoExists] = await Promise.all([
        Playlist.findById(playlistId),
        Video.exists({ _id: videoId }),
    ]);

    if (!playlist) {
        throw new ApiError(404, "Playlist not found");
    }
    if (String(playlist.owner) !== String(ownerId)) {
        throw new ApiError(403, "Not allowed to modify this playlist");
    }
    if (!videoExists) {
        throw new ApiError(404, "Video not found");
    }

    if (!playlist.videos.some(v => String(v) === String(videoId))) {
        playlist.videos.push(videoId);
        await playlist.save();
    }

    return playlist;
};

export const removeVideoFromPlaylistService = async ({ playlistId, videoId, ownerId }) => {
    ensureId(playlistId, "playlist");
    ensureId(videoId, "video");

    const playlist = await Playlist.findById(playlistId);
    if (!playlist) {
        throw new ApiError(404, "Playlist not found");
    }
    if (String(playlist.owner) !== String(ownerId)) {
        throw new ApiError(403, "Not allowed to modify this playlist");
    }

    playlist.videos = playlist.videos.filter(v => String(v) !== String(videoId));
    await playlist.save();
    return playlist;
};

export const deletePlaylistService = async ({ playlistId, ownerId }) => {
    ensureId(playlistId, "playlist");
    const playlist = await PlaylistRepo.findPlaylistById(playlistId);
    if (!playlist) {
        throw new ApiError(404, "Playlist not found");
    }
    if (String(playlist.owner) !== String(ownerId)) {
        throw new ApiError(403, "Not allowed to delete this playlist");
    }
    await PlaylistRepo.deletePlaylistById(playlistId);
    return true;
};

export const updatePlaylistService = async ({ playlistId, ownerId, name, description }) => {
    ensureId(playlistId, "playlist");
    const playlist = await PlaylistRepo.findPlaylistById(playlistId);
    if (!playlist) {
        throw new ApiError(404, "Playlist not found");
    }
    if (String(playlist.owner) !== String(ownerId)) {
        throw new ApiError(403, "Not allowed to modify this playlist");
    }
    return PlaylistRepo.updatePlaylistById(playlistId, {
        ...(name?.trim() && { name: name.trim() }),
        ...(description !== undefined && { description: description?.trim() || "" }),
    });
};
