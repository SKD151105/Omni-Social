import { asyncHandler } from "../utils/asyncHandler.js";

export const registerUser = asyncHandler(async (req, res) => {
    res.status(201).json({
        message: "User registered successfully"
    });
});

// NOT USED YET
// export const loginUser = asyncHandler(async (req, res) => {
//     res.status(200).json({
//         message: "User logged in successfully"
//     });
// });
