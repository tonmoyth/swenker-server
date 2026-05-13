import { prisma } from "../../lib/prisma";
import AppError from "../../errors/AppError";
import httpStatus from "http-status";
import { NotificationStatus } from "./notification.interface";

// Reusable select for sender info (excludes sensitive fields)
const senderSelect = {
    id: true,
    username: true,
    fullName: true,
    profileImage: true,
};

// Reusable select for notification fields
const notificationSelect = {
    id: true,
    title: true,
    body: true,
    type: true,
    isRead: true,
    videoId: true,
    storyId: true,
    createdAt: true,
    sender: {
        select: senderSelect,
    },
};

const getMyNotifications = async (userId: string) => {
    const notifications = await prisma.notification.findMany({
        where: {
            receiverId: userId,
        },
        select: notificationSelect,
        orderBy: {
            createdAt: "desc",
        },
    });

    return notifications;
};

const updateNotificationStatus = async (
    userId: string,
    notificationId: string,
    status: NotificationStatus
) => {
    // Find the notification
    const notification = await prisma.notification.findUnique({
        where: { id: notificationId },
    });

    if (!notification) {
        throw new AppError(httpStatus.NOT_FOUND, "Notification not found");
    }

    // Verify ownership
    if (notification.receiverId !== userId) {
        throw new AppError(httpStatus.FORBIDDEN, "You can only update your own notifications");
    }

    // Prevent updating already processed notifications
    if (notification.isRead) {
        throw new AppError(httpStatus.BAD_REQUEST, "Notification has already been processed");
    }

    // Handle FRIEND_REQUEST type notifications with friend status update
    if (notification.type === "FRIEND_REQUEST" && notification.senderId) {
        const result = await prisma.$transaction(async (tx) => {
            // Mark notification as read
            const updatedNotification = await tx.notification.update({
                where: { id: notificationId },
                select: notificationSelect,
                data: {
                    isRead: true,
                },
            });

            // Update the friend request status
            const friendStatus = status === "ACCEPT" ? "ACCEPTED" : "REJECTED";

            await tx.friend.updateMany({
                where: {
                    senderId: notification.senderId!,
                    receiverId: userId,
                    status: "PENDING",
                },
                data: {
                    status: friendStatus,
                },
            });

            // If accepted, create a FRIEND_ACCEPT notification for the original sender
            if (status === "ACCEPT") {
                const receiver = await tx.user.findUnique({
                    where: { id: userId },
                    select: { fullName: true, username: true },
                });

                await tx.notification.create({
                    data: {
                        senderId: userId,
                        receiverId: notification.senderId!,
                        title: "Friend Request Accepted",
                        body: `${receiver?.fullName || receiver?.username || "Someone"} accepted your friend request.`,
                        type: "FRIEND_ACCEPT",
                    },
                });
            }

            return updatedNotification;
        });

        return result;
    }

    // For non-friend-request notifications, just mark as read
    const updatedNotification = await prisma.notification.update({
        where: { id: notificationId },
        select: notificationSelect,
        data: {
            isRead: true,
        },
    });

    return updatedNotification;
};

export const notificationService = {
    getMyNotifications,
    updateNotificationStatus,
};
