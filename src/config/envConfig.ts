import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env') });

interface IEnvReturnType {
    PORT: string;
    DATABASE_URL: string;
    BETTER_AUTH_SECRET: string;
    BETTER_AUTH_URL: string;
    CLOUDINARY_CLOUD_NAME: string;
    CLOUDINARY_API_KEY: string;
    CLOUDINARY_API_SECRET: string;
    JWT_SECRET_KEY: string;
    JWT_EXPIRES_IN: string;
    JWT_REFRESH_SECRET_KEY: string;
    JWT_REFRESH_EXPIRES_IN: string;
}

const envConfig = (): IEnvReturnType => {
    const envName = [
        "PORT",
        "DATABASE_URL",
        "BETTER_AUTH_SECRET",
        "BETTER_AUTH_URL",
        "CLOUDINARY_CLOUD_NAME",
        "CLOUDINARY_API_KEY",
        "CLOUDINARY_API_SECRET",
        "JWT_SECRET_KEY",
        "JWT_EXPIRES_IN",
        "JWT_REFRESH_SECRET_KEY",
        "JWT_REFRESH_EXPIRES_IN",
    ];
    envName.forEach((element) => {
        if (!process.env[element]) {
            throw new Error(`Missing environment variable: ${element}`);
        }
    });

    return {
        PORT: process.env.PORT!,
        DATABASE_URL: process.env.DATABASE_URL!,
        BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET!,
        BETTER_AUTH_URL: process.env.BETTER_AUTH_URL!,
        CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME!,
        CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY!,
        CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET!,
        JWT_SECRET_KEY: process.env.JWT_SECRET_KEY!,
        JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN!,
        JWT_REFRESH_SECRET_KEY: process.env.JWT_REFRESH_SECRET_KEY!,
        JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN!,
    };
};

export const envVeriables = envConfig();