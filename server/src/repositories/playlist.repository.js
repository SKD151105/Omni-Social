import { Playlist } from "../models/playlist.model.js";

export const createPlaylist = async (data) => {
    return Playlist.create(data);
};

export const findPlaylistsByUser = async (userId) => {
    return Playlist.find({ owner: userId }).lean();
};

export const findPlaylistById = async (id) => {
    return Playlist.findById(id).populate({ path: "videos", select: "title thumbnail owner" });
};

export const updatePlaylistById = async (id, update, options = {}) => {
    return Playlist.findByIdAndUpdate(id, update, { new: true, ...options });
};

export const deletePlaylistById = async (id) => {
    return Playlist.findByIdAndDelete(id);
};

export const addVideoToPlaylist = async (playlistId, videoId) => {
    return Playlist.findByIdAndUpdate(
        playlistId,
        { $addToSet: { videos: videoId } },
        { new: true }
    );
};

export const removeVideoFromPlaylist = async (playlistId, videoId) => {
    return Playlist.findByIdAndUpdate(
        playlistId,
        { $pull: { videos: videoId } },
        { new: true }
    );
};
