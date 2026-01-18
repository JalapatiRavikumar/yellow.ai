import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useProjectsStore, useChatStore } from '../store';
import {
    Send,
    ArrowLeft,
    MessageSquare,
    Plus,
    Trash2,
    Settings,
    Bot,
    User,
    Sparkles
} from 'lucide-react';
import './Chat.css';

export default function Chat() {
    const { projectId } = useParams<{ projectId: string }>();
    const navigate = useNavigate();
    const { currentProject, fetchProject } = useProjectsStore();
    const {
        conversations,
        currentConversation,
        messages,
        isLoading,
        isStreaming,
        streamingContent,
        fetchConversations,
        fetchMessages,
        streamMessage,
        deleteConversation,
        clearChat
    } = useChatStore();

    const [input, setInput] = useState('');
    const [showSidebar, setShowSidebar] = useState(true);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        if (projectId) {
            fetchProject(projectId);
            fetchConversations(projectId);
        }
        return () => clearChat();
    }, [projectId, fetchProject, fetchConversations, clearChat]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, streamingContent]);

    const handleSend = async () => {
        if (!input.trim() || isStreaming || !projectId) return;

        const message = input.trim();
        setInput('');

        await streamMessage(projectId, message, currentConversation?.id);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const handleNewChat = () => {
        clearChat();
        inputRef.current?.focus();
    };

    const handleSelectConversation = (conversationId: string) => {
        fetchMessages(conversationId);
    };

    const handleDeleteConversation = async (conversationId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (window.confirm('Delete this conversation?')) {
            await deleteConversation(conversationId);
        }
    };

    return (
        <div className="chat-page">
            {/* Sidebar */}
            <aside className={`chat-sidebar ${showSidebar ? 'open' : ''}`}>
                <div className="sidebar-header">
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="back-btn"
                    >
                        <ArrowLeft size={18} />
                        <span>Back</span>
                    </button>
                </div>

                <button onClick={handleNewChat} className="btn btn-primary new-chat-btn">
                    <Plus size={18} />
                    New Chat
                </button>

                <div className="conversations-list">
                    <h3>Conversations</h3>
                    {conversations.length === 0 ? (
                        <p className="no-conversations">No conversations yet</p>
                    ) : (
                        conversations.map((conv) => (
                            <div
                                key={conv.id}
                                className={`conversation-item ${currentConversation?.id === conv.id ? 'active' : ''
                                    }`}
                                onClick={() => handleSelectConversation(conv.id)}
                            >
                                <MessageSquare size={16} />
                                <span className="conversation-title">{conv.title}</span>
                                <button
                                    onClick={(e) => handleDeleteConversation(conv.id, e)}
                                    className="delete-conv-btn"
                                >
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        ))
                    )}
                </div>

                <div className="sidebar-footer">
                    <button
                        onClick={() => navigate(`/project/${projectId}/settings`)}
                        className="settings-btn"
                    >
                        <Settings size={18} />
                        Project Settings
                    </button>
                </div>
            </aside>

            {/* Main Chat Area */}
            <main className="chat-main">
                <header className="chat-header">
                    <button
                        className="toggle-sidebar"
                        onClick={() => setShowSidebar(!showSidebar)}
                    >
                        <MessageSquare size={20} />
                    </button>
                    <div className="chat-header-info">
                        <h1>{currentProject?.name || 'Chat'}</h1>
                        <span className="model-badge">{currentProject?.model?.split('/')[1]}</span>
                    </div>
                </header>

                <div className="chat-messages">
                    {messages.length === 0 && !streamingContent ? (
                        <div className="chat-welcome">
                            <div className="welcome-icon">
                                <Sparkles size={40} />
                            </div>
                            <h2>Start a Conversation</h2>
                            <p>Send a message to begin chatting with your AI assistant.</p>
                            {currentProject?.systemPrompt && (
                                <div className="system-prompt-preview">
                                    <strong>System Prompt:</strong>
                                    <p>{currentProject.systemPrompt}</p>
                                </div>
                            )}
                        </div>
                    ) : (
                        <>
                            {messages.map((msg) => (
                                <div
                                    key={msg.id}
                                    className={`message ${msg.role === 'user' ? 'user' : 'assistant'}`}
                                >
                                    <div className="message-avatar">
                                        {msg.role === 'user' ? <User size={18} /> : <Bot size={18} />}
                                    </div>
                                    <div className="message-content">
                                        <div className="message-text">{msg.content}</div>
                                    </div>
                                </div>
                            ))}

                            {isStreaming && streamingContent && (
                                <div className="message assistant">
                                    <div className="message-avatar">
                                        <Bot size={18} />
                                    </div>
                                    <div className="message-content">
                                        <div className="message-text">{streamingContent}</div>
                                        <span className="streaming-indicator"></span>
                                    </div>
                                </div>
                            )}

                            {isStreaming && !streamingContent && (
                                <div className="message assistant">
                                    <div className="message-avatar">
                                        <Bot size={18} />
                                    </div>
                                    <div className="message-content">
                                        <div className="typing-indicator">
                                            <span></span>
                                            <span></span>
                                            <span></span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                <div className="chat-input-container">
                    <div className="chat-input-wrapper">
                        <textarea
                            ref={inputRef}
                            className="chat-input"
                            placeholder="Type your message..."
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            rows={1}
                            disabled={isStreaming}
                        />
                        <button
                            onClick={handleSend}
                            className="send-btn"
                            disabled={!input.trim() || isStreaming}
                        >
                            {isStreaming ? (
                                <div className="spinner"></div>
                            ) : (
                                <Send size={20} />
                            )}
                        </button>
                    </div>
                    <p className="input-hint">Press Enter to send, Shift+Enter for new line</p>
                </div>
            </main>
        </div>
    );
}
