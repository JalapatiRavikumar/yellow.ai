import { Router, Response } from 'express';
import { z } from 'zod';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';
import { sendChatMessage, streamChatMessage } from '../services/llm.js';
import Project from '../models/Project.js';
import Prompt from '../models/Prompt.js';
import Conversation from '../models/Conversation.js';
import Message from '../models/Message.js';

const router = Router();

// Validation schemas
const sendMessageSchema = z.object({
    message: z.string().min(1, 'Message is required'),
    conversationId: z.string().optional()
});

// Get conversations for a project
router.get('/project/:projectId/conversations', authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
        // Verify project ownership
        const project = await Project.findOne({
            _id: req.params.projectId,
            userId: req.userId
        });

        if (!project) {
            return res.status(404).json({ error: 'Project not found' });
        }

        const conversations = await Conversation.find({ projectId: req.params.projectId })
            .sort({ updatedAt: -1 })
            .lean();

        // Get message counts for each conversation
        const conversationsWithCounts = await Promise.all(
            conversations.map(async (conv) => {
                const messagesCount = await Message.countDocuments({ conversationId: conv._id });
                return {
                    ...conv,
                    id: conv._id.toString(),
                    _count: { messages: messagesCount }
                };
            })
        );

        res.json({ conversations: conversationsWithCounts });
    } catch (error) {
        console.error('Get conversations error:', error);
        res.status(500).json({ error: 'Failed to get conversations' });
    }
});

// Get messages for a conversation
router.get('/conversations/:conversationId/messages', authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
        // Verify ownership through project
        const conversation = await Conversation.findById(req.params.conversationId);
        if (!conversation) {
            return res.status(404).json({ error: 'Conversation not found' });
        }

        const project = await Project.findOne({
            _id: conversation.projectId,
            userId: req.userId
        });

        if (!project) {
            return res.status(404).json({ error: 'Conversation not found' });
        }

        const messages = await Message.find({ conversationId: req.params.conversationId })
            .sort({ createdAt: 1 })
            .lean();

        res.json({
            messages: messages.map(m => ({ ...m, id: m._id.toString() })),
            conversation: { ...conversation.toJSON(), id: conversation._id.toString() }
        });
    } catch (error) {
        console.error('Get messages error:', error);
        res.status(500).json({ error: 'Failed to get messages' });
    }
});

// Send message and get AI response
router.post('/project/:projectId/send', authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
        const validation = sendMessageSchema.safeParse(req.body);
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

        // Get project prompts
        const prompts = await Prompt.find({ projectId: project._id });

        const { message, conversationId } = validation.data;

        // Get or create conversation
        let conversation;
        if (conversationId) {
            conversation = await Conversation.findOne({
                _id: conversationId,
                projectId: project._id
            });
        }

        if (!conversation) {
            // Create new conversation with title from first message
            const title = message.substring(0, 50) + (message.length > 50 ? '...' : '');
            conversation = await Conversation.create({
                title,
                projectId: project._id
            });
        }

        // Save user message
        await Message.create({
            role: 'user',
            content: message,
            conversationId: conversation._id
        });

        // Get conversation history
        const history = await Message.find({ conversationId: conversation._id })
            .sort({ createdAt: 1 });

        // Build system prompt with project prompts
        let systemPrompt = project.systemPrompt;
        if (prompts.length > 0) {
            systemPrompt += '\n\nAdditional context:\n';
            prompts.forEach(p => {
                systemPrompt += `\n${p.name}:\n${p.content}\n`;
            });
        }

        // Get AI response
        const aiResponse = await sendChatMessage({
            model: project.aiModel,
            systemPrompt,
            messages: history.map(m => ({
                role: m.role as 'user' | 'assistant',
                content: m.content
            }))
        });

        // Save assistant message
        const assistantMessage = await Message.create({
            role: 'assistant',
            content: aiResponse,
            conversationId: conversation._id
        });

        // Update conversation timestamp
        await Conversation.updateOne(
            { _id: conversation._id },
            { $set: { updatedAt: new Date() } }
        );

        res.json({
            message: {
                ...assistantMessage.toJSON(),
                id: assistantMessage._id.toString()
            },
            conversationId: conversation._id.toString()
        });
    } catch (error) {
        console.error('Send message error:', error);
        res.status(500).json({ error: 'Failed to send message' });
    }
});

// Stream message response
router.post('/project/:projectId/stream', authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
        const validation = sendMessageSchema.safeParse(req.body);
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

        // Get project prompts
        const prompts = await Prompt.find({ projectId: project._id });

        const { message, conversationId } = validation.data;

        // Get or create conversation
        let conversation;
        if (conversationId) {
            conversation = await Conversation.findOne({
                _id: conversationId,
                projectId: project._id
            });
        }

        if (!conversation) {
            const title = message.substring(0, 50) + (message.length > 50 ? '...' : '');
            conversation = await Conversation.create({
                title,
                projectId: project._id
            });
        }

        // Save user message
        await Message.create({
            role: 'user',
            content: message,
            conversationId: conversation._id
        });

        // Get conversation history
        const history = await Message.find({ conversationId: conversation._id })
            .sort({ createdAt: 1 });

        // Build system prompt
        let systemPrompt = project.systemPrompt;
        if (prompts.length > 0) {
            systemPrompt += '\n\nAdditional context:\n';
            prompts.forEach(p => {
                systemPrompt += `\n${p.name}:\n${p.content}\n`;
            });
        }

        // Set up SSE
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');

        // Send conversation ID first
        res.write(`data: ${JSON.stringify({ type: 'conversationId', conversationId: conversation._id.toString() })}\n\n`);

        let fullResponse = '';

        // Stream AI response
        await streamChatMessage({
            model: project.aiModel,
            systemPrompt,
            messages: history.map(m => ({
                role: m.role as 'user' | 'assistant',
                content: m.content
            })),
            onChunk: (chunk) => {
                fullResponse += chunk;
                res.write(`data: ${JSON.stringify({ type: 'chunk', content: chunk })}\n\n`);
            }
        });

        // Save assistant message
        await Message.create({
            role: 'assistant',
            content: fullResponse,
            conversationId: conversation._id
        });

        // Update conversation timestamp
        await Conversation.updateOne(
            { _id: conversation._id },
            { $set: { updatedAt: new Date() } }
        );

        res.write(`data: ${JSON.stringify({ type: 'done' })}\n\n`);
        res.end();
    } catch (error) {
        console.error('Stream message error:', error);
        res.write(`data: ${JSON.stringify({ type: 'error', message: 'Failed to stream response' })}\n\n`);
        res.end();
    }
});

// Delete conversation
router.delete('/conversations/:conversationId', authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
        // Verify ownership
        const conversation = await Conversation.findById(req.params.conversationId);
        if (!conversation) {
            return res.status(404).json({ error: 'Conversation not found' });
        }

        const project = await Project.findOne({
            _id: conversation.projectId,
            userId: req.userId
        });

        if (!project) {
            return res.status(404).json({ error: 'Conversation not found' });
        }

        // Delete messages first
        await Message.deleteMany({ conversationId: conversation._id });

        // Delete conversation
        await Conversation.deleteOne({ _id: conversation._id });

        res.json({ message: 'Conversation deleted successfully' });
    } catch (error) {
        console.error('Delete conversation error:', error);
        res.status(500).json({ error: 'Failed to delete conversation' });
    }
});

export default router;
