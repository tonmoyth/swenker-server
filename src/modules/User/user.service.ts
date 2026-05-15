import { auth } from "../../lib/auth";
import { prisma } from "../../lib/prisma";
import { IUserLogin, IUserRegistration } from "./user.interface";
import AppError from "../../errors/AppError";
import httpStatus from "http-status";
import { NotificationType, ReportReason } from "../../generated/prisma/enums";

const signUpEmail = async (userData: IUserRegistration) => {
    // Check if username already exists
    const existingUsername = await prisma.user.findUnique({
        where: {
            username: userData.username,
        },
    });

    if (existingUsername) {
        throw new AppError(httpStatus.CONFLICT, "Username already exists");
    }

    // Check if email already exists
    const existingEmail = await prisma.user.findUnique({
        where: {
            email: userData.email,
        },
    });

    if (existingEmail) {
        throw new AppError(httpStatus.CONFLICT, "Email already exists");
    }

    // Call Better Auth signUpEmail
    const result = await auth.api.signUpEmail({
        body: {
            email: userData.email,
            password: userData.password,
            name: userData.fullName,
            username: userData.username,
            bio: userData.bio || "",
            image: userData.profileImage || "",
        },
    });

    return result;
};

const loginUser = async (payload: IUserLogin) => {
    const userResponse = await auth.api.signInEmail({
        body: {
            email: payload.email,
            password: payload.password,
        },
    });

    if (!userResponse || !userResponse.user) {
        throw new AppError(httpStatus.UNAUTHORIZED, "Invalid email or password");
    }

    return userResponse;
};

const logoutUser = async (headers: Headers) => {
    await auth.api.signOut({ headers });
};

const forgotPassword = async (email: string) => {
    const user = await prisma.user.findUnique({
        where: { email },
    });

    if (!user) {
        throw new AppError(httpStatus.NOT_FOUND, "User not found");
    }

    if (user.isActive === false) {
        throw new AppError(httpStatus.FORBIDDEN, "Account is inactive");
    }

    const result = await auth.api.requestPasswordResetEmailOTP({
        body: {
            email,
        },
    });

    return result;
};

const resetPassword = async (payload: any) => {
    const { email, otp, newPassword } = payload;

    await auth.api.resetPasswordEmailOTP({
        body: {
            email,
            otp,
            password: newPassword,
        },
    });

    // Find user to delete sessions
    const user = await prisma.user.findUnique({
        where: { email },
    });

    if (user) {
        await prisma.session.deleteMany({
            where: {
                userId: user.id,
            },
        });
    }
};

const getRecentUsers = async (currentUserId: string) => {
    const users = await prisma.user.findMany({
        where: {
            isActive: true,
            NOT: {
                id: currentUserId,
            },
        },
        orderBy: {
            createdAt: "desc",
        },
        take: 10,
        select: {
            id: true,
            username: true,
            fullName: true,
            profileImage: true,
            bio: true,
            createdAt: true,
        },
    });

    return users;
};

const addFriend = async (senderId: string, receiverId: string) => {
    if (senderId === receiverId) {
        throw new AppError(httpStatus.BAD_REQUEST, "You cannot send a friend request to yourself");
    }

    const receiver = await prisma.user.findUnique({
        where: { id: receiverId, isActive: true },
    });

    if (!receiver) {
        throw new AppError(httpStatus.NOT_FOUND, "Receiver not found or inactive");
    }

    const existingRequest = await prisma.friend.findFirst({
        where: {
            OR: [
                { senderId, receiverId },
                { senderId: receiverId, receiverId: senderId },
            ],
        },
    });

    if (existingRequest) {
        throw new AppError(httpStatus.BAD_REQUEST, "Friend request already exists or you are already friends");
    }

    // Fetch sender info for notification message
    const sender = await prisma.user.findUnique({
        where: { id: senderId },
        select: { username: true, fullName: true },
    });

    const result = await prisma.$transaction(async (tx) => {
        // Create the friend request
        const friendRequest = await tx.friend.create({
            data: {
                senderId,
                receiverId,
                status: "PENDING",
            },
        });

        // Create a notification for the receiver
        await tx.notification.create({
            data: {
                senderId,
                receiverId,
                title: "New Friend Request",
                body: `${sender?.fullName || sender?.username || "Someone"} sent you a friend request.`,
                type: "FRIEND_REQUEST",
            },
        });

        return friendRequest;
    });

    return result;
};

