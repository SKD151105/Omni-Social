import mongoose from "mongoose";

// Production-friendly polymorphic like: one target only, typed
const LikeSchema = new mongoose.Schema(
    {
        targetType: {
            type: String,
            enum: ["Video", "Comment", "Tweet"],
            required: true,
        },
        target: {
            type: mongoose.Schema.Types.ObjectId,
            refPath: "targetType",
            required: true,
        },
        likedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
    },
    { timestamps: true }
);

// Prevent duplicate likes per user per target
LikeSchema.index({ targetType: 1, target: 1, likedBy: 1 }, { unique: true });

export const Like = mongoose.model("Like", LikeSchema);