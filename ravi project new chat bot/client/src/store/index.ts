import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import axios from 'axios';

const API_URL = '/api';

// Types
export interface User {
    id: string;
    email: string;
    name: string;
    role: string;
    createdAt: string;
}

export interface Project {
    id: string;
    name: string;
    description?: string;
    systemPrompt: string;
    model: string;
    createdAt: string;
    updatedAt: string;
    _count?: {
        prompts: number;
        conversations: number;
        files: number;
    };
}

export interface Prompt {
    id: string;
    name: string;
    content: string;
    projectId: string;
    createdAt: string;
}

export interface Message {
    id: string;
    role: 'user' | 'assistant' | 'system';
    content: string;
    conversationId: string;
    createdAt: string;
}

export interface Conversation {
    id: string;
    title: string;
    projectId: string;
    createdAt: string;
    updatedAt: string;
    _count?: {
        messages: number;
    };
}

export interface FileItem {
    id: string;
    filename: string;
    originalName: string;
    mimeType: string;
    size: number;
    projectId: string;
    createdAt: string;
}

// Auth Store
interface AuthState {
    token: string | null;
    user: User | null;
    isLoading: boolean;
    error: string | null;

    login: (email: string, password: string) => Promise<void>;
    register: (name: string, email: string, password: string) => Promise<void>;
    logout: () => void;
    fetchUser: () => Promise<void>;
    clearError: () => void;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set, get) => ({
            token: null,
            user: null,
            isLoading: false,
            error: null,

            login: async (email: string, password: string) => {
                set({ isLoading: true, error: null });
                try {
                    const res = await axios.post(`${API_URL}/auth/login`, { email, password });
                    const { token, user } = res.data;
                    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
                    set({ token, user, isLoading: false });
                } catch (err: unknown) {
                    const error = err as { response?: { data?: { error?: string } } };
                    set({
                        error: error.response?.data?.error || 'Login failed',
                        isLoading: false
                    });
                    throw err;
                }
            },

            register: async (name: string, email: string, password: string) => {
                set({ isLoading: true, error: null });
                try {
                    const res = await axios.post(`${API_URL}/auth/register`, { name, email, password });
                    const { token, user } = res.data;
                    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
                    set({ token, user, isLoading: false });
                } catch (err: unknown) {
                    const error = err as { response?: { data?: { error?: string } } };
                    set({
                        error: error.response?.data?.error || 'Registration failed',
                        isLoading: false
                    });
                    throw err;
                }
            },

            logout: () => {
                delete axios.defaults.headers.common['Authorization'];
                set({ token: null, user: null });
            },

            fetchUser: async () => {
                const token = get().token;
                if (!token) return;

                axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
                try {
                    const res = await axios.get(`${API_URL}/auth/me`);
                    set({ user: res.data.user });
                } catch {
                    set({ token: null, user: null });
                }
            },

            clearError: () => set({ error: null })
        }),
        {
            name: 'auth-storage',
            partialize: (state) => ({ token: state.token })
        }
    )
);

// Projects Store
interface ProjectsState {
    projects: Project[];
    currentProject: Project | null;
    isLoading: boolean;
    error: string | null;

    fetchProjects: () => Promise<void>;
    fetchProject: (id: string) => Promise<void>;
    createProject: (data: { name: string; description?: string; systemPrompt?: string; model?: string }) => Promise<Project>;
    updateProject: (id: string, data: Partial<Project>) => Promise<void>;
    deleteProject: (id: string) => Promise<void>;
}

export const useProjectsStore = create<ProjectsState>((set, get) => ({
    projects: [],
    currentProject: null,
    isLoading: false,
    error: null,

    fetchProjects: async () => {
        set({ isLoading: true });
        try {
            const res = await axios.get(`${API_URL}/projects`);
            set({ projects: res.data.projects, isLoading: false });
        } catch {
            set({ error: 'Failed to fetch projects', isLoading: false });
        }
    },

    fetchProject: async (id: string) => {
        set({ isLoading: true });
        try {
            const res = await axios.get(`${API_URL}/projects/${id}`);
            set({ currentProject: res.data.project, isLoading: false });
        } catch {
            set({ error: 'Failed to fetch project', isLoading: false });
        }
    },

    createProject: async (data) => {
        const res = await axios.post(`${API_URL}/projects`, data);
        const newProject = res.data.project;
        set((state) => ({ projects: [newProject, ...state.projects] }));
        return newProject;
    },

    updateProject: async (id: string, data) => {
        const res = await axios.put(`${API_URL}/projects/${id}`, data);
        const updated = res.data.project;
        set((state) => ({
            projects: state.projects.map((p) => (p.id === id ? updated : p)),
            currentProject: state.currentProject?.id === id ? updated : state.currentProject
        }));
    },

    deleteProject: async (id: string) => {
        await axios.delete(`${API_URL}/projects/${id}`);
        set((state) => ({
            projects: state.projects.filter((p) => p.id !== id),
            currentProject: state.currentProject?.id === id ? null : state.currentProject
        }));
    }
}));

