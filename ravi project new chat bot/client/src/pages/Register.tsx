import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store';
import { UserPlus, Mail, Lock, User, AlertCircle, Sparkles } from 'lucide-react';
import './Auth.css';

export default function Register() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [localError, setLocalError] = useState('');
    const { register, isLoading, error, clearError } = useAuthStore();
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        clearError();
        setLocalError('');

        if (password !== confirmPassword) {
            setLocalError('Passwords do not match');
            return;
        }

        if (password.length < 6) {
            setLocalError('Password must be at least 6 characters');
            return;
        }

        try {
            await register(name, email, password);
            navigate('/dashboard');
        } catch {
            // Error is handled by store
        }
    };

    const displayError = localError || error;

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
                    <h1>Create Account</h1>
                    <p>Start building your AI chatbots today</p>
                </div>

                <form onSubmit={handleSubmit} className="auth-form">
                    {displayError && (
                        <div className="auth-error">
                            <AlertCircle size={18} />
                            <span>{displayError}</span>
                        </div>
                    )}

                    <div className="form-group">
                        <label className="form-label">Full Name</label>
                        <div className="input-wrapper">
                            <User size={18} className="input-icon" />
                            <input
                                type="text"
                                className="input input-with-icon"
                                placeholder="John Doe"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                            />
                        </div>
                    </div>

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
                                placeholder="At least 6 characters"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Confirm Password</label>
                        <div className="input-wrapper">
                            <Lock size={18} className="input-icon" />
                            <input
                                type="password"
                                className="input input-with-icon"
                                placeholder="Confirm your password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
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
                                <UserPlus size={18} />
                                Create Account
                            </>
                        )}
                    </button>
                </form>

                <div className="auth-footer">
                    <p>
                        Already have an account?{' '}
                        <Link to="/login">Sign in</Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
