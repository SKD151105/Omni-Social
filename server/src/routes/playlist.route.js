import { validateBody } from "../middlewares/validation.middleware.js";

const playlistSchema = {
    name: { required: true, type: "string", minLength: 2, transform: "trim" },
    description: { type: "string", minLength: 0, transform: "trim" },
};
import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist,
} from "../controllers/playlist.controller.js";

const router = Router();

router.post("/", verifyJWT, validateBody(playlistSchema), createPlaylist);
router.get("/user/:userId", getUserPlaylists);
router.get("/:playlistId", getPlaylistById);
router.patch("/:playlistId", verifyJWT, validateBody(playlistSchema), updatePlaylist);
router.delete("/:playlistId", verifyJWT, deletePlaylist);
router.post("/:playlistId/videos/:videoId", verifyJWT, addVideoToPlaylist);
router.delete("/:playlistId/videos/:videoId", verifyJWT, removeVideoFromPlaylist);

export default router;
