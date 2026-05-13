import { Request, Response } from "express";
import { catchAsync } from "../../shared/catchAsync";
import { notificationService } from "./notification.service";
import sendResponse from "../../utils/sendResponse";
import httpStatus from "http-status";

const getMyNotifications = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user.id;

    const result = await notificationService.getMyNotifications(userId);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Notifications fetched successfully",
        data: result,
    });
});

const updateNotificationStatus = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user.id;
    const { notificationId } = req.params;
    const { status } = req.body;

    const result = await notificationService.updateNotificationStatus(
        userId,
        notificationId as string,
        status
    );

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Notification updated successfully",
        data: result,
    });
});

export const notificationController = {
    getMyNotifications,
    updateNotificationStatus,
};
