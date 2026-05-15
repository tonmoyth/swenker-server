import { Request, Response } from "express";
import { catchAsync } from "../../shared/catchAsync";
import { storyService } from "./story.service";
import sendResponse from "../../utils/sendResponse";
import httpStatus from "http-status";
import { v2 as cloudinary } from 'cloudinary';
import { envVeriables } from '../../config/envConfig';
import AppError from "../../errors/AppError";

// Cloudinary Configuration
cloudinary.config({
    cloud_name: envVeriables.CLOUDINARY_CLOUD_NAME,
    api_key: envVeriables.CLOUDINARY_API_KEY,
    api_secret: envVeriables.CLOUDINARY_API_SECRET,
});

/**
 * Upload story media to Cloudinary
 * Supports both image and video
 */
const uploadStoryMediaToCloudinary = async (file: Express.Multer.File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const resourceType = file.mimetype.startsWith("video/") ? "video" : "image";
        
        const uploadStream = cloudinary.uploader.upload_stream(
            {
                folder: 'social-app/story',
                resource_type: resourceType,
            },
            (error, result) => {
                if (error) return reject(error);
                if (result) resolve(result.secure_url);
            }
        );

        uploadStream.end(file.buffer);
    });
};

const createStory = catchAsync(async (req: Request, res: Response) => {
    const file = req.file;
    if (!file) {
        throw new AppError(httpStatus.BAD_REQUEST, "Story media file is required");
    }

    // Upload to Cloudinary
    const mediaUrl = await uploadStoryMediaToCloudinary(file);

    // Prepare story data
    // req.user comes from checkAuth middleware
    const storyData = {
        userId: (req as any).user.id,
        mediaUrl,
        caption: req.body.caption,
        taggedUsers: req.body.taggedUsers,
    };

    const result = await storyService.createStory(storyData);

    sendResponse(res, {
        statusCode: httpStatus.CREATED,
        success: true,
        message: "Story created successfully",
        data: result,
    });
});

export const storyController = {
    createStory,
};
