import express from "express";
import { userRoutes } from "../modules/User/user.route";
import { videoRoutes } from "../modules/video/video.route";
import { notificationRoutes } from "../modules/notification/notification.route";

const router = express.Router();

const moduleRoutes = [
    {
        path: "/user",
        route: userRoutes,
    },
    {
        path: "/videos",
        route: videoRoutes,
    },
    {
        path: "/notifications",
        route: notificationRoutes,
    },
];

moduleRoutes.forEach((route) => router.use(route.path, route.route));

export default router;
