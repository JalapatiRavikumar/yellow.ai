import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useProjectsStore } from '../store';
import axios from 'axios';
import {
    ArrowLeft,
    Save,
    Plus,
    Trash2,
    Upload,
    File,
    X
} from 'lucide-react';
import './ProjectSettings.css';

interface Prompt {
    id: string;
    name: string;
    content: string;
}

interface FileItem {
    id: string;
    originalName: string;
    mimeType: string;
    size: number;
    createdAt: string;
}

export default function ProjectSettings() {
    const { projectId } = useParams<{ projectId: string }>();
    const navigate = useNavigate();
    const { currentProject, fetchProject, updateProject } = useProjectsStore();

    const [formData, setFormData] = useState({
        name: '',
        description: '',
        systemPrompt: '',
        model: ''
    });
    const [prompts, setPrompts] = useState<Prompt[]>([]);
    const [files, setFiles] = useState<FileItem[]>([]);
    const [newPrompt, setNewPrompt] = useState({ name: '', content: '' });
    const [showPromptModal, setShowPromptModal] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isUploading, setIsUploading] = useState(false);

    useEffect(() => {
        if (projectId) {
            fetchProject(projectId);
            fetchPrompts();
            fetchFiles();
        }
    }, [projectId, fetchProject]);

    useEffect(() => {
        if (currentProject) {
            setFormData({
                name: currentProject.name,
                description: currentProject.description || '',
                systemPrompt: currentProject.systemPrompt,
                model: currentProject.model
            });
        }
    }, [currentProject]);

    const fetchPrompts = async () => {
        try {
            const res = await axios.get(`/api/prompts/project/${projectId}`);
            setPrompts(res.data.prompts);
        } catch (error) {
            console.error('Failed to fetch prompts:', error);
        }
    };

    const fetchFiles = async () => {
        try {
            const res = await axios.get(`/api/files/project/${projectId}`);
            setFiles(res.data.files);
        } catch (error) {
            console.error('Failed to fetch files:', error);
        }
    };

    const handleSave = async () => {
        if (!projectId) return;
        setIsSaving(true);
        try {
            await updateProject(projectId, formData);
            alert('Project saved successfully!');
        } catch (error) {
            console.error('Failed to save project:', error);
            alert('Failed to save project');
        }
        setIsSaving(false);
    };

    const handleCreatePrompt = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newPrompt.name.trim() || !newPrompt.content.trim()) return;

        try {
            await axios.post(`/api/prompts/project/${projectId}`, newPrompt);
            setNewPrompt({ name: '', content: '' });
            setShowPromptModal(false);
            fetchPrompts();
        } catch (error) {
            console.error('Failed to create prompt:', error);
        }
    };

    const handleDeletePrompt = async (promptId: string) => {
        if (!window.confirm('Delete this prompt?')) return;
        try {
            await axios.delete(`/api/prompts/${promptId}`);
            fetchPrompts();
        } catch (error) {
            console.error('Failed to delete prompt:', error);
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        const formData = new FormData();
        formData.append('file', file);

        try {
            await axios.post(`/api/files/project/${projectId}`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            fetchFiles();
        } catch (error) {
            console.error('Failed to upload file:', error);
            alert('Failed to upload file');
        }
        setIsUploading(false);
        e.target.value = '';
    };

    const handleDeleteFile = async (fileId: string) => {
        if (!window.confirm('Delete this file?')) return;
        try {
            await axios.delete(`/api/files/${fileId}`);
            fetchFiles();
        } catch (error) {
            console.error('Failed to delete file:', error);
        }
    };

    const formatFileSize = (bytes: number) => {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    };

    return (
        <div className="settings-page">
            <header className="settings-header">
                <button onClick={() => navigate(`/project/${projectId}/chat`)} className="back-btn">
                    <ArrowLeft size={18} />
                    Back to Chat
                </button>
                <h1>Project Settings</h1>
            </header>

            <main className="settings-main">
                <div className="settings-container">
                    {/* General Settings */}
                    <section className="settings-section">
                        <h2>General</h2>

                        <div className="form-group">
                            <label className="form-label">Project Name</label>
                            <input
                                type="text"
                                className="input"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">Description</label>
                            <input
                                type="text"
                                className="input"
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                placeholder="Optional description"
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">Model</label>
                            <select
                                className="input"
                                value={formData.model}
                                onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                            >
                                <option value="openai/gpt-3.5-turbo">GPT-3.5 Turbo</option>
                                <option value="openai/gpt-4">GPT-4</option>
                                <option value="openai/gpt-4-turbo">GPT-4 Turbo</option>
                                <option value="anthropic/claude-3-haiku">Claude 3 Haiku</option>
                                <option value="anthropic/claude-3-sonnet">Claude 3 Sonnet</option>
                                <option value="google/gemini-pro">Gemini Pro</option>
                                <option value="meta-llama/llama-2-70b-chat">Llama 2 70B</option>
                            </select>
                        </div>

                        <div className="form-group">
                            <label className="form-label">System Prompt</label>
                            <textarea
                                className="textarea"
                                value={formData.systemPrompt}
                                onChange={(e) => setFormData({ ...formData, systemPrompt: e.target.value })}
                                rows={5}
                                placeholder="Instructions for the AI..."
                            />
                        </div>

                        <button onClick={handleSave} className="btn btn-primary" disabled={isSaving}>
                            {isSaving ? <div className="spinner"></div> : <Save size={18} />}
                            Save Changes
                        </button>
                    </section>

                    {/* Prompts Section */}
                    <section className="settings-section">
                        <div className="section-header">
                            <h2>Prompts</h2>
                            <button
                                onClick={() => setShowPromptModal(true)}
                                className="btn btn-secondary btn-sm"
                            >
                                <Plus size={16} />
                                Add Prompt
                            </button>
                        </div>
                        <p className="section-description">
                            Add custom prompts to provide additional context for your AI agent.
                        </p>

                        {prompts.length === 0 ? (
                            <div className="empty-prompts">
                                <p>No prompts added yet</p>
                            </div>
                        ) : (
                            <div className="prompts-list">
                                {prompts.map((prompt) => (
                                    <div key={prompt.id} className="prompt-item">
                                        <div className="prompt-info">
                                            <h4>{prompt.name}</h4>
                                            <p>{prompt.content}</p>
                                        </div>
                                        <button
                                            onClick={() => handleDeletePrompt(prompt.id)}
                                            className="icon-btn danger"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>

                    {/* Files Section */}
                    <section className="settings-section">
                        <div className="section-header">
                            <h2>Files</h2>
                            <label className="btn btn-secondary btn-sm upload-btn">
                                <Upload size={16} />
                                {isUploading ? 'Uploading...' : 'Upload File'}
                                <input
                                    type="file"
                                    onChange={handleFileUpload}
                                    disabled={isUploading}
                                    hidden
                                />
                            </label>
                        </div>
                        <p className="section-description">
                            Upload files to associate knowledge with your project.
                        </p>

                        {files.length === 0 ? (
                            <div className="empty-prompts">
                                <p>No files uploaded yet</p>
                            </div>
                        ) : (
                            <div className="files-list">
                                {files.map((file) => (
                                    <div key={file.id} className="file-item">
                                        <File size={20} className="file-icon" />
                                        <div className="file-info">
                                            <span className="file-name">{file.originalName}</span>
                                            <span className="file-size">{formatFileSize(file.size)}</span>
                                        </div>
                                        <button
                                            onClick={() => handleDeleteFile(file.id)}
                                            className="icon-btn danger"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>
                </div>
            </main>

            {/* Add Prompt Modal */}
            {showPromptModal && (
                <div className="modal-overlay" onClick={() => setShowPromptModal(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Add Prompt</h2>
                            <button onClick={() => setShowPromptModal(false)} className="close-btn">
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleCreatePrompt}>
                            <div className="form-group">
                                <label className="form-label">Prompt Name</label>
                                <input
                                    type="text"
                                    className="input"
                                    value={newPrompt.name}
                                    onChange={(e) => setNewPrompt({ ...newPrompt, name: e.target.value })}
                                    placeholder="e.g., Company Info"
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Content</label>
                                <textarea
                                    className="textarea"
                                    value={newPrompt.content}
                                    onChange={(e) => setNewPrompt({ ...newPrompt, content: e.target.value })}
                                    placeholder="Enter the prompt content..."
                                    rows={5}
                                    required
                                />
                            </div>
                            <div className="modal-actions">
                                <button
                                    type="button"
                                    onClick={() => setShowPromptModal(false)}
                                    className="btn btn-secondary"
                                >
                                    Cancel
                                </button>
                                <button type="submit" className="btn btn-primary">
                                    Add Prompt
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
