import mongoose, { Schema } from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const VideoSchema = new Schema(
    {
        videoFile: {
            type: String, // cloudinary url
            required: true,
        },
        thumbnail: {
            type: String, // cloudinary url
            required: true,
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
        },
    },
    { timestamps: true }
);

VideoSchema.plugin(mongooseAggregatePaginate);
// Adding pagination plugin for aggregate queries on videos (e.g., for feeds, searches)

export const Video = mongoose.model("Video", VideoSchema);