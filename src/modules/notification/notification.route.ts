import express from "express";
import { notificationController } from "./notification.controller";
import { checkAuth } from "../../middlewares/checkAuth";
import validateRequest from "../../middlewares/validateRequest";
import { updateNotificationStatusSchema } from "./notification.validation";

const router = express.Router();

router.get(
    "/",
    checkAuth(),
    notificationController.getMyNotifications
);

router.patch(
    "/:notificationId/status",
    checkAuth(),
    validateRequest(updateNotificationStatusSchema),
    notificationController.updateNotificationStatus
);

export const notificationRoutes = router;
