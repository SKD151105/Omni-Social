import mongoose, { Schema } from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const CommentSchema = new Schema(
    {
        content: {
            type: String,
            required: true,
            trim: true,
            minlength: [1, "Comment cannot be empty"],
            maxlength: [1000, "Comment cannot exceed 1000 characters"],
        },
        video: {
            type: Schema.Types.ObjectId,
            ref: "Video",
            required: true,
        },
        author: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
    },
    { timestamps: true }
);

CommentSchema.plugin(mongooseAggregatePaginate);
// Adding pagination plugin for aggregate queries on comments (e.g., for fetching comments with replies)

// Fast fetch per video and author, ordered by recency
CommentSchema.index({ video: 1, createdAt: -1 }, { name: "video_createdAt" });
CommentSchema.index({ author: 1, createdAt: -1 }, { name: "author_createdAt" });

export const Comment = mongoose.model("Comment", CommentSchema);