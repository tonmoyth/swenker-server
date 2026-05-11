import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";

import { prisma } from "./prisma";

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
    }
});