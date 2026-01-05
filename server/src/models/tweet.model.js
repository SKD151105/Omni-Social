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
            index: true,
        },
        expiresAt: {
            type: Date,
            expires: 0, // optional TTL when set
        }
    },
    { timestamps: true }
);

// Recency index per author for feeds
TweetSchema.index({ author: 1, createdAt: -1 }, { name: "author_createdAt" });

// Text search on tweet content
TweetSchema.index({ content: "text" }, { name: "tweet_text_search" });

export const Tweet = mongoose.model("Tweet", TweetSchema);