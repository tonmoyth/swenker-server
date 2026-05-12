import { prisma } from "../../lib/prisma";
import { IVideoPost } from "./video.interface";
import AppError from "../../errors/AppError";
import httpStatus from "http-status";

const createVideoPost = async (payload: IVideoPost) => {
    const { userId, videoUrl, caption, taggedUsers } = payload;

    // Start Prisma Transaction
    const result = await prisma.$transaction(async (tx) => {
        // 1. Create Video
        const video = await tx.video.create({
            data: {
                userId,
                videoUrl,
                caption,
            },
        });

        // 2. Handle Tagged Users
        if (taggedUsers && taggedUsers.length > 0) {
            // Remove duplicates from request
            const uniqueTaggedUsers = [...new Set(taggedUsers)];

            // Validate users exist
            const usersCount = await tx.user.count({
                where: {
                    id: { in: uniqueTaggedUsers },
                    isActive: true,
                },
            });

            if (usersCount !== uniqueTaggedUsers.length) {
                throw new AppError(httpStatus.BAD_REQUEST, "One or more tagged users are invalid or inactive");
            }

            // Create VideoTag records
            await tx.videoTag.createMany({
                data: uniqueTaggedUsers.map((id) => ({
                    videoId: video.id,
                    userId: id,
                })),
            });
        }

        // Return video with tags
        return tx.video.findUnique({
            where: { id: video.id },
            include: {
                tags: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                username: true,
                                fullName: true,
                                profileImage: true,
                            },
                        },
                    },
                },
            },
        });
    });

    return result;
};

export const videoService = {
    createVideoPost,
};
