import { auth } from "../../lib/auth";
import { prisma } from "../../lib/prisma";
import { IUserLogin, IUserRegistration } from "./user.interface";
import AppError from "../../errors/AppError";
import httpStatus from "http-status";

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

export const userService = {
    signUpEmail,
    loginUser,
    logoutUser,
    forgotPassword,
    resetPassword,
};