import { Router, Response } from 'express';
import { z } from 'zod';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';
import Project from '../models/Project.js';
import Prompt from '../models/Prompt.js';
import Conversation from '../models/Conversation.js';
import Message from '../models/Message.js';
import File from '../models/File.js';

const router = Router();

// Validation schemas
const createProjectSchema = z.object({
    name: z.string().min(1, 'Project name is required'),
    description: z.string().optional(),
    systemPrompt: z.string().optional(),
    aiModel: z.string().optional()
});

const updateProjectSchema = z.object({
    name: z.string().min(1).optional(),
    description: z.string().optional(),
    systemPrompt: z.string().optional(),
    aiModel: z.string().optional()
});

// Get all projects for current user
router.get('/', authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
        const projects = await Project.find({ userId: req.userId })
            .sort({ updatedAt: -1 })
            .lean();

        // Get counts for each project
        const projectsWithCounts = await Promise.all(
            projects.map(async (project) => {
                const [promptsCount, conversationsCount, filesCount] = await Promise.all([
                    Prompt.countDocuments({ projectId: project._id }),
                    Conversation.countDocuments({ projectId: project._id }),
                    File.countDocuments({ projectId: project._id })
                ]);

                return {
                    ...project,
                    id: project._id.toString(),
                    _count: {
                        prompts: promptsCount,
                        conversations: conversationsCount,
                        files: filesCount
                    }
                };
            })
        );

        res.json({ projects: projectsWithCounts });
    } catch (error) {
        console.error('Get projects error:', error);
        res.status(500).json({ error: 'Failed to get projects' });
    }
});

// Create new project
router.post('/', authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
        const validation = createProjectSchema.safeParse(req.body);
        if (!validation.success) {
            return res.status(400).json({
                error: 'Validation failed',
                details: validation.error.errors
            });
        }

        const { name, description, systemPrompt, aiModel } = validation.data;

        const project = await Project.create({
            name,
            description,
            systemPrompt: systemPrompt || 'You are a helpful AI assistant.',
            aiModel: aiModel || 'openai/gpt-3.5-turbo',
            userId: req.userId
        });

        res.status(201).json({
            message: 'Project created successfully',
            project: {
                ...project.toJSON(),
                id: project._id.toString()
            }
        });
    } catch (error) {
        console.error('Create project error:', error);
        res.status(500).json({ error: 'Failed to create project' });
    }
});

// Get single project
router.get('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
        const project = await Project.findOne({
            _id: req.params.id,
            userId: req.userId
        }).lean();

        if (!project) {
            return res.status(404).json({ error: 'Project not found' });
        }

        // Get related data
        const [prompts, conversations, filesCount] = await Promise.all([
            Prompt.find({ projectId: project._id }).lean(),
            Conversation.find({ projectId: project._id })
                .sort({ updatedAt: -1 })
                .limit(10)
                .lean(),
            File.countDocuments({ projectId: project._id })
        ]);

        res.json({
            project: {
                ...project,
                id: project._id.toString(),
                prompts: prompts.map(p => ({ ...p, id: p._id.toString() })),
                conversations: conversations.map(c => ({ ...c, id: c._id.toString() })),
                _count: {
                    files: filesCount
                }
            }
        });
    } catch (error) {
        console.error('Get project error:', error);
        res.status(500).json({ error: 'Failed to get project' });
    }
});

// Update project
router.put('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
        const validation = updateProjectSchema.safeParse(req.body);
        if (!validation.success) {
            return res.status(400).json({
                error: 'Validation failed',
                details: validation.error.errors
            });
        }

        // Check ownership and update
        const project = await Project.findOneAndUpdate(
            {
                _id: req.params.id,
                userId: req.userId
            },
            { $set: validation.data },
            { new: true }
        );

        if (!project) {
            return res.status(404).json({ error: 'Project not found' });
        }

        res.json({
            message: 'Project updated successfully',
            project: {
                ...project.toJSON(),
                id: project._id.toString()
            }
        });
    } catch (error) {
        console.error('Update project error:', error);
        res.status(500).json({ error: 'Failed to update project' });
    }
});

// Delete project
router.delete('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
        // Check ownership
        const project = await Project.findOne({
            _id: req.params.id,
            userId: req.userId
        });

        if (!project) {
            return res.status(404).json({ error: 'Project not found' });
        }

        // Delete related data first (cascade delete)
        await Promise.all([
            Prompt.deleteMany({ projectId: project._id }),
            Conversation.deleteMany({ projectId: project._id }),
            File.deleteMany({ projectId: project._id })
        ]);

        // Delete conversations' messages
        // Delete conversations' messages
        const conversations = await Conversation.find({ projectId: project._id });
        await Message.deleteMany({
            conversationId: { $in: conversations.map(c => c._id) }
        });

        // Delete project
        await Project.deleteOne({ _id: project._id });

        res.json({ message: 'Project deleted successfully' });
    } catch (error) {
        console.error('Delete project error:', error);
        res.status(500).json({ error: 'Failed to delete project' });
    }
});

export default router;
