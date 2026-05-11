import { Request, Response } from "express";
import "multer"; // Ensures Express.Request is augmented with .file
import { catchAsync } from "../../shared/catchAsync";
import { userService } from "./user.service";
import { uploadToCloudinary } from "../../middlewares/upload";
import httpStatus from "http-status";

const registerUser = catchAsync(async (req: Request, res: Response) => {
    const userData = req.body;
    const file = req.file;

    // Handle profile image upload to Cloudinary if file exists
    if (file) {
        const imageUrl = await uploadToCloudinary(file);
        userData.profileImage = imageUrl;
    }

    const result = await userService.signUpEmail(userData);

    res.status(httpStatus.CREATED).json({
        success: true,
        message: "User registered successfully",
        data: result,
    });
});

export const userController = {
    registerUser,
};