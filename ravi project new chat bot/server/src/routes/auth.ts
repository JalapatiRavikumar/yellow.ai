import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { authMiddleware, generateToken, AuthRequest } from '../middleware/auth.js';
import User from '../models/User.js';
import Project from '../models/Project.js';

const router = Router();

// Validation schemas
const registerSchema = z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    name: z.string().min(2, 'Name must be at least 2 characters')
});

const loginSchema = z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(1, 'Password is required')
});

// Register new user
router.post('/register', async (req: Request, res: Response) => {
    try {
        // Validate input
        const validation = registerSchema.safeParse(req.body);
        if (!validation.success) {
            return res.status(400).json({
                error: 'Validation failed',
                details: validation.error.errors
            });
        }

        const { email, password, name } = validation.data;

        // Check if user exists
        const existingUser = await User.findOne({ email: email.toLowerCase() });

        if (existingUser) {
            return res.status(400).json({ error: 'Email already registered' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 12);

        // Create user
        const user = await User.create({
            email,
            password: hashedPassword,
            name,
            role: 'user' // Force role to user, ignoring request body
        });

        // Generate token
        const token = generateToken(user._id.toString(), user.role);

        res.status(201).json({
            message: 'User created successfully',
            user: {
                id: user._id,
                email: user.email,
                name: user.name,
                role: user.role,
                createdAt: user.createdAt
            },
            token
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Failed to register user' });
    }
});

// Login user
router.post('/login', async (req: Request, res: Response) => {
    try {
        // Validate input
        const validation = loginSchema.safeParse(req.body);
        if (!validation.success) {
            return res.status(400).json({
                error: 'Validation failed',
                details: validation.error.errors
            });
        }

        const { email, password } = validation.data;

        // Find user
        const user = await User.findOne({ email: email.toLowerCase() });

        if (!user) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        // Verify password
        const isValidPassword = await bcrypt.compare(password, user.password);

        if (!isValidPassword) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        // Generate token
        const token = generateToken(user._id.toString(), user.role);

        res.json({
            message: 'Login successful',
            user: {
                id: user._id,
                email: user.email,
                name: user.name,
                role: user.role,
                createdAt: user.createdAt
            },
            token
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Failed to login' });
    }
});

// Get current user
router.get('/me', authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
        const user = await User.findById(req.userId).select('-password');

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Get project count
        // Get project count
        const projectCount = await Project.countDocuments({ userId: user._id });

        res.json({
            user: {
                id: user._id,
                email: user.email,
                name: user.name,
                role: user.role,
                createdAt: user.createdAt,
                _count: {
                    projects: projectCount
                }
            }
        });
    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({ error: 'Failed to get user' });
    }
});

// Create admin user directly
router.post('/create-admin', async (req: Request, res: Response) => {
    try {
        const { email, password, name, secretKey } = req.body;

        // Verify secret key
        if (secretKey !== process.env.ADMIN_SECRET_KEY) {
            return res.status(403).json({ error: 'Unauthorized: Invalid admin secret key' });
        }

        // Validate input
        if (!email || !password || !name) {
            return res.status(400).json({ error: 'Email, password, and name are required' });
        }

        if (password.length < 6) {
            return res.status(400).json({ error: 'Password must be at least 6 characters' });
        }

        // Check if user exists
        const existingUser = await User.findOne({ email: email.toLowerCase() });
        if (existingUser) {
            return res.status(400).json({ error: 'Email already registered' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 12);

        // Create admin user
        const user = await User.create({
            email,
            password: hashedPassword,
            name,
            role: 'admin'
        });

        // Generate token
        const token = generateToken(user._id.toString(), user.role);

        res.status(201).json({
            message: 'Admin user created successfully',
            user: {
                id: user._id,
                email: user.email,
                name: user.name,
                role: user.role,
                createdAt: user.createdAt
            },
            token
        });
    } catch (error) {
        console.error('Create admin error:', error);
        res.status(500).json({ error: 'Failed to create admin user' });
    }
});

export default router;
