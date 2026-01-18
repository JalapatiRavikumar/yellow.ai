import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import { authMiddleware, adminMiddleware, AuthRequest } from '../middleware/auth.js';
import User from '../models/User.js';
import Project from '../models/Project.js';
import Conversation from '../models/Conversation.js';
import Message from '../models/Message.js';
import File from '../models/File.js';
import Prompt from '../models/Prompt.js';

const router = Router();

// Get platform statistics
router.get('/stats', authMiddleware, adminMiddleware, async (req: AuthRequest, res: Response) => {
    try {
        const [
            totalUsers,
            totalProjects,
            totalConversations,
            totalMessages,
            totalFiles
        ] = await Promise.all([
            User.countDocuments(),
            Project.countDocuments(),
            Conversation.countDocuments(),
            Message.countDocuments(),
            File.countDocuments()
        ]);

        res.json({
            users: totalUsers,
            projects: totalProjects,
            conversations: totalConversations,
            messages: totalMessages,
            files: totalFiles
        });
    } catch (error) {
        console.error('Get stats error:', error);
        res.status(500).json({ error: 'Failed to get statistics' });
    }
});

// Get all users
router.get('/users', authMiddleware, adminMiddleware, async (req: AuthRequest, res: Response) => {
    try {
        const users = await User.find()
            .select('-password')
            .sort({ createdAt: -1 })
            .lean();

        // Get stats for each user
        const usersWithStats = await Promise.all(
            users.map(async (user) => {
                const projectsCount = await Project.countDocuments({ userId: user._id });
                return {
                    ...user,
                    id: user._id.toString(),
                    _count: {
                        projects: projectsCount
                    }
                };
            })
        );

        res.json({ users: usersWithStats });
    } catch (error) {
        console.error('Get users error:', error);
        res.status(500).json({ error: 'Failed to get users' });
    }
});

// Delete user
router.delete('/users/:id', authMiddleware, adminMiddleware, async (req: AuthRequest, res: Response) => {
    try {
        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Prevent deleting self
        if (user._id.toString() === req.userId) {
            return res.status(400).json({ error: 'Cannot delete your own account' });
        }

        // Delete all user data (cascade manually since we're using Mongoose)
        const projects = await Project.find({ userId: user._id });

        for (const project of projects) {
            // Delete project related data
            await Promise.all([
                Prompt.deleteMany({ projectId: project._id }),
                Conversation.deleteMany({ projectId: project._id }),
                File.deleteMany({ projectId: project._id })
            ]);

            // Delete messages for project conversations
            const conversations = await Conversation.find({ projectId: project._id });
            await Message.deleteMany({
                conversationId: { $in: conversations.map(c => c._id) }
            });
        }

        // Delete projects
        await Project.deleteMany({ userId: user._id });

        // Delete user
        await User.deleteOne({ _id: user._id });

        res.json({ message: 'User deleted successfully' });
    } catch (error) {
        console.error('Delete user error:', error);
        res.status(500).json({ error: 'Failed to delete user' });
    }
});

// Reset user password
router.put('/users/:id/reset-password', authMiddleware, adminMiddleware, async (req: AuthRequest, res: Response) => {
    try {
        const { newPassword } = req.body;

        if (!newPassword || newPassword.length < 6) {
            return res.status(400).json({ error: 'Password must be at least 6 characters' });
        }

        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 12);
        user.password = hashedPassword;
        await user.save();

        res.json({ message: 'Password reset successfully' });
    } catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({ error: 'Failed to reset password' });
    }
});

export default router;
