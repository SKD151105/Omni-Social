import mongoose from "mongoose";

const playlistSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
            minlength: [2, "Playlist name must be at least 2 characters long"],
            maxlength: [120, "Playlist name cannot exceed 120 characters"],
        },
        description: {
            type: String,
            required: false,
            trim: true,
            minlength: [0, "Description cannot be negative length"],
            maxlength: [500, "Description cannot exceed 500 characters"],
        },
        videos: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Video",
            },
        ],
        owner: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
    },
    { timestamps: true }
);

export const Playlist = mongoose.model("Playlist", playlistSchema);