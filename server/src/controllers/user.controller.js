import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";

export const registerUser = asyncHandler(async (req, res) => {
    // BREAK THE BUSINESS LOGIC INTO STEPS:

    // 1. take user data from req.body (from frontend)
    const { username, email, fullName, password } = req.body;
    console.log("Registering user:", { fullName, email });

    // 2. validate the data - not empty, valid email, strong password, etc.
    if ([fullName, email, username, password].some(field => field?.trim() === "")) {
        throw new ApiError(400, "All fields are required");
    }

    // 3. check if user with the same email/username already exists (check with both username and email)
    const existedUser = await User.findOne({
        $or: [{ email }, { username }]
    })

    if (existedUser) {
        throw new ApiError(409, "User with the same email or username already exists");
    }

    // 4. check for images (avatar) in req.files
    const avatarLocalPath = req.files?.avatar?.[0]?.path;
    const coverImageLocalPath = req.files?.coverImage?.[0]?.path;

    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar image is required");
    }

    // 5. upload them to cloudinary and get the URLs
    const avatarUrl = await uploadOnCloudinary(avatarLocalPath);
    let coverImageUrl;
    if (coverImageLocalPath) {
        coverImageUrl = await uploadOnCloudinary(coverImageLocalPath);
    }

    if (!avatarUrl) {
        throw new ApiError(500, "Failed to upload avatar image");
    }

    // 6. create a new user object and save to DB
    const user = await User.create({
        username: username.toLowerCase(),
        email,
        fullName,
        password,
        avatar: avatarUrl.url,
        coverImage: coverImageUrl?.url || ""
    });

    // 7. respond with success message (without password and refresh token fields) or errors
    const savedUser = await User.findById(user._id).select("-password -refreshToken");

    if (!savedUser) {
        throw new ApiError(500, "Failed to register user");
    }

    res.status(201).json(new ApiResponse(201, savedUser, "User registered successfully"));

    // Use this for testing route setup when no Business logic is present yet
    // res.status(201).json({
    //     message: "User registered successfully"
    // });
});

// NOT USED YET
// export const loginUser = asyncHandler(async (req, res) => {
//     res.status(200).json({
//         message: "User logged in successfully"
//     });
// });
