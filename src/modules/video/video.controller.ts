import { Request, Response } from "express";
import { catchAsync } from "../../shared/catchAsync";
import { videoService } from "./video.service";
import sendResponse from "../../utils/sendResponse";
import httpStatus from "http-status";
import { v2 as cloudinary } from 'cloudinary';
import AppError from "../../errors/AppError";
import * as fs from "fs";
import * as path from "path";
import { getActiveSubscription, getPlanLimits, getVideoDuration } from "./video.utils";

// Cloudinary Video Upload Utility
const uploadVideoToCloudinary = async (file: Express.Multer.File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
            {
                folder: 'swenker-profiles/videos',
                resource_type: 'video',
            },
            (error, result) => {
                if (error) return reject(error);
                if (result) resolve(result.secure_url);
            }
        );

        uploadStream.end(file.buffer);
    });
};

/**
 * Handles creation of video posts with premium feature checks and duration validations.
 * Checks are executed BEFORE uploading to Cloudinary to save bandwidth and prevent unneeded costs.
 */
const createVideoPost = catchAsync(async (req: Request, res: Response) => {
    const file = req.file;
    if (!file) {
        throw new AppError(httpStatus.BAD_REQUEST, "Video file is required");
    }

    const userId = req.user.id;

    // 1. Detect user's active subscription and retrieve plan limits
    const plan = await getActiveSubscription(userId);
    const limits = getPlanLimits(plan);


    // 2. Validate tagged users count against plan limits
    const taggedUsers: string[] = req.body.taggedUsers || [];
    if (taggedUsers.length > limits.maxTags) {
        if (limits.nextPlanName) {
            throw new AppError(
                httpStatus.BAD_REQUEST,
                `Upgrade to ${limits.nextPlanName} to tag more friends.`
            );
        } else {
            throw new AppError(
                httpStatus.BAD_REQUEST,
                `Upgrade your subscription plan to tag more friends.`
            );
        }
    }

    // 3. Write video buffer temporarily to disk to evaluate duration via ffprobe
    const tempDir = path.join(process.cwd(), "temp");
    if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
    }
    const tempFilePath = path.join(tempDir, `${Date.now()}-${file.originalname}`);

    await fs.promises.writeFile(tempFilePath, file.buffer);

    let duration = 0;
    try {
        duration = await getVideoDuration(tempFilePath);
    } finally {
        // ALWAYS clean up the temporary file from disk
        await fs.promises.unlink(tempFilePath).catch((err) => {
            console.error("Temp file cleanup error:", err.message);
        });
    }
    const finalDuration = Math.floor(duration);

    // 4. Validate video duration against plan limits
    if (finalDuration > limits.maxDuration) {
        if (limits.nextPlanName) {
            throw new AppError(
                httpStatus.BAD_REQUEST,
                `Upgrade to ${limits.nextPlanName} to upload videos longer than ${limits.maxDuration} seconds.`
            );
        } else {
            throw new AppError(
                httpStatus.BAD_REQUEST,
                `Upgrade your subscription plan to upload videos longer than ${limits.maxDuration} seconds.`
            );
        }
    }

    // 5. Validation passed! Upload to Cloudinary.
    const videoUrl = await uploadVideoToCloudinary(file);

    const videoData = {
        userId,
        videoUrl,
        caption: req.body.caption,
        taggedUsers,
    };

    const result = await videoService.createVideoPost(videoData);

    sendResponse(res, {
        statusCode: httpStatus.CREATED,
        success: true,
        message: "Video posted successfully",
        data: result,
    });
});

const getReelsFeed = catchAsync(async (req: Request, res: Response) => {
    const cursor = req.query.cursor as string | undefined;

    const result = await videoService.getReelsFeed(cursor);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Videos fetched successfully",
        data: result,
    });
});

export const videoController = {
    createVideoPost,
    getReelsFeed,
};
