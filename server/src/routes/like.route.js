import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
    toggleVideoLike,
    toggleCommentLike,
    toggleTweetLike,
    getLikedVideos,
} from "../controllers/like.controller.js";

const router = Router();

router.post("/video/:videoId", verifyJWT, toggleVideoLike);
router.post("/comment/:commentId", verifyJWT, toggleCommentLike);
router.post("/tweet/:tweetId", verifyJWT, toggleTweetLike);
router.get("/videos", verifyJWT, getLikedVideos);

export default router;