// Chat Store
interface ChatState {
    conversations: Conversation[];
    currentConversation: Conversation | null;
    messages: Message[];
    isLoading: boolean;
    isStreaming: boolean;
    streamingContent: string;

    fetchConversations: (projectId: string) => Promise<void>;
    fetchMessages: (conversationId: string) => Promise<void>;
    sendMessage: (projectId: string, message: string, conversationId?: string) => Promise<void>;
    streamMessage: (projectId: string, message: string, conversationId?: string) => Promise<void>;
    deleteConversation: (conversationId: string) => Promise<void>;
    clearChat: () => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
    conversations: [],
    currentConversation: null,
    messages: [],
    isLoading: false,
    isStreaming: false,
    streamingContent: '',

    fetchConversations: async (projectId: string) => {
        try {
            const res = await axios.get(`${API_URL}/chat/project/${projectId}/conversations`);
            set({ conversations: res.data.conversations });
        } catch {
            console.error('Failed to fetch conversations');
        }
    },

    fetchMessages: async (conversationId: string) => {
        set({ isLoading: true });
        try {
            const res = await axios.get(`${API_URL}/chat/conversations/${conversationId}/messages`);
            set({
                messages: res.data.messages,
                currentConversation: res.data.conversation,
                isLoading: false
            });
        } catch {
            set({ isLoading: false });
        }
    },

    sendMessage: async (projectId: string, message: string, conversationId?: string) => {
        set({ isLoading: true });

        // Optimistically add user message
        const userMessage: Message = {
            id: 'temp-' + Date.now(),
            role: 'user',
            content: message,
            conversationId: conversationId || '',
            createdAt: new Date().toISOString()
        };
        set((state) => ({ messages: [...state.messages, userMessage] }));

        try {
            const res = await axios.post(`${API_URL}/chat/project/${projectId}/send`, {
                message,
                conversationId
            });

            set((state) => ({
                messages: [...state.messages.filter(m => !m.id.startsWith('temp-')),
                { ...userMessage, id: 'user-' + Date.now() },
                res.data.message
                ],
                isLoading: false
            }));

            // Refresh conversations
            get().fetchConversations(projectId);
        } catch {
            set({ isLoading: false });
        }
    },

    streamMessage: async (projectId: string, message: string, conversationId?: string) => {
        set({ isStreaming: true, streamingContent: '' });

        // Add user message
        const userMessage: Message = {
            id: 'user-' + Date.now(),
            role: 'user',
            content: message,
            conversationId: conversationId || '',
            createdAt: new Date().toISOString()
        };
        set((state) => ({ messages: [...state.messages, userMessage] }));

        try {
            const token = useAuthStore.getState().token;
            const response = await fetch(`${API_URL}/chat/project/${projectId}/stream`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ message, conversationId })
            });

            const reader = response.body?.getReader();
            if (!reader) throw new Error('No reader');

            const decoder = new TextDecoder();
            let fullContent = '';
            let newConversationId = conversationId;

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const text = decoder.decode(value);
                const lines = text.split('\n');

                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        try {
                            const data = JSON.parse(line.slice(6));

                            if (data.type === 'conversationId') {
                                newConversationId = data.conversationId;
                            } else if (data.type === 'chunk') {
                                fullContent += data.content;
                                set({ streamingContent: fullContent });
                            } else if (data.type === 'done') {
                                const assistantMessage: Message = {
                                    id: 'assistant-' + Date.now(),
                                    role: 'assistant',
                                    content: fullContent,
                                    conversationId: newConversationId || '',
                                    createdAt: new Date().toISOString()
                                };
                                set((state) => ({
                                    messages: [...state.messages, assistantMessage],
                                    isStreaming: false,
                                    streamingContent: ''
                                }));
                                get().fetchConversations(projectId);
                            }
                        } catch {
                            // Skip invalid JSON
                        }
                    }
                }
            }
        } catch (error) {
            console.error('Stream error:', error);
            set({ isStreaming: false, streamingContent: '' });
        }
    },

    deleteConversation: async (conversationId: string) => {
        await axios.delete(`${API_URL}/chat/conversations/${conversationId}`);
        set((state) => ({
            conversations: state.conversations.filter((c) => c.id !== conversationId),
            currentConversation: state.currentConversation?.id === conversationId ? null : state.currentConversation,
            messages: state.currentConversation?.id === conversationId ? [] : state.messages
        }));
    },

    clearChat: () => {
        set({ currentConversation: null, messages: [], streamingContent: '' });
    }
}));
