import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store';
import { LogIn, Mail, Lock, AlertCircle, Sparkles } from 'lucide-react';
import './Auth.css';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const { login, isLoading, error, clearError } = useAuthStore();
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        clearError();

        try {
            await login(email, password);
            navigate('/dashboard');
        } catch {
            // Error is handled by store
        }
    };

    return (
        <div className="auth-page">
            <div className="auth-background">
                <div className="auth-glow auth-glow-1"></div>
                <div className="auth-glow auth-glow-2"></div>
            </div>

            <div className="auth-container">
                <div className="auth-header">
                    <div className="auth-logo">
                        <Sparkles size={32} />
                    </div>
                    <h1>Welcome Back</h1>
                    <p>Sign in to your ChatBot Platform account</p>
                </div>

                <form onSubmit={handleSubmit} className="auth-form">
                    {error && (
                        <div className="auth-error">
                            <AlertCircle size={18} />
                            <span>{error}</span>
                        </div>
                    )}

                    <div className="form-group">
                        <label className="form-label">Email Address</label>
                        <div className="input-wrapper">
                            <Mail size={18} className="input-icon" />
                            <input
                                type="email"
                                className="input input-with-icon"
                                placeholder="you@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Password</label>
                        <div className="input-wrapper">
                            <Lock size={18} className="input-icon" />
                            <input
                                type="password"
                                className="input input-with-icon"
                                placeholder="Enter your password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="btn btn-primary auth-submit"
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <div className="spinner"></div>
                        ) : (
                            <>
                                <LogIn size={18} />
                                Sign In
                            </>
                        )}
                    </button>
                </form>

                <div className="auth-footer">
                    <p>
                        Don't have an account?{' '}
                        <Link to="/register">Create one</Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
