import { Router } from "express";
import { registerUser, loginUser, logoutUser, refreshAccessToken, changeCurrentPassword, getCurrentUser, updateAccountDetails, updateUserProfile, getUserChannelProfile, getWatchHistory } from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { validateBody } from "../middlewares/validation.middleware.js";

const registerSchema = {
    fullName: { required: true, type: "string", minLength: 2, transform: "trim" },
    email: { required: true, type: "string", pattern: "^.+@.+\\..+$", transform: "trim" },
    username: { required: true, type: "string", minLength: 3, transform: "trim" },
    password: { required: true, type: "string", minLength: 6 },
};
const loginSchema = {
    password: { required: true, type: "string" },
};
const changePasswordSchema = {
    oldPassword: { required: true, type: "string" },
    newPassword: { required: true, type: "string", minLength: 6 },
};
const updateAccountSchema = {
    fullName: { type: "string", minLength: 2, transform: "trim" },
    email: { type: "string", pattern: "^.+@.+\\..+$", transform: "trim" },
};

const router = Router();

router.route("/register").post(
    upload.fields([
        { name: "avatar", maxCount: 1 },
        { name: "coverImage", maxCount: 1 },
    ]),
    validateBody(registerSchema),
    registerUser
);

router.route("/login").post(validateBody(loginSchema), loginUser);

// secured routes
router.route("/logout").post(verifyJWT, logoutUser);
router.route("/refresh-token").post(refreshAccessToken);
router.route("/change-password").post(verifyJWT, validateBody(changePasswordSchema), changeCurrentPassword);
router.route("/current-user").get(verifyJWT, getCurrentUser);
router.route("/profile").patch(
    verifyJWT,
    upload.fields([
        { name: "avatar", maxCount: 1 },
        { name: "coverImage", maxCount: 1 },
    ]),
    updateUserProfile
);
router.route("/update-account").patch(verifyJWT, validateBody(updateAccountSchema), updateAccountDetails);
router.route("/c/:username").get(verifyJWT, getUserChannelProfile);
router.route("/history").get(verifyJWT, getWatchHistory);

export default router;