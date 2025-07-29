import { Response, NextFunction } from 'express';
import { ClerkExpressRequireAuth } from '@clerk/clerk-sdk-node';
import { AuthenticatedRequest } from '../types';
import prisma from '../utils/prisma';

// This middleware runs AFTER Clerk has verified the token.
// It fetches our internal user from the database and attaches it to the request.
const fetchInternalUser = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.auth?.userId) {
        return res.status(401).json({ message: 'User not authenticated.' });
    }

    try {
        const user = await prisma.user.findUnique({
            where: {
                clerkId: req.auth.userId,
            },
        });

        if (!user) {
            return res.status(404).json({ message: 'User not found in our system.' });
        }

        req.user = user; // Attach Prisma user object to the request
        next();
    } catch (error) {
        console.error("Error fetching internal user:", error);
        return res.status(500).json({ message: 'Failed to retrieve user data.' });
    }
};

// Export a composed auth middleware
export const authMiddleware = [
    ClerkExpressRequireAuth(),
    fetchInternalUser
];
