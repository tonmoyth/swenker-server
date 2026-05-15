import { Request, Response } from "express";
import { catchAsync } from "../../shared/catchAsync";
import { videoService } from "./video.service";
import sendResponse from "../../utils/sendResponse";
import httpStatus from "http-status";
import { v2 as cloudinary } from 'cloudinary';
import { envVeriables } from '../../config/envConfig';
import AppError from "../../errors/AppError";

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

const createVideoPost = catchAsync(async (req: Request, res: Response) => {
    const file = req.file;
    if (!file) {
        throw new AppError(httpStatus.BAD_REQUEST, "Video file is required");
    }

    // Upload to Cloudinary
    const videoUrl = await uploadVideoToCloudinary(file);

    const videoData = {
        userId: req.user.id,
        videoUrl,
        caption: req.body.caption,
        taggedUsers: req.body.taggedUsers,
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
