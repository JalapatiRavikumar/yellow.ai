import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuthStore } from '../store';
import './AdminDashboard.css';

interface User {
    id: string;
    name: string;
    email: string;
    role: string;
    createdAt: string;
    _count: {
        projects: number;
    };
}

interface Stats {
    users: number;
    projects: number;
    conversations: number;
    messages: number;
    files: number;
}

export default function AdminDashboard() {
    const { token, user: currentUser } = useAuthStore();
    const navigate = useNavigate();
    const [stats, setStats] = useState<Stats | null>(null);
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showResetModal, setShowResetModal] = useState<string | null>(null);
    const [newPassword, setNewPassword] = useState('');

    useEffect(() => {
        if (!currentUser || currentUser.role !== 'admin') {
            navigate('/dashboard');
            return;
        }
        fetchData();
    }, [currentUser, navigate]);

    const fetchData = async () => {
        try {
            const [statsRes, usersRes] = await Promise.all([
                axios.get('http://localhost:3001/api/admin/stats', {
                    headers: { Authorization: `Bearer ${token}` }
                }),
                axios.get('http://localhost:3001/api/admin/users', {
                    headers: { Authorization: `Bearer ${token}` }
                })
            ]);

            setStats(statsRes.data);
            setUsers(usersRes.data.users);
            setLoading(false);
        } catch (err) {
            console.error('Failed to fetch admin data:', err);
            setError('Failed to load dashboard data');
            setLoading(false);
        }
    };

    const handleDeleteUser = async (userId: string) => {
        if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) return;

        try {
            await axios.delete(`http://localhost:3001/api/admin/users/${userId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setUsers(users.filter(u => u.id !== userId));
        } catch (err) {
            console.error('Failed to delete user:', err);
            alert('Failed to delete user');
        }
    };

    const handleResetPassword = async () => {
        if (!showResetModal || !newPassword) return;

        try {
            await axios.put(`http://localhost:3001/api/admin/users/${showResetModal}/reset-password`,
                { newPassword },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            alert('Password reset successfully');
            setShowResetModal(null);
            setNewPassword('');
        } catch (err) {
            console.error('Failed to reset password:', err);
            alert('Failed to reset password');
        }
    };

    if (loading) return <div className="loading">Loading dashboard...</div>;
    if (error) return <div className="error">{error}</div>;

    return (
        <div className="admin-dashboard">
            <div className="admin-header">
                <h1>Admin Dashboard</h1>
                <p>Overview of platform usage and user management</p>
            </div>

            {stats && (
                <div className="stats-grid">
                    <div className="stat-card">
                        <h3>Total Users</h3>
                        <div className="value">{stats.users}</div>
                    </div>
                    <div className="stat-card">
                        <h3>Total Projects</h3>
                        <div className="value">{stats.projects}</div>
                    </div>
                    <div className="stat-card">
                        <h3>Conversations</h3>
                        <div className="value">{stats.conversations}</div>
                    </div>
                    <div className="stat-card">
                        <h3>Files</h3>
                        <div className="value">{stats.files}</div>
                    </div>
                </div>
            )}

            <div className="users-section">
                <div className="users-header">
                    <h2>Users Management</h2>
                </div>
                <table className="users-table">
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Email</th>
                            <th>Role</th>
                            <th>Projects</th>
                            <th>Joined</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map(user => (
                            <tr key={user.id}>
                                <td>{user.name}</td>
                                <td>{user.email}</td>
                                <td>
                                    <span className={`role-badge ${user.role}`}>
                                        {user.role}
                                    </span>
                                </td>
                                <td>{user._count.projects}</td>
                                <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                                <td>
                                    <div className="actions">
                                        <button
                                            className="action-btn reset"
                                            onClick={() => setShowResetModal(user.id)}
                                        >
                                            Reset Password
                                        </button>
                                        {user.role !== 'admin' && (
                                            <button
                                                className="action-btn delete"
                                                onClick={() => handleDeleteUser(user.id)}
                                            >
                                                Delete
                                            </button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {showResetModal && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h3>Reset Password</h3>
                        <p>Enter a new password for this user:</p>
                        <input
                            type="text"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            placeholder="New password"
                            style={{ width: '100%', padding: '0.5rem', marginTop: '1rem' }}
                        />
                        <div className="modal-actions">
                            <button
                                className="modal-btn cancel"
                                onClick={() => {
                                    setShowResetModal(null);
                                    setNewPassword('');
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                className="modal-btn confirm"
                                onClick={handleResetPassword}
                            >
                                Confirm Reset
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
