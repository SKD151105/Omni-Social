import mongoose, { Schema } from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const VideoSchema = new Schema(
    {
        videoFile: {
            type: String, // cloudinary url
            required: true,
        },
        videoPublicId: {
            type: String, // cloudinary public_id for video
        },
        thumbnail: {
            type: String, // cloudinary url
            required: true,
        },
        thumbnailPublicId: {
            type: String, // cloudinary public_id for thumbnail
        },
        title: {
            type: String,
            required: true,
            trim: true,
            minlength: [2, "Title must be at least 2 characters long"],
            maxlength: [120, "Title cannot exceed 120 characters"],
        },
        description: {
            type: String,
            required: true,
            trim: true,
            minlength: [10, "Description must be at least 10 characters long"],
            maxlength: [2000, "Description cannot exceed 2000 characters"],
        },
        duration: {
            type: Number,
            required: true,
        },
        views: {
            type: Number,
            default: 0,
        },
        isPublished: {
            type: Boolean,
            default: true,
        },
        owner: {
            type: Schema.Types.ObjectId,
            ref: "User",
            index: true,
        },
    },
    { timestamps: true }
);

VideoSchema.plugin(mongooseAggregatePaginate);
// Adding pagination plugin for aggregate queries on videos (e.g., for feeds, searches)

// Feed-friendly compound index (owner + published + recency)
VideoSchema.index({ owner: 1, isPublished: 1, createdAt: -1 }, { name: "owner_published_createdAt" });

// Hot list: published videos ranked by views, then recency
VideoSchema.index(
    { isPublished: 1, views: -1, createdAt: -1 },
    { name: "published_views_rank", partialFilterExpression: { isPublished: true } }
);

// Text search across title and description
VideoSchema.index(
    { title: "text", description: "text" },
    { name: "video_text_search", weights: { title: 5, description: 1 } }
);

export const Video = mongoose.model("Video", VideoSchema);