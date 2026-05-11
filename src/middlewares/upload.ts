import { v2 as cloudinary } from 'cloudinary';
import multer from 'multer';
import { envVeriables } from '../config/envConfig';

// Cloudinary Configuration
cloudinary.config({
    cloud_name: envVeriables.CLOUDINARY_CLOUD_NAME,
    api_key: envVeriables.CLOUDINARY_API_KEY,
    api_secret: envVeriables.CLOUDINARY_API_SECRET,
});

// Multer Storage Configuration (Memory Storage)
const storage = multer.memoryStorage();
export const upload = multer({ storage });

// Cloudinary Upload Utility
export const uploadToCloudinary = async (file: Express.Multer.File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
            {
                folder: 'swenker-profiles',
            },
            (error, result) => {
                if (error) return reject(error);
                if (result) resolve(result.secure_url);
            }
        );

        uploadStream.end(file.buffer);
    });
};
