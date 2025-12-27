import mongoose from "mongoose";

const TweetSchema = new mongoose.Schema(
    {
        content: {
            type: String,
            required: true,
            trim: true,
            minlength: [1, "Tweet cannot be empty"],
            maxlength: [500, "Tweet cannot exceed 500 characters"],
        },
        author: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        }
    },
    { timestamps: true }
);

export const Tweet = mongoose.model("Tweet", TweetSchema);