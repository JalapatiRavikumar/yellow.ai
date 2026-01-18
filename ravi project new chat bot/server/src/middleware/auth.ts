import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export interface AuthRequest extends Request {
    userId?: string;
}

export interface JWTPayload {
    userId: string;
    role: string;
}

export const authMiddleware = (
    req: AuthRequest,
    res: Response,
    next: NextFunction
) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'Authorization token required' });
        }

        const token = authHeader.split(' ')[1];
        const secret = process.env.JWT_SECRET || 'fallback-secret';

        const decoded = jwt.verify(token, secret) as JWTPayload;
        req.userId = decoded.userId;

        next();
    } catch (error) {
        return res.status(401).json({ error: 'Invalid or expired token' });
    }
};

export const generateToken = (userId: string, role: string = 'user'): string => {
    const secret = process.env.JWT_SECRET || 'fallback-secret';
    return jwt.sign({ userId, role }, secret, { expiresIn: '7d' });
};
// Middleware to check if user is admin
export const adminMiddleware = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
) => {
    try {
        // Find user
        const user = await User.findById(req.userId);

        if (!user || user.role !== 'admin') {
            return res.status(403).json({ error: 'Access denied: Admin privileges required' });
        }

        next();
    } catch (error) {
        console.error('Admin middleware error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
