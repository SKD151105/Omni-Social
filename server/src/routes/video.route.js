import { validateBody } from "../middlewares/validation.middleware.js";

const videoSchema = {
    title: { required: true, type: "string", minLength: 2, transform: "trim" },
    description: { type: "string", minLength: 0, transform: "trim" },
    duration: { type: "number" },
};
const updateVideoSchema = {
    title: { type: "string", minLength: 2, transform: "trim" },
    description: { type: "string", minLength: 0, transform: "trim" },
};
import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";
import {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus,
} from "../controllers/video.controller.js";

const router = Router();

router.get("/", getAllVideos);

router.post(
    "/",
    verifyJWT,
    upload.fields([
        { name: "videoFile", maxCount: 1 },
        { name: "thumbnail", maxCount: 1 },
    ]),
    validateBody(videoSchema),
    publishAVideo
);

router.get("/:videoId", getVideoById);

router.patch(
    "/:videoId",
    verifyJWT,
    upload.fields([{ name: "thumbnail", maxCount: 1 }]),
    validateBody(updateVideoSchema),
    updateVideo
);

router.delete("/:videoId", verifyJWT, deleteVideo);
router.patch("/:videoId/toggle-publish", verifyJWT, togglePublishStatus);

export default router;
