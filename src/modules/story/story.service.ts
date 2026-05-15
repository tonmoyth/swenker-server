import { prisma } from "../../lib/prisma";
import { IStoryCreate } from "./story.interface";
import AppError from "../../errors/AppError";
import httpStatus from "http-status";

const createStory = async (payload: IStoryCreate) => {
    const { userId, mediaUrl, caption, taggedUsers } = payload;

    // Set expiration time to 24 hours from now
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const result = await prisma.$transaction(async (tx) => {
        // 1. Create Story
        const story = await tx.story.create({
            data: {
                userId,
                mediaUrl,
                caption,
                expiresAt,
            },
        });

        // 2. Handle Tagged Users
        if (taggedUsers && taggedUsers.length > 0) {
            // Prevent duplicate tagged users
            const uniqueTaggedUsers = [...new Set(taggedUsers)];

            // Validate tagged users exist and are active
            const activeUsers = await tx.user.findMany({
                where: {
                    id: { in: uniqueTaggedUsers },
                    isActive: true,
                },
                select: { id: true, fullName: true, username: true },
            });

            if (activeUsers.length !== uniqueTaggedUsers.length) {
                throw new AppError(httpStatus.BAD_REQUEST, "One or more tagged users are invalid or inactive");
            }

            // Create StoryTag records
            await tx.storyTag.createMany({
                data: uniqueTaggedUsers.map((taggedUserId) => ({
                    storyId: story.id,
                    taggedUserId,
                })),
            });

            // Get sender info for notification
            const sender = await tx.user.findUnique({
                where: { id: userId },
                select: { fullName: true, username: true },
            });

            // Create Notifications
            await tx.notification.createMany({
                data: uniqueTaggedUsers.map((taggedUserId) => ({
                    senderId: userId,
                    receiverId: taggedUserId,
                    title: "Story Tag",
                    body: `${sender?.fullName || sender?.username || "Someone"} tagged you in a story.`,
                    type: "STORY_TAG",
                    storyId: story.id,
                })),
            });
        }

        // 3. Return story with tags (optimized query)
        return tx.story.findUnique({
            where: { id: story.id },
            include: {
                tags: {
                    include: {
                        taggedUser: {
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

export const storyService = {
    createStory,
};
