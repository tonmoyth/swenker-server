import { Request, Response, NextFunction } from 'express';
import { catchAsync } from '../shared/catchAsync';

import { prisma } from '../lib/prisma';
import AppError from '../errors/AppError';

declare global {
    namespace Express {
        interface Request {
            user?: any;
        }
    }
}

export const checkAuth = () => {
    return catchAsync(async (req: Request, res: Response, next: NextFunction) => {
        const token = req.cookies['better-auth.session_token'] ||
            req.cookies['sessionToken'] ||
            req.headers.authorization?.split(' ')[1];

        if (!token) {
            throw new AppError(401, 'You are not authorized');
        }

        const session = await prisma.session.findFirst({
            where: { token },
            include: { user: true }
        });

        if (!session || !session.user) {
            throw new AppError(401, 'You are not authorized');
        }

        if (session.expiresAt < new Date()) {
            throw new AppError(401, 'Session expired');
        }

        req.user = session.user;
        next();
    });
};