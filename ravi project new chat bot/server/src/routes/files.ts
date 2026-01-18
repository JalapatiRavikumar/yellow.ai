import { Router, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';
import File from '../models/File.js';
import Project from '../models/Project.js';

const router = Router();

// Configure multer for file uploads
const uploadDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit
    },
    fileFilter: (req, file, cb) => {
        // Allow common file types
        const allowedTypes = [
            'text/plain',
            'text/markdown',
            'application/pdf',
            'application/json',
            'text/csv',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        ];

        if (allowedTypes.includes(file.mimetype) || file.mimetype.startsWith('text/')) {
            cb(null, true);
        } else {
            cb(new Error('File type not allowed'));
        }
    }
});

// Get files for a project
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

        const files = await File.find({ projectId: req.params.projectId })
            .sort({ createdAt: -1 })
            .lean();

        res.json({
            files: files.map(f => ({ ...f, id: f._id.toString() }))
        });
    } catch (error) {
        console.error('Get files error:', error);
        res.status(500).json({ error: 'Failed to get files' });
    }
});

// Upload file to project
router.post('/project/:projectId', authMiddleware, upload.single('file'), async (req: AuthRequest, res: Response) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        // Verify project ownership
        const project = await Project.findOne({
            _id: req.params.projectId,
            userId: req.userId
        });

        if (!project) {
            // Delete uploaded file
            fs.unlinkSync(req.file.path);
            return res.status(404).json({ error: 'Project not found' });
        }

        const file = await File.create({
            filename: req.file.filename,
            originalName: req.file.originalname,
            mimeType: req.file.mimetype,
            size: req.file.size,
            projectId: req.params.projectId
        });

        res.status(201).json({
            message: 'File uploaded successfully',
            file: {
                ...file.toJSON(),
                id: file._id.toString()
            }
        });
    } catch (error) {
        console.error('Upload file error:', error);
        if (req.file) {
            fs.unlinkSync(req.file.path);
        }
        res.status(500).json({ error: 'Failed to upload file' });
    }
});

// Download file
router.get('/:id/download', authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
        const file = await File.findById(req.params.id);
        if (!file) {
            return res.status(404).json({ error: 'File not found' });
        }

        const project = await Project.findOne({
            _id: file.projectId,
            userId: req.userId
        });

        if (!project) {
            return res.status(404).json({ error: 'File not found' });
        }

        const filePath = path.join(uploadDir, file.filename);

        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ error: 'File not found on disk' });
        }

        res.download(filePath, file.originalName);
    } catch (error) {
        console.error('Download file error:', error);
        res.status(500).json({ error: 'Failed to download file' });
    }
});

// Delete file
router.delete('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
        const file = await File.findById(req.params.id);
        if (!file) {
            return res.status(404).json({ error: 'File not found' });
        }

        const project = await Project.findOne({
            _id: file.projectId,
            userId: req.userId
        });

        if (!project) {
            return res.status(404).json({ error: 'File not found' });
        }

        // Delete from disk
        const filePath = path.join(uploadDir, file.filename);
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }

        // Delete from database
        await File.deleteOne({ _id: file._id });

        res.json({ message: 'File deleted successfully' });
    } catch (error) {
        console.error('Delete file error:', error);
        res.status(500).json({ error: 'Failed to delete file' });
    }
});

export default router;
