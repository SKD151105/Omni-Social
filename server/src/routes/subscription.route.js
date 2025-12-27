import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels,
} from "../controllers/subscription.controller.js";

const router = Router();

router.post("/toggle/:channelId", verifyJWT, toggleSubscription);
router.get("/subscribers/:channelId", getUserChannelSubscribers);
router.get("/subscribed/:subscriberId", getSubscribedChannels);

export default router;
