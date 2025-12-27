import { Router } from "express";
import { getChannelStats, getChannelVideos } from "../controllers/channel.controller.js";

const router = Router();

router.get("/:channelId/stats", getChannelStats);
router.get("/:channelId/videos", getChannelVideos);

export default router;
