import mongoose, { Schema } from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

const UserSchema = new Schema(
    {
        username: {
            type: String,
            required: [true, "Username is required"],
            unique: true,
            lowercase: true,
            trim: true,
            index: true,
            minlength: [3, "Username must be at least 3 characters long"],
            maxlength: [30, "Username must be at most 30 characters long"],
            match: [/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores"],
        },
        email: {
            type: String,
            required: [true, "Email is required"],
            unique: true,
            lowercase: true,
            trim: true,
            match: [
                /^([a-zA-Z0-9_\-.+]+)@([a-zA-Z0-9\-.]+)\.([a-zA-Z]{2,})$/,
                "Please provide a valid email address"
            ],
        },
        fullName: {
            type: String,
            required: [true, "Full name is required"],
            trim: true,
            index: true,
            minlength: [2, "Full name must be at least 2 characters long"],
            maxlength: [50, "Full name must be at most 50 characters long"],
        },
        avatar: {
            type: String, // cloudinary URL
            required: true,
        },
        avatarId: {
            type: String, // cloudinary public_id
        },
        coverImage: {
            type: String, // cloudinary URL
        },
        coverImageId: {
            type: String, // cloudinary public_id
        },
        watchHistory: [
            {
                type: Schema.Types.ObjectId,
                ref: "Video",
            }
        ],
        password: {
            type: String,
            required: [true, "Password is required"],
            minlength: [8, "Password must be at least 8 characters long"],
            maxlength: [100, "Password must be at most 100 characters long"],
            // At least one uppercase, one lowercase, one number, one special char
            match: [
                /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,}$/,
                "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character"
            ],
        },
        refreshTokenHash: {
            type: String,
        },
        refreshTokenId: {
            type: String,
        },
        role: {
            type: String,
            enum: ["user", "admin"],
            default: "user",
        },
    },
    { timestamps: true }
);

// Compound index helps covered queries on auth identifiers
UserSchema.index({ email: 1, username: 1 }, { name: "email_username_cover" });

// Text index for flexible user search (username > fullName > email)
UserSchema.index(
    { username: "text", fullName: "text", email: "text" },
    { name: "user_text_search", weights: { username: 5, fullName: 3, email: 1 } }
);

// Partial index keeps refresh-token lookups small and sparse
UserSchema.index(
    { refreshTokenId: 1 },
    { name: "refresh_token_partial", partialFilterExpression: { refreshTokenId: { $exists: true } }, sparse: true }
);

UserSchema.pre("save", async function () {
    if (this.isModified("password")) {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
    }
});

UserSchema.methods.comparePassword = async function (candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

UserSchema.methods.generateAccessToken = function () {
    const payload = {
        id: this._id,
        email: this.email,
        username: this.username,
        fullName: this.fullName,
        role: this.role,
    };
    return jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: process.env.ACCESS_TOKEN_EXPIRY || "15m",
    });
};

UserSchema.methods.generateRefreshToken = function () {
    const payload = { id: this._id };
    return jwt.sign(payload, process.env.REFRESH_TOKEN_SECRET, {
        expiresIn: process.env.REFRESH_TOKEN_EXPIRY || "7d",
    });
};

export const User = mongoose.model("User", UserSchema);