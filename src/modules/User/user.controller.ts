import { Request, Response } from "express";
import "multer";
import { catchAsync } from "../../shared/catchAsync";
import { userService } from "./user.service";
import { uploadToCloudinary } from "../../middlewares/upload";
import { tokenUtils } from "../../utils/token";
import { cookieUtil } from "../../utils/cookie";
import sendResponse from "../../utils/sendResponse";
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

    sendResponse(res, {
        statusCode: httpStatus.CREATED,
        success: true,
        message: "User registered successfully",
        data: result,
    });
});

const loginUser = catchAsync(async (req: Request, res: Response) => {
    const result = await userService.loginUser(req.body);
    const { user, token } = result;

    const jwtPayload = {
        id: user.id,
        email: user.email,
        role: user.role,
        username: user.username,
    };

    const accessToken = tokenUtils.getToken(jwtPayload);
    const refreshToken = tokenUtils.getRefreshToken(jwtPayload);

    // Set tokens in cookies
    tokenUtils.setTokenCookie(res, accessToken);
    tokenUtils.setRefreshTokenCookie(res, refreshToken);
    tokenUtils.setBetterAuthSession(res, token);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "User logged in successfully",
        data: user,
        token: accessToken,
        refreshToken,
        sessionToken: token,
    });
});

const logoutUser = catchAsync(async (req: Request, res: Response) => {
    // Call service to invalidate Better Auth session
    await userService.logoutUser(req.headers as unknown as Headers);

    // Clear authentication cookies
    cookieUtil.clearCookie(res, "accessToken", { path: "/" });
    cookieUtil.clearCookie(res, "refreshToken", { path: "/" });
    cookieUtil.clearCookie(res, "better-auth.session_token", { path: "/" });

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "User logged out successfully",
        data: null,
    });
});

const forgotPassword = catchAsync(async (req: Request, res: Response) => {
    const { email } = req.body;
    await userService.forgotPassword(email);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "OTP sent successfully",
        data: null,
    });
});

const resetPassword = catchAsync(async (req: Request, res: Response) => {
    await userService.resetPassword(req.body);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Password reset successfully",
        data: null,
    });
});

const getRecentUsers = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user.id;
    const result = await userService.getRecentUsers(userId);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Recent users fetched successfully",
        data: result,
    });
});

const addFriend = catchAsync(async (req: Request, res: Response) => {
    const senderId = req.user.id;
    const { receiverId } = req.body;
    const result = await userService.addFriend(senderId, receiverId);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Friend request sent successfully",
        data: result,
    });
});

const getFriends = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user.id;
    const { searchTerm } = req.query;

    const result = await userService.getFriends(userId, searchTerm as string);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Friends fetched successfully",
        data: result,
    });
});

const getProfile = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user.id;
    const result = await userService.getProfile(userId);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Profile fetched successfully",
        data: result,
    });
});

const updateProfile = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user.id;
    const userData = req.body;
    const file = req.file;

    if (file) {
        const imageUrl = await uploadToCloudinary(file);
        userData.profileImage = imageUrl;
    }

    const result = await userService.updateProfile(userId, userData);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Profile updated successfully",
        data: result,
    });
});

export const userController = {
    registerUser,
    loginUser,
    logoutUser,
    forgotPassword,
    resetPassword,
    getRecentUsers,
    addFriend,
    getFriends,
    getProfile,
    updateProfile,
};