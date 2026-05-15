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

            // Create VIDEO_TAG notifications for tagged users
            const sender = await tx.user.findUnique({
                where: { id: userId },
                select: { fullName: true, username: true },
            });

            await tx.notification.createMany({
                data: uniqueTaggedUsers.map((taggedUserId) => ({
                    senderId: userId,
                    receiverId: taggedUserId,
                    title: "You were tagged in a video",
                    body: `${sender?.fullName || sender?.username || "Someone"} tagged you in a video.`,
                    type: "VIDEO_TAG" as const,
                    videoId: video.id,
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

const getReelsFeed = async (cursor?: string) => {
    const limit = 5;
    
    const videos = await prisma.video.findMany({
        take: limit + 1,
        cursor: cursor ? { id: cursor } : undefined,
        skip: cursor ? 1 : 0,
        orderBy: {
            createdAt: 'desc',
        },
        include: {
            user: {
                select: {
                    id: true,
                    username: true,
                    fullName: true,
                    profileImage: true,
                    isVerified: true,
                },
            },
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
            _count: {
                select: {
                    reactions: true,
                    reports: true,
                    tags: true,
                },
            },
        },
    });

    let nextCursor: string | null = null;
    if (videos.length > limit) {
        const nextItem = videos.pop();
        nextCursor = nextItem?.id || null;
    }

    const formattedVideos = videos.map((video) => ({
        id: video.id,
        videoUrl: video.videoUrl,
        caption: video.caption,
        createdAt: video.createdAt,
        user: video.user,
        reactionsCount: video._count.reactions,
        reportsCount: video._count.reports,
        tagsCount: video._count.tags,
        tags: video.tags.map((tag) => tag.user),
    }));

    return {
        videos: formattedVideos,
        nextCursor,
    };
};

export const videoService = {
    createVideoPost,
    getReelsFeed,
};
