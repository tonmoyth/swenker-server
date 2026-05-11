import { auth } from "../../lib/auth";
import { prisma } from "../../lib/prisma";
import { IUserRegistration } from "./user.interface";
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

export const userService = {
    signUpEmail,
};