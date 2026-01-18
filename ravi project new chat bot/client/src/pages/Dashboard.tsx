import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore, useProjectsStore } from '../store';
import {
    Plus,
    LogOut,
    MessageSquare,
    Settings,
    Trash2,
    Bot,
    Sparkles,
    Search
} from 'lucide-react';
import './Dashboard.css';

export default function Dashboard() {
    const { user, logout } = useAuthStore();
    const { projects, fetchProjects, createProject, deleteProject, isLoading } = useProjectsStore();
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [newProject, setNewProject] = useState({
        name: '',
        description: '',
        systemPrompt: 'You are a helpful AI assistant.',
        model: 'openai/gpt-3.5-turbo'
    });
    const navigate = useNavigate();

    useEffect(() => {
        fetchProjects();
    }, [fetchProjects]);

    const handleCreateProject = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newProject.name.trim()) return;

        try {
            const project = await createProject(newProject);
            setShowCreateModal(false);
            setNewProject({
                name: '',
                description: '',
                systemPrompt: 'You are a helpful AI assistant.',
                model: 'openai/gpt-3.5-turbo'
            });
            navigate(`/project/${project.id}/chat`);
        } catch (error) {
            console.error('Failed to create project:', error);
        }
    };

    const handleDeleteProject = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (window.confirm('Are you sure you want to delete this project?')) {
            await deleteProject(id);
        }
    };

    const filteredProjects = projects.filter(
        (p) =>
            p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.description?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="dashboard">
            <header className="dashboard-header">
                <div className="container header-content">
                    <div className="logo">
                        <Sparkles size={24} />
                        <span>ChatBot Platform</span>
                    </div>

                    <div className="header-actions">
                        <span className="user-name">Hello, {user?.name}</span>
                        <button onClick={logout} className="btn btn-secondary logout-btn">
                            <LogOut size={18} />
                            Logout
                        </button>
                    </div>
                </div>
            </header>

            <main className="dashboard-main">
                <div className="container">
                    <div className="dashboard-title-section">
                        <div>
                            <h1>Your Projects</h1>
                            <p>Create and manage your AI chatbot agents</p>
                        </div>

                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="btn btn-primary"
                        >
                            <Plus size={18} />
                            New Project
                        </button>
                    </div>

                    <div className="search-bar">
                        <Search size={18} className="search-icon" />
                        <input
                            type="text"
                            className="input"
                            placeholder="Search projects..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    {isLoading ? (
                        <div className="loading-state">
                            <div className="spinner large"></div>
                            <p>Loading projects...</p>
                        </div>
                    ) : filteredProjects.length === 0 ? (
                        <div className="empty-state">
                            <Bot size={64} className="empty-icon" />
                            <h2>No Projects Yet</h2>
                            <p>Create your first AI chatbot project to get started</p>
                            <button
                                onClick={() => setShowCreateModal(true)}
                                className="btn btn-primary"
                            >
                                <Plus size={18} />
                                Create Project
                            </button>
                        </div>
                    ) : (
                        <div className="projects-grid">
                            {filteredProjects.map((project) => (
                                <div
                                    key={project.id}
                                    className="project-card"
                                    onClick={() => navigate(`/project/${project.id}/chat`)}
                                >
                                    <div className="project-card-header">
                                        <div className="project-icon">
                                            <Bot size={24} />
                                        </div>
                                        <div className="project-actions">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    navigate(`/project/${project.id}/settings`);
                                                }}
                                                className="icon-btn"
                                                title="Settings"
                                            >
                                                <Settings size={18} />
                                            </button>
                                            <button
                                                onClick={(e) => handleDeleteProject(project.id, e)}
                                                className="icon-btn danger"
                                                title="Delete"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </div>

                                    <h3 className="project-name">{project.name}</h3>
                                    {project.description && (
                                        <p className="project-description">{project.description}</p>
                                    )}

                                    <div className="project-stats">
                                        <span>
                                            <MessageSquare size={14} />
                                            {project._count?.conversations || 0} chats
                                        </span>
                                        <span className="model-tag">{project.model?.split('/')[1] || project.model || 'Unknown'}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </main>

            {/* Create Project Modal */}
            {showCreateModal && (
                <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <h2>Create New Project</h2>
                        <form onSubmit={handleCreateProject}>
                            <div className="form-group">
                                <label className="form-label">Project Name *</label>
                                <input
                                    type="text"
                                    className="input"
                                    placeholder="My Chatbot"
                                    value={newProject.name}
                                    onChange={(e) =>
                                        setNewProject({ ...newProject, name: e.target.value })
                                    }
                                    required
                                    autoFocus
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Description</label>
                                <input
                                    type="text"
                                    className="input"
                                    placeholder="A helpful assistant for..."
                                    value={newProject.description}
                                    onChange={(e) =>
                                        setNewProject({ ...newProject, description: e.target.value })
                                    }
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">System Prompt</label>
                                <textarea
                                    className="textarea"
                                    placeholder="You are a helpful AI assistant..."
                                    value={newProject.systemPrompt}
                                    onChange={(e) =>
                                        setNewProject({ ...newProject, systemPrompt: e.target.value })
                                    }
                                    rows={3}
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Model</label>
                                <select
                                    className="input"
                                    value={newProject.model}
                                    onChange={(e) =>
                                        setNewProject({ ...newProject, model: e.target.value })
                                    }
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

                            <div className="modal-actions">
                                <button
                                    type="button"
                                    className="btn btn-secondary"
                                    onClick={() => setShowCreateModal(false)}
                                >
                                    Cancel
                                </button>
                                <button type="submit" className="btn btn-primary">
                                    <Plus size={18} />
                                    Create Project
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
