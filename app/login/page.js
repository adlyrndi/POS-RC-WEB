'use client';

import { useState, useContext } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { AuthContext, AuthProvider } from '@/context/AuthContext';
import GradientButton from '@/components/GradientButton';
import styles from './login.module.css';

function LoginForm() {
    const { login } = useContext(AuthContext);
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!email || !password) {
            setError('Please fill in all fields');
            return;
        }
        setLoading(true);
        setError('');
        try {
            await login(email, password);
            router.replace('/dashboard');
        } catch (err) {
            setError(err.response?.data?.error || 'Login failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.card}>
                {/* Header */}
                <div className={styles.header}>
                    <div className={styles.headerDecoration} />
                    <div className={styles.logoCircle}>
                        <Image
                            src="/MarkLogo-black.png"
                            alt="Logo"
                            width={42}
                            height={42}
                            priority
                        />
                    </div>
                    <h1 className={styles.brand}>ROOM COLLECTION</h1>
                    <p className={styles.subtitle}>Point of Sale System</p>
                </div>

                {/* Form */}
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
                        title="Sign In"
                        loading={loading}
                        onClick={handleSubmit}
                    />

                    <p className={styles.switchText}>
                        Don&apos;t have an account?{' '}
                        <a href="/signup" className={styles.switchLink}>Sign Up</a>
                    </p>
                </form>
            </div>
        </div>
    );
}

export default function LoginPage() {
    return (
        <AuthProvider>
            <LoginForm />
        </AuthProvider>
    );
}
