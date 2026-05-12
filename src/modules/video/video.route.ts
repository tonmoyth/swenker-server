import express from "express";
import { videoController } from "./video.controller";
import { checkAuth } from "../../middlewares/checkAuth";
import validateRequest from "../../middlewares/validateRequest";
import { createVideoSchema } from "./video.validation";
import multer from "multer";
import AppError from "../../errors/AppError";
import httpStatus from "http-status";

const router = express.Router();

// Multer Setup for Video
const storage = multer.memoryStorage();
const upload = multer({
    storage,
    limits: {
        fileSize: 50 * 1024 * 1024, // 50MB limit
    },
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith("video/")) {
            cb(null, true);
        } else {
            cb(new AppError(httpStatus.BAD_REQUEST, "Only video files are allowed") as any);
        }
    },
});

router.post(
    "/",
    checkAuth(),
    upload.single("video"),
    (req, res, next) => {
        // Handle potential JSON stringified data field
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
    validateRequest(createVideoSchema),
    videoController.createVideoPost
);

export const videoRoutes = router;
