import express from "express";
import { userController } from "./user.controller";
import { upload } from "../../middlewares/upload";
import validateRequest from "../../middlewares/validateRequest";
import { userRegisterSchema, userLoginSchema, forgotPasswordSchema, resetPasswordSchema, addFriendSchema, getFriendsSchema, updateProfileSchema } from "./user.validation";
import { checkAuth } from "../../middlewares/checkAuth";

const router = express.Router();

router.post(
    "/register",
    upload.single("profileImage"),
    (req, res, next) => {
        if (req.body.data) {
            req.body = JSON.parse(req.body.data);
        }
        next();
    },
    validateRequest(userRegisterSchema),
    userController.registerUser
);

router.post(
    "/login",
    validateRequest(userLoginSchema),
    userController.loginUser
);

router.post(
    "/logout",
    userController.logoutUser
);

router.post(
    "/forgot-password",
    validateRequest(forgotPasswordSchema),
    userController.forgotPassword
);

router.post(
    "/reset-password",
    validateRequest(resetPasswordSchema),
    userController.resetPassword
);

router.get(
    "/recent-users",
    checkAuth(),
    userController.getRecentUsers
);

router.get(
    "/me",
    checkAuth(),
    userController.getProfile
);

router.patch(
    "/me",
    checkAuth(),
    upload.single("profileImage"),
    (req, res, next) => {
        if (req.body.data) {
            req.body = JSON.parse(req.body.data);
        }
        next();
    },
    validateRequest(updateProfileSchema),
    userController.updateProfile
);

router.post(
    "/add-friend",
    checkAuth(),
    validateRequest(addFriendSchema),
    userController.addFriend
);

router.get(
    "/friends",
    checkAuth(),
    userController.getFriends
);

export const userRoutes = router;