const getFriends = async (userId: string, searchTerm?: string) => {
    const friends = await prisma.friend.findMany({
        where: {
            status: "ACCEPTED",
            OR: [
                {
                    senderId: userId,
                    receiver: {
                        isActive: true,
                        OR: searchTerm
                            ? [
                                { username: { contains: searchTerm, mode: "insensitive" } },
                                { fullName: { contains: searchTerm, mode: "insensitive" } },
                            ]
                            : undefined,
                    },
                },
                {
                    receiverId: userId,
                    sender: {
                        isActive: true,
                        OR: searchTerm
                            ? [
                                { username: { contains: searchTerm, mode: "insensitive" } },
                                { fullName: { contains: searchTerm, mode: "insensitive" } },
                            ]
                            : undefined,
                    },
                },
            ],
        },
        include: {
            sender: {
                select: {
                    id: true,
                    username: true,
                    fullName: true,
                    profileImage: true,
                    bio: true,
                    isVerified: true,
                    createdAt: true,
                },
            },
            receiver: {
                select: {
                    id: true,
                    username: true,
                    fullName: true,
                    profileImage: true,
                    bio: true,
                    isVerified: true,
                    createdAt: true,
                },
            },
        },
        orderBy: {
            createdAt: "desc",
        },
    });

    const result = friends.map((f) => {
        const friend = f.senderId === userId ? f.receiver : f.sender;
        return {
            friendshipId: f.id,
            friendshipCreatedAt: f.createdAt,
            friend,
        };
    });

    return result;
};

const getProfile = async (userId: string) => {
    // 1. Fetch user info
    const user = await prisma.user.findUnique({
        where: { id: userId, isActive: true },
        select: {
            id: true,
            username: true,
            fullName: true,
            email: true,
            bio: true,
            profileImage: true,
            role: true,
            isVerified: true,
            createdAt: true,
        },
    });

    if (!user) {
        throw new AppError(httpStatus.NOT_FOUND, "User not found or inactive");
    }

    // 2. Fetch user videos with aggregation counts
    const videosData = await prisma.video.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        select: {
            id: true,
            videoUrl: true,
            caption: true,
            createdAt: true,
            _count: {
                select: {
                    reactions: true,
                    reports: true,
                    tags: true,
                },
            },
        },
    });

    const videos = videosData.map((v) => ({
        id: v.id,
        videoUrl: v.videoUrl,
        caption: v.caption,
        createdAt: v.createdAt,
        reactionCount: v._count.reactions,
        reportCount: v._count.reports,
        taggedUsersCount: v._count.tags,
    }));

    // 3. Fetch user active stories
    const currentDate = new Date();
    const stories = await prisma.story.findMany({
        where: {
            userId,
            expiresAt: {
                gt: currentDate,
            },
        },
        orderBy: { createdAt: "desc" },
        select: {
            id: true,
            mediaUrl: true,
            caption: true,
            createdAt: true,
            expiresAt: true,
        },
    });

    // 4. Fetch accepted friends
    const friendsData = await prisma.friend.findMany({
        where: {
            status: "ACCEPTED",
            OR: [
                { senderId: userId, receiver: { isActive: true } },
                { receiverId: userId, sender: { isActive: true } },
            ],
        },
        orderBy: { createdAt: "desc" },
        include: {
            sender: {
                select: {
                    id: true,
                    username: true,
                    fullName: true,
                    profileImage: true,
                    bio: true,
                    isVerified: true,
                },
            },
            receiver: {
                select: {
                    id: true,
                    username: true,
                    fullName: true,
                    profileImage: true,
                    bio: true,
                    isVerified: true,
                },
            },
        },
    });

    const friends = friendsData.map((f) => (f.senderId === userId ? f.receiver : f.sender));

    return {
        user,
        videoCount: videos.length,
        friendCount: friends.length,
        videos,
        friends,
        stories,
    };
};

