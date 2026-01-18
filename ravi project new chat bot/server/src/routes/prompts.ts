import { Router, Response } from 'express';
import { z } from 'zod';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';
import Prompt from '../models/Prompt.js';
import Project from '../models/Project.js';

const router = Router();

// Validation schemas
const createPromptSchema = z.object({
    name: z.string().min(1, 'Prompt name is required'),
    content: z.string().min(1, 'Prompt content is required')
});

const updatePromptSchema = z.object({
    name: z.string().min(1).optional(),
    content: z.string().min(1).optional()
});

// Get all prompts for a project
router.get('/project/:projectId', authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
        // Verify project ownership
        const project = await Project.findOne({
            _id: req.params.projectId,
            userId: req.userId
        });

        if (!project) {
            return res.status(404).json({ error: 'Project not found' });
        }

        const prompts = await Prompt.find({ projectId: req.params.projectId })
            .sort({ createdAt: -1 })
            .lean();

        res.json({
            prompts: prompts.map(p => ({ ...p, id: p._id.toString() }))
        });
    } catch (error) {
        console.error('Get prompts error:', error);
        res.status(500).json({ error: 'Failed to get prompts' });
    }
});

// Create new prompt
router.post('/project/:projectId', authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
        const validation = createPromptSchema.safeParse(req.body);
        if (!validation.success) {
            return res.status(400).json({
                error: 'Validation failed',
                details: validation.error.errors
            });
        }

        // Verify project ownership
        const project = await Project.findOne({
            _id: req.params.projectId,
            userId: req.userId
        });

        if (!project) {
            return res.status(404).json({ error: 'Project not found' });
        }

        const { name, content } = validation.data;

        const prompt = await Prompt.create({
            name,
            content,
            projectId: req.params.projectId
        });

        res.status(201).json({
            message: 'Prompt created successfully',
            prompt: {
                ...prompt.toJSON(),
                id: prompt._id.toString()
            }
        });
    } catch (error) {
        console.error('Create prompt error:', error);
        res.status(500).json({ error: 'Failed to create prompt' });
    }
});

// Update prompt
router.put('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
        const validation = updatePromptSchema.safeParse(req.body);
        if (!validation.success) {
            return res.status(400).json({
                error: 'Validation failed',
                details: validation.error.errors
            });
        }

        // Verify prompt ownership through project
        const prompt = await Prompt.findById(req.params.id);
        if (!prompt) {
            return res.status(404).json({ error: 'Prompt not found' });
        }

        const project = await Project.findOne({
            _id: prompt.projectId,
            userId: req.userId
        });

        if (!project) {
            return res.status(404).json({ error: 'Prompt not found' });
        }

        const updated = await Prompt.findByIdAndUpdate(
            req.params.id,
            { $set: validation.data },
            { new: true }
        );

        res.json({
            message: 'Prompt updated successfully',
            prompt: {
                ...updated!.toJSON(),
                id: updated!._id.toString()
            }
        });
    } catch (error) {
        console.error('Update prompt error:', error);
        res.status(500).json({ error: 'Failed to update prompt' });
    }
});

// Delete prompt
router.delete('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
        // Verify prompt ownership through project
        const prompt = await Prompt.findById(req.params.id);
        if (!prompt) {
            return res.status(404).json({ error: 'Prompt not found' });
        }

        const project = await Project.findOne({
            _id: prompt.projectId,
            userId: req.userId
        });

        if (!project) {
            return res.status(404).json({ error: 'Prompt not found' });
        }

        await Prompt.deleteOne({ _id: req.params.id });

        res.json({ message: 'Prompt deleted successfully' });
    } catch (error) {
        console.error('Delete prompt error:', error);
        res.status(500).json({ error: 'Failed to delete prompt' });
    }
});

export default router;
