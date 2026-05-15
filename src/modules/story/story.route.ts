import express from "express";
import { storyController } from "./story.controller";
import { checkAuth } from "../../middlewares/checkAuth";
import validateRequest from "../../middlewares/validateRequest";
import { storyValidation } from "./story.validation";
import multer from "multer";
import AppError from "../../errors/AppError";
import httpStatus from "http-status";

const router = express.Router();

// Multer Setup for Story (Accepts image and video)
const storage = multer.memoryStorage();
const upload = multer({
    storage,
    limits: {
        fileSize: 50 * 1024 * 1024, // 50MB limit
    },
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith("video/") || file.mimetype.startsWith("image/")) {
            cb(null, true);
        } else {
            cb(new AppError(httpStatus.BAD_REQUEST, "Only image or video files are allowed") as any);
        }
    },
});

router.post(
    "/",
    checkAuth(),
    upload.single("media"),
    (req, res, next) => {
        // Handle potential JSON stringified data field (common in multipart form data)
        if (req.body.data) {
            try {
                const parsedData = JSON.parse(req.body.data);
                req.body = { ...req.body, ...parsedData };
            } catch (error) {
                // Ignore parse errors, use raw body
            }
        }
        next();
    },
    validateRequest(storyValidation.createStorySchema),
    storyController.createStory
);

export const storyRoutes = router;
