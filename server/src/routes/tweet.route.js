import { validateBody } from "../middlewares/validation.middleware.js";

const tweetSchema = {
	content: { required: true, type: "string", minLength: 1, transform: "trim" },
};
import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { createTweet, getUserTweets, updateTweet, deleteTweet } from "../controllers/tweet.controller.js";

const router = Router();

router.post("/", verifyJWT, validateBody(tweetSchema), createTweet);
router.get("/user/:userId", getUserTweets);
router.patch("/:tweetId", verifyJWT, validateBody(tweetSchema), updateTweet);
router.delete("/:tweetId", verifyJWT, deleteTweet);

export default router;
