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

// Quick owner lookups and name-based searches
playlistSchema.index({ owner: 1, createdAt: -1 }, { name: "owner_createdAt" });
playlistSchema.index({ name: 1, owner: 1 }, { name: "name_owner_cover" });
playlistSchema.index({ name: "text", description: "text" }, { name: "playlist_text_search", weights: { name: 5, description: 1 } });

export const Playlist = mongoose.model("Playlist", playlistSchema);