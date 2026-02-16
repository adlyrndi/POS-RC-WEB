'use client';

import { useState, useContext } from 'react';
import { useRouter } from 'next/navigation';
import { AuthContext, AuthProvider } from '@/context/AuthContext';
import GradientButton from '@/components/GradientButton';
import styles from './signup.module.css';

function SignupForm() {
    const { signup } = useContext(AuthContext);
    const router = useRouter();
    const [businessName, setBusinessName] = useState('');
    const [tenantCode, setTenantCode] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!businessName || !tenantCode || !email || !password) {
            setError('Please fill in all fields');
            return;
        }
        if (tenantCode.length !== 3) {
            setError('Tenant code must be exactly 3 characters');
            return;
        }
        setLoading(true);
        setError('');
        try {
            await signup(businessName, tenantCode.toUpperCase(), email, password);
            router.replace('/login');
        } catch (err) {
            setError(err.response?.data?.error || 'Signup failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.card}>
                <div className={styles.header}>
                    <div className={styles.headerDecoration} />
                    <div className={styles.logoCircle}>
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                            <circle cx="8.5" cy="7" r="4" />
                            <line x1="20" y1="8" x2="20" y2="14" />
                            <line x1="23" y1="11" x2="17" y2="11" />
                        </svg>
                    </div>
                    <h1 className={styles.brand}>Create Account</h1>
                    <p className={styles.subtitle}>Set up your business</p>
                </div>

                <form className={styles.form} onSubmit={handleSubmit}>
                    {error && (
                        <div className={styles.errorBox}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2">
                                <circle cx="12" cy="12" r="10" />
                                <line x1="15" y1="9" x2="9" y2="15" />
                                <line x1="9" y1="9" x2="15" y2="15" />
                            </svg>
                            <span>{error}</span>
                        </div>
                    )}

                    <div className={styles.field}>
                        <label className="form-label">Business Name</label>
                        <input
                            type="text"
                            className="form-input"
                            placeholder="Your business name"
                            value={businessName}
                            onChange={(e) => setBusinessName(e.target.value)}
                        />
                    </div>

                    <div className={styles.field}>
                        <label className="form-label">Tenant Code (3 letters)</label>
                        <input
                            type="text"
                            className="form-input"
                            placeholder="ABC"
                            value={tenantCode}
                            onChange={(e) => setTenantCode(e.target.value.slice(0, 3))}
                            maxLength={3}
                            style={{ textTransform: 'uppercase', letterSpacing: 4 }}
                        />
                    </div>

                    <div className={styles.field}>
                        <label className="form-label">Email</label>
                        <input
                            type="email"
                            className="form-input"
                            placeholder="your@email.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>

                    <div className={styles.field}>
                        <label className="form-label">Password</label>
                        <input
                            type="password"
                            className="form-input"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>

                    <GradientButton
                        type="submit"
                        title="Create Account"
                        loading={loading}
                        onClick={handleSubmit}
                    />

                    <p className={styles.switchText}>
                        Already have an account?{' '}
                        <a href="/login" className={styles.switchLink}>Sign In</a>
                    </p>
                </form>
            </div>
        </div>
    );
}

export default function SignupPage() {
    return (
        <AuthProvider>
            <SignupForm />
        </AuthProvider>
    );
}
