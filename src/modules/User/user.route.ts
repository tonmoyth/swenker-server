import express from "express";
import { userController } from "./user.controller";
import { upload } from "../../middlewares/upload";
import validateRequest from "../../middlewares/validateRequest";
import { userRegisterSchema, userLoginSchema } from "./user.validation";

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

export const userRoutes = router;
