import { validateBody } from "../middlewares/validation.middleware.js";

const commentSchema = {
    content: { required: true, type: "string", minLength: 1, transform: "trim" },
};
import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { getVideoComments, addComment, updateComment, deleteComment } from "../controllers/comment.controller.js";

const router = Router();

// List comments for a video (paginated)
router.route("/:videoId").get(getVideoComments);

// Create a comment on a video
router.route("/:videoId").post(verifyJWT, validateBody(commentSchema), addComment);

// Update or delete a comment by id
router.route("/comment/:commentId")
    .patch(verifyJWT, validateBody(commentSchema), updateComment)
    .delete(verifyJWT, deleteComment);

export default router;