const updateProfile = async (userId: string, payload: any) => {
    // Remove fields that shouldn't be updated
    const { email, role, isVerified, password, ...updateData } = payload;

    // Check if user exists and is active
    const user = await prisma.user.findUnique({
        where: { id: userId, isActive: true },
    });

    if (!user) {
        throw new AppError(httpStatus.NOT_FOUND, "User not found or inactive");
    }

    // Validate username uniqueness if provided
    if (updateData.username) {
        const existingUsername = await prisma.user.findFirst({
            where: {
                username: updateData.username,
                id: { not: userId },
            },
        });

        if (existingUsername) {
            throw new AppError(httpStatus.CONFLICT, "Username already exists");
        }
    }

    // Perform the update
    const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: updateData,
        select: {
            id: true,
            username: true,
            fullName: true,
            email: true,
            bio: true,
            profileImage: true,
            isVerified: true,
            createdAt: true,
            updatedAt: true,
        },
    });

    return updatedUser;
};

const createVideoReaction = async (userId: string, videoId: string) => {
    // 1. Validate video existence and get owner info
    const video = await prisma.video.findUnique({
        where: { id: videoId },
        select: { id: true, userId: true },
    });

    if (!video) {
        throw new AppError(httpStatus.NOT_FOUND, "Video not found");
    }

    // 2. Check for existing reaction
    const existingReaction = await prisma.videoReaction.findUnique({
        where: {
            userId_videoId: {
                userId,
                videoId,
            },
        },
    });

    // 3. Handle Toggle Logic
    if (existingReaction) {
        // If already reacted, remove the reaction
        await prisma.videoReaction.delete({
            where: {
                id: existingReaction.id,
            },
        });

        return {
            isRemoved: true,
            message: "Reaction removed successfully",
        };
    }

    // 4. Create reaction and notification in a transaction
    const result = await prisma.$transaction(async (tx) => {
        const reaction = await tx.videoReaction.create({
            data: {
                userId,
                videoId,
            },
        });

        // Fetch sender info for notification
        const sender = await tx.user.findUnique({
            where: { id: userId },
            select: { fullName: true, username: true },
        });

        // Create a notification for the video owner (only if it's not the same user)
        if (video.userId !== userId) {
            await tx.notification.create({
                data: {
                    senderId: userId,
                    receiverId: video.userId,
                    title: "Video Liked",
                    body: `${sender?.fullName || sender?.username || "Someone"} liked your video.`,
                    type: NotificationType.VIDEO_LOVE,
                    videoId: video.id,
                },
            });
        }

        return reaction;
    });

    return result;
};

const createVideoReport = async (userId: string, payload: { videoId: string; reason: any }) => {
    const { videoId, reason } = payload;

    // 1. Validate video existence and get owner info
    const video = await prisma.video.findUnique({
        where: { id: videoId },
        select: { id: true, userId: true },
    });

    if (!video) {
        throw new AppError(httpStatus.NOT_FOUND, "Video not found");
    }

    // 2. Prevent duplicate/spam reports by same user
    const existingReport = await prisma.videoReport.findFirst({
        where: {
            userId,
            videoId,
        },
    });

    if (existingReport) {
        throw new AppError(httpStatus.CONFLICT, "You have already reported this video");
    }

    // 3. Create report and notification in a transaction
    const result = await prisma.$transaction(async (tx) => {
        const report = await tx.videoReport.create({
            data: {
                userId,
                videoId,
                reason,
            },
        });

        // Create a notification for the video owner or moderation system
        // Here we send it to the video owner as a placeholder for moderation alert
        if (video.userId !== userId) {
            await tx.notification.create({
                data: {
                    senderId: userId,
                    receiverId: video.userId,
                    title: "Video Reported",
                    body: `Your video has been reported for: ${reason.replace(/_/g, ' ').toLowerCase()}.`,
                    type: NotificationType.VIDEO_REPORT,
                    videoId: video.id,
                },
            });
        }

        return report;
    });

    return result;
};

export const userService = {
    signUpEmail,
    loginUser,
    logoutUser,
    forgotPassword,
    resetPassword,
    getRecentUsers,
    addFriend,
    getFriends,
    getProfile,
    updateProfile,
    createVideoReaction,
    createVideoReport,
};