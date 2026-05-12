import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { emailOTP } from "better-auth/plugins";
import nodemailer from "nodemailer";

import { prisma } from "./prisma";
import { envVeriables } from "../config/envConfig";

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: envVeriables.EMAIL_USER,
        pass: envVeriables.EMAIL_PASS,
    },
});

export const auth = betterAuth({
    database: prismaAdapter(prisma, {
        provider: "postgresql",
    }),
    user: {
        fields: {
            name: "fullName",
            image: "profileImage",
        },
        additionalFields: {
            username: {
                type: "string",
                required: true,
            },
            bio: {
                type: "string",
                required: false,
            },
            role: {
                type: "string",
                required: false,
            },
            isActive: {
                type: "boolean",
                required: false,
            },
            isVerified: {
                type: "boolean",
                required: false,
            },
        },
    },

    emailAndPassword: {
        enabled: true,
    },

    plugins: [
        emailOTP({
            async sendVerificationOTP({ email, otp, type }) {
                const subject = type === "forget-password" ? "Reset your password" : "Email Verification";
                const text = `Your OTP for ${type} is: ${otp}`;

                await transporter.sendMail({
                    from: `"Swenker" <${envVeriables.EMAIL_FROM}>`,
                    to: email,
                    subject,
                    text,
                });
            },
        }),
    ],
});